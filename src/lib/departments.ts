export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'HR',
  'Finance',
  'Operations',
  'Sales',
  'Marketing',
  'Other',
] as const

export type Department = (typeof DEPARTMENTS)[number]
