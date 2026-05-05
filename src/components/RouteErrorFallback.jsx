import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

export default function RouteErrorFallback() {
  const error = useRouteError()
  let title = 'Something went wrong'
  let detail = ''

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) title = 'Page not found'
    detail = `${error.status} ${error.statusText || ''}`.trim()
    if (typeof error.data === 'string' && error.data) detail = `${detail}: ${error.data}`
  } else if (error instanceof Error) {
    detail = error.message
  } else if (error != null) {
    detail = String(error)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#0a0908] px-6 text-center font-sans text-stone-200">
      <h1 className="font-display text-2xl font-semibold tracking-wide text-stone-50">{title}</h1>
      {detail ? (
        <pre className="max-w-lg whitespace-pre-wrap break-words text-sm text-stone-500">{detail}</pre>
      ) : null}
      <Link
        to="/"
        className="text-stone-200 underline decoration-sage/45 underline-offset-4 hover:text-stone-50"
      >
        Back to home
      </Link>
    </div>
  )
}
