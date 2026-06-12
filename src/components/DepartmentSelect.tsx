import { DEPARTMENTS } from '../lib/departments'
import { supabase } from '../lib/supabase'

export function DepartmentSelect({
  value,
  onSaved,
}: {
  value: string | null | undefined
  onSaved: () => void
}) {
  const save = async (department: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ department: department || null }).eq('id', user.id)
    onSaved()
  }

  return (
    <div className="rounded-xl bg-card p-4">
      <label className="type-label mb-2 block">Department</label>
      <select
        value={value ?? ''}
        onChange={(e) => void save(e.target.value)}
        className="w-full rounded-lg border border-default bg-elevated px-3 py-2 text-sm outline-none focus:border-simelabs"
      >
        <option value="">Not set</option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <p className="type-caption mt-2 text-muted">Used for department leaderboard filter</p>
    </div>
  )
}
