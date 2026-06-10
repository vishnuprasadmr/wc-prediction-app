import type { ReactNode } from 'react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== 'https://placeholder.supabase.co' &&
      !supabaseUrl.includes('your-project'),
  )
}

export function EnvGuard({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) return <>{children}</>

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page p-6 text-theme">
      <div className="max-w-md rounded-2xl border border-default bg-card p-6 shadow-card">
        <h1 className="text-lg font-bold text-simelabs">Configuration required</h1>
        <p className="mt-2 text-sm text-muted">
          Supabase environment variables are missing on this deployment. Add them in your host
          settings and redeploy.
        </p>
        <ul className="mt-4 space-y-1 font-mono text-xs text-subtle">
          <li>VITE_SUPABASE_URL</li>
          <li>VITE_SUPABASE_ANON_KEY</li>
          <li>VITE_LEAGUE_INVITE_CODE</li>
        </ul>
      </div>
    </div>
  )
}
