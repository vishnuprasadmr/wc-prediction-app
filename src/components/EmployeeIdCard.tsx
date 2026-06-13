import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../lib/types'
import { supabase } from '../lib/supabase'
import {
  EMPLOYEE_ID_PLACEHOLDER,
  isSimelabsEmployee,
  validateEmployeeId,
  assertEmployeeIdAvailableForUser,
} from '../lib/employeeId'

export function EmployeeIdCard({
  value,
  onSaved,
}: {
  value?: string | null
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [employeeId, setEmployeeId] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = employeeId.trim() ? validateEmployeeId(employeeId) : null
  const fieldError = check && !check.valid ? check.message : null

  const save = async () => {
    if (!user) return
    if (!employeeId.trim()) {
      setError('Enter your SML ID or cancel.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const normalized = await assertEmployeeIdAvailableForUser(employeeId, user.id)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ employee_id: normalized })
        .eq('id', user.id)
      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('This employee ID is already registered.')
        }
        throw updateError
      }
      await supabase.auth.updateUser({ data: { employee_id: normalized } })
      setEditing(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save employee ID')
    } finally {
      setSaving(false)
    }
  }

  if (value && isSimelabsEmployee({ employee_id: value } as Profile) && !editing) {
    return (
      <div className="rounded-xl bg-card p-4">
        <p className="type-label">Simelabs employee</p>
        <p className="type-caption mt-1 font-mono text-simelabs">{value}</p>
        <p className="type-caption mt-2 text-muted">You can view the Simelabs point table.</p>
      </div>
    )
  }

  if (!editing) {
    return (
      <div className="rounded-xl bg-card p-4">
        <p className="type-label">Simelabs employee ID</p>
        <p className="type-caption mt-1 text-muted text-pretty">
          Simelabs staff only — unlocks the private Simelabs point table.
        </p>
        <button
          type="button"
          onClick={() => {
            setEmployeeId(value ?? '')
            setEditing(true)
            setError(null)
          }}
          className="mt-3 text-sm font-medium text-simelabs hover:underline"
        >
          Add SML ID
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card p-4">
      <p className="type-label mb-2">Simelabs employee ID</p>
      <input
        type="text"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
        className="input-field font-mono uppercase tracking-wide"
        placeholder={EMPLOYEE_ID_PLACEHOLDER}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={Boolean(fieldError)}
      />
      {fieldError && <p className="type-caption mt-1.5 text-red-400">{fieldError}</p>}
      {error && <p className="type-caption mt-1.5 text-red-400">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !check?.valid}
          className="btn-primary flex-1 py-2 text-sm"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setError(null)
          }}
          className="rounded-xl bg-muted px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
