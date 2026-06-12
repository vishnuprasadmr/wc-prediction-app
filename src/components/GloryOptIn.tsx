import { supabase } from '../lib/supabase'

export function GloryOptIn({
  value,
  onSaved,
}: {
  value: boolean
  onSaved: () => void
}) {
  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ glory_opt_in: !value }).eq('id', user.id)
    onSaved()
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-card p-4">
      <input type="checkbox" checked={value} onChange={() => void toggle()} className="mt-1 rounded" />
      <div>
        <p className="text-sm font-medium">Join glory / shame wall</p>
        <p className="type-caption mt-0.5 text-muted">
          Opt in to show your boldest wrong picks on the leaderboard (0 pts, high-scoring predictions).
        </p>
      </div>
    </label>
  )
}
