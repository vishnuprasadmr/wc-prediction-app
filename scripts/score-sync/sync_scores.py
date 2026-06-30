#!/usr/bin/env python3
"""
Sync WC 2026 scores from FIFA's public calendar API into Supabase.

No API key required. Matches are keyed by MatchNumber → api_fixture_id (1999 + n).
Updating matches fires the DB trigger that recalculates prediction points and the leaderboard.

Usage:
  pip install -r scripts/score-sync/requirements.txt
  export SUPABASE_URL=...
  export SUPABASE_SERVICE_ROLE_KEY=...
  python scripts/score-sync/sync_scores.py
  python scripts/score-sync/sync_scores.py --dry-run
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

# ── FIFA WC 2026 ──────────────────────────────────────────────────────────────
FIFA_API = "https://api.fifa.com/api/v3/calendar/matches"
FIFA_SEASON_ID = "285023"
FIFA_COMPETITION_ID = "17"
MATCH_NUMBER_OFFSET = 1999  # api_fixture_id in our DB

# FIFA MatchStatus (v3) — see FIFA live/calendar responses
LIVE_STATUSES = {3, 4, 5, 6, 7, 8, 9}
FINISHED_STATUSES = {0, 10, 11}
POSTPONED_STATUSES = {12, 13, 14}

HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Simelabs-WC-Predictions/1.0 (score-sync)",
}


def load_config() -> tuple[str, str]:
    script_dir = Path(__file__).resolve().parent
    root = script_dir.parents[1]

    # Root .env (VITE_* for URL) then scripts/score-sync/.env (service role)
    load_dotenv(root / ".env")
    load_dotenv(script_dir / ".env", override=True)

    url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url:
        print(
            "Missing Supabase URL.\n"
            f"Add SUPABASE_URL or VITE_SUPABASE_URL to {root / '.env'}",
            file=sys.stderr,
        )
        sys.exit(1)

    if not key:
        print(
            "Missing SUPABASE_SERVICE_ROLE_KEY (not the anon key).\n"
            f"Add it to {script_dir / '.env'} — Supabase → Settings → API → service_role",
            file=sys.stderr,
        )
        sys.exit(1)

    return url.rstrip("/"), key


def map_fifa_status(match_status: int, home_score: int | None, away_score: int | None) -> str:
    if match_status in POSTPONED_STATUSES:
        return "postponed"
    if match_status in LIVE_STATUSES:
        return "live"
    if match_status in FINISHED_STATUSES:
        return "finished"
    if home_score is not None and away_score is not None and match_status not in (1, 2):
        return "finished"
    return "scheduled"


def extract_scores(fifa_match: dict[str, Any]) -> tuple[int | None, int | None]:
    home = fifa_match.get("HomeTeamScore")
    away = fifa_match.get("AwayTeamScore")
    if home is None:
        home_team = fifa_match.get("Home") or {}
        home = home_team.get("Score")
    if away is None:
        away_team = fifa_match.get("Away") or {}
        away = away_team.get("Score")
    return home, away


def extract_penalties(fifa_match: dict[str, Any]) -> tuple[int | None, int | None]:
    """Shootout totals — None unless the knockout tie went to penalties."""
    home = fifa_match.get("HomeTeamPenaltyScore")
    away = fifa_match.get("AwayTeamPenaltyScore")
    if home is None:
        home = (fifa_match.get("Home") or {}).get("PenaltyScore")
    if away is None:
        away = (fifa_match.get("Away") or {}).get("PenaltyScore")
    return home, away


def fetch_all_fifa_matches() -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    params: dict[str, str | int] = {
        "idCompetition": FIFA_COMPETITION_ID,
        "idSeason": FIFA_SEASON_ID,
        "count": 500,
        "language": "en",
    }

    while True:
        resp = requests.get(FIFA_API, params=params, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        data = resp.json()

        batch = data.get("Results") or []
        results.extend(batch)

        token = data.get("ContinuationToken")
        if not token:
            break
        params = {
            "idCompetition": FIFA_COMPETITION_ID,
            "idSeason": FIFA_SEASON_ID,
            "count": 500,
            "language": "en",
            "continuationToken": token,
        }

    return results


def supabase_headers(service_key: str) -> dict[str, str]:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def fetch_db_matches(supabase_url: str, service_key: str) -> dict[int, dict[str, Any]]:
    """Map api_fixture_id → row"""
    resp = requests.get(
        f"{supabase_url}/rest/v1/matches",
        params={
            "select": "id,api_fixture_id,manual_override,home_score,away_score,home_penalties,away_penalties,status,home_team,away_team,kickoff_at",
        },
        headers=supabase_headers(service_key),
        timeout=60,
    )
    resp.raise_for_status()
    rows = resp.json()
    return {row["api_fixture_id"]: row for row in rows}


def update_match(
    supabase_url: str,
    service_key: str,
    match_id: str,
    payload: dict[str, Any],
    dry_run: bool,
) -> bool:
    if dry_run:
        return True

    resp = requests.patch(
        f"{supabase_url}/rest/v1/matches",
        params={"id": f"eq.{match_id}"},
        json=payload,
        headers=supabase_headers(service_key),
        timeout=30,
    )
    if not resp.ok:
        print(f"  ✗ update failed: {resp.status_code} {resp.text}", file=sys.stderr)
        return False
    return True


def sync_scores(dry_run: bool = False, match_number: int | None = None) -> int:
    supabase_url, service_key = load_config()

    print("Fetching FIFA match data…")
    fifa_matches = fetch_all_fifa_matches()
    print(f"  {len(fifa_matches)} matches from FIFA")

    if match_number is not None:
        fifa_matches = [m for m in fifa_matches if m.get("MatchNumber") == match_number]
        if not fifa_matches:
            print(f"No FIFA match with MatchNumber={match_number}", file=sys.stderr)
            return 1

    print("Loading Supabase matches…")
    db_by_fixture = fetch_db_matches(supabase_url, service_key)
    print(f"  {len(db_by_fixture)} matches in database")

    updated = 0
    skipped_override = 0
    skipped_unchanged = 0
    not_in_db = 0

    for fm in fifa_matches:
        num = fm.get("MatchNumber")
        if num is None:
            continue

        api_fixture_id = MATCH_NUMBER_OFFSET + int(num)
        db_row = db_by_fixture.get(api_fixture_id)
        if not db_row:
            not_in_db += 1
            continue

        if db_row.get("manual_override"):
            skipped_override += 1
            continue

        home_score, away_score = extract_scores(fm)
        home_pens, away_pens = extract_penalties(fm)
        status = map_fifa_status(int(fm.get("MatchStatus", 1)), home_score, away_score)

        # Don't wipe scores for upcoming fixtures
        if status == "scheduled" and home_score is None and away_score is None:
            if db_row.get("status") == "scheduled":
                skipped_unchanged += 1
            continue

        payload = {
            "home_score": home_score,
            "away_score": away_score,
            "home_penalties": home_pens,
            "away_penalties": away_pens,
            "status": status,
            "score_source": "api",
        }

        changed = (
            db_row.get("home_score") != home_score
            or db_row.get("away_score") != away_score
            or db_row.get("home_penalties") != home_pens
            or db_row.get("away_penalties") != away_pens
            or db_row.get("status") != status
        )

        if not changed:
            skipped_unchanged += 1
            continue

        home_team = db_row.get("home_team", "?")
        away_team = db_row.get("away_team", "?")
        score_str = (
            f"{home_score}-{away_score}"
            if home_score is not None and away_score is not None
            else "—"
        )
        if home_pens is not None and away_pens is not None:
            score_str += f" ({home_pens}-{away_pens} pens)"
        prefix = "[dry-run] " if dry_run else ""
        print(f"{prefix}Match {num}: {home_team} vs {away_team} -> {score_str} ({status})")

        if update_match(supabase_url, service_key, db_row["id"], payload, dry_run):
            updated += 1

    print(
        f"\nDone: {updated} updated, {skipped_unchanged} unchanged, "
        f"{skipped_override} manual override, {not_in_db} not in DB"
    )
    print("Leaderboard points recalculate automatically via DB trigger.")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync FIFA scores into Supabase")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print changes without writing to Supabase",
    )
    parser.add_argument(
        "--match-number",
        type=int,
        metavar="N",
        help="Sync a single FIFA match number (1–104)",
    )
    args = parser.parse_args()
    sys.exit(sync_scores(dry_run=args.dry_run, match_number=args.match_number))


if __name__ == "__main__":
    main()
