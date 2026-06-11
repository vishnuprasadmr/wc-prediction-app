import { supabase } from './supabase'
import type { Profile } from './types'

export const EMPLOYEE_ID_PLACEHOLDER = 'SML 457'

export function isSimelabsEmployee(profile: Profile | null | undefined): boolean {
  if (!profile?.employee_id) return false
  return validateEmployeeId(profile.employee_id).valid
}
export function validateEmployeeId(input: string):
  | { valid: true; normalized: string }
  | { valid: false; message: string } {
  const compact = input.trim().toUpperCase().replace(/\s+/g, '')
  const match = /^SML(\d+)$/.exec(compact)

  if (!match) {
    return {
      valid: false,
      message: 'Employee ID must start with SML followed by a number (e.g. SML 457).',
    }
  }

  const num = Number(match[1])
  if (!Number.isInteger(num) || num < 0 || num > 1000) {
    return {
      valid: false,
      message: 'Employee ID number must be between 0 and 1000.',
    }
  }

  return { valid: true, normalized: `SML ${num}` }
}

export async function isEmployeeIdTaken(employeeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('employee_id', employeeId)
    .maybeSingle()

  if (error) {
    console.error('Failed to check employee ID:', error.message)
    throw new Error('Could not verify employee ID. Please try again.')
  }

  return Boolean(data)
}

export async function isEmployeeIdTakenByOther(
  employeeId: string,
  userId: string,
): Promise<boolean> {
  const parsed = validateEmployeeId(employeeId)
  if (!parsed.valid) return false

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('employee_id', parsed.normalized)
    .maybeSingle()

  if (error) {
    console.error('Failed to check employee ID:', error.message)
    throw new Error('Could not verify employee ID. Please try again.')
  }

  return Boolean(data && data.id !== userId)
}

export async function assertEmployeeIdAvailable(employeeId: string): Promise<string> {
  const parsed = validateEmployeeId(employeeId)
  if (!parsed.valid) throw new Error(parsed.message)

  if (await isEmployeeIdTaken(parsed.normalized)) {
    throw new Error('This employee ID is already registered.')
  }

  return parsed.normalized
}

export async function assertEmployeeIdAvailableForUser(
  employeeId: string,
  userId: string,
): Promise<string> {
  const parsed = validateEmployeeId(employeeId)
  if (!parsed.valid) throw new Error(parsed.message)

  if (await isEmployeeIdTakenByOther(parsed.normalized, userId)) {
    throw new Error('This employee ID is already registered.')
  }

  return parsed.normalized
}
