#!/usr/bin/env python3
"""
Sync WC 2026 fixture teams (and kickoffs) from FIFA's public calendar API into Supabase.

Use after knockout bracket slots are filled (replaces TBD placeholders with actual teams).
Does not overwrite scores or manual_override rows.

Usage:
  python scripts/score-sync/sync_fixtures.py
  python scripts/score-sync/sync_fixtures.py --dry-run
"""

from __future__ import annotations

import argparse
import sys
from typing import Any

from sync_scores import (
    MATCH_NUMBER_OFFSET,
    fetch_all_fifa_matches,
    fetch_db_matches,
    load_config,
    supabase_headers,
    update_match,
)
import requests

# Canonical names used in our DB (see src/lib/flags.ts + scripts/official-schedule-data.mjs)
FIFA_CODE_TO_TEAM: dict[str, str] = {
    "ALG": "Algeria",
    "ARG": "Argentina",
    "AUS": "Australia",
    "AUT": "Austria",
    "BEL": "Belgium",
    "BIH": "Bosnia and Herzegovina",
    "BRA": "Brazil",
    "CAN": "Canada",
    "CIV": "Ivory Coast",
    "COL": "Colombia",
    "COD": "Congo DR",
    "CRO": "Croatia",
    "CUW": "Curaçao",
    "CZE": "Czechia",
    "ECU": "Ecuador",
    "EGY": "Egypt",
    "ENG": "England",
    "FRA": "France",
    "GER": "Germany",
    "GHA": "Ghana",
    "HAI": "Haiti",
    "IRN": "Iran",
    "IRQ": "Iraq",
    "JPN": "Japan",
    "JOR": "Jordan",
    "KOR": "South Korea",
    "KSA": "Saudi Arabia",
    "MAR": "Morocco",
    "MEX": "Mexico",
    "NED": "Netherlands",
    "NOR": "Norway",
    "NZL": "New Zealand",
    "PAN": "Panama",
    "PAR": "Paraguay",
    "POR": "Portugal",
    "QAT": "Qatar",
    "RSA": "South Africa",
    "SCO": "Scotland",
    "SEN": "Senegal",
    "ESP": "Spain",
    "SUI": "Switzerland",
    "SWE": "Sweden",
    "TUN": "Tunisia",
    "TUR": "Türkiye",
    "USA": "USA",
    "URU": "Uruguay",
    "UZB": "Uzbekistan",
    "CPV": "Cape Verde",
}

FIFA_NAME_TO_TEAM: dict[str, str] = {
    "Côte d'Ivoire": "Ivory Coast",
    "Cote d'Ivoire": "Ivory Coast",
    "Cabo Verde": "Cape Verde",
    "Cape Verde Islands": "Cape Verde",
    "Korea Republic": "South Korea",
    "Korea DPR": "South Korea",
    "IR Iran": "Iran",
    "Curaçao": "Curaçao",
    "Türkiye": "Türkiye",
    "TBD": "TBD",
}

TEAM_FLAGS: dict[str, str] = {
    "Mexico": "🇲🇽",
    "South Africa": "🇿🇦",
    "South Korea": "🇰🇷",
    "Czechia": "🇨🇿",
    "Canada": "🇨🇦",
    "Bosnia and Herzegovina": "🇧🇦",
    "Qatar": "🇶🇦",
    "Switzerland": "🇨🇭",
    "USA": "🇺🇸",
    "Paraguay": "🇵🇾",
    "Australia": "🇦🇺",
    "Türkiye": "🇹🇷",
    "Brazil": "🇧🇷",
    "Morocco": "🇲🇦",
    "Haiti": "🇭🇹",
    "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Germany": "🇩🇪",
    "Curaçao": "🇨🇼",
    "Ivory Coast": "🇨🇮",
    "Ecuador": "🇪🇨",
    "Netherlands": "🇳🇱",
    "Japan": "🇯🇵",
    "Sweden": "🇸🇪",
    "Tunisia": "🇹🇳",
    "Belgium": "🇧🇪",
    "Egypt": "🇪🇬",
    "Iran": "🇮🇷",
    "New Zealand": "🇳🇿",
    "Spain": "🇪🇸",
    "Cape Verde": "🇨🇻",
    "Saudi Arabia": "🇸🇦",
    "Uruguay": "🇺🇾",
    "France": "🇫🇷",
    "Senegal": "🇸🇳",
    "Iraq": "🇮🇶",
    "Norway": "🇳🇴",
    "Argentina": "🇦🇷",
    "Algeria": "🇩🇿",
    "Austria": "🇦🇹",
    "Jordan": "🇯🇴",
    "Portugal": "🇵🇹",
    "Congo DR": "🇨🇩",
    "Uzbekistan": "🇺🇿",
    "Colombia": "🇨🇴",
    "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Croatia": "🇭🇷",
    "Ghana": "🇬🇭",
    "Panama": "🇵🇦",
    "TBD": "🏳️",
}


