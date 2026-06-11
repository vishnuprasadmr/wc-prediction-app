export function AuthLoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="page-shell flex min-h-dvh flex-col items-center justify-center gap-4 safe-top safe-bottom">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-simelabs border-t-transparent"
        role="status"
        aria-label={message}
      />
      <p className="type-body-sm text-muted">{message}</p>
    </div>
  )
}