def extract_fifa_label(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict):
                desc = item.get("Description")
                if isinstance(desc, str) and desc.strip():
                    return desc.strip()
    return None


def normalize_team_name(side: dict[str, Any] | None) -> str:
    if not side:
        return "TBD"

    code = side.get("IdCountry")
    if isinstance(code, str) and code in FIFA_CODE_TO_TEAM:
        return FIFA_CODE_TO_TEAM[code]

    label = extract_fifa_label(side.get("TeamName"))
    if label:
        return FIFA_NAME_TO_TEAM.get(label, label)

    if isinstance(code, str) and code:
        return code

    return "TBD"


def team_flag(team: str) -> str:
    return TEAM_FLAGS.get(team, "🏳️")


def fifa_kickoff_iso(fm: dict[str, Any]) -> str | None:
    dt = fm.get("Date")
    if not isinstance(dt, str) or not dt.strip():
        return None
    return dt.replace("+00:00", "Z") if dt.endswith("+00:00") else dt


def sync_fixtures(dry_run: bool = False) -> int:
    supabase_url, service_key = load_config()

    print("Fetching FIFA match data…")
    fifa_matches = fetch_all_fifa_matches()
    print(f"  {len(fifa_matches)} matches from FIFA")

    print("Loading Supabase matches…")
    db_by_fixture = fetch_db_matches(supabase_url, service_key)
    print(f"  {len(db_by_fixture)} matches in database")

    updated = 0
    skipped = 0
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

        home_team = normalize_team_name(fm.get("Home"))
        away_team = normalize_team_name(fm.get("Away"))
        home_flag = team_flag(home_team)
        away_flag = team_flag(away_team)
        kickoff_at = fifa_kickoff_iso(fm)

        db_kickoff = db_row.get("kickoff_at")
        if isinstance(db_kickoff, str):
            db_kickoff = db_kickoff.replace("+00:00", "Z")

        changed = (
            db_row.get("home_team") != home_team
            or db_row.get("away_team") != away_team
            or (kickoff_at is not None and db_kickoff != kickoff_at)
        )

        if not changed:
            skipped += 1
            continue

        payload: dict[str, Any] = {
            "home_team": home_team,
            "away_team": away_team,
            "home_flag": home_flag,
            "away_flag": away_flag,
        }
        if kickoff_at is not None:
            payload["kickoff_at"] = kickoff_at

        prefix = "[dry-run] " if dry_run else ""
        kickoff_note = f" @ {kickoff_at}" if kickoff_at and db_kickoff != kickoff_at else ""
        print(
            f"{prefix}Match {num}: "
            f"{db_row.get('home_team')} vs {db_row.get('away_team')} "
            f"-> {home_team} vs {away_team}{kickoff_note}"
        )

        if update_match(supabase_url, service_key, db_row["id"], payload, dry_run):
            updated += 1

    print(f"\nDone: {updated} updated, {skipped} unchanged, {not_in_db} not in DB")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync FIFA fixture teams into Supabase")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    sys.exit(sync_fixtures(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
