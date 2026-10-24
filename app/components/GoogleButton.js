// A plain <a>, not <Link>: the route redirects the whole page to Google.
export default function GoogleButton() {
  return (
    <>
      <div className="mt-5 flex items-center gap-3 text-sm font-semibold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-field" />or<span className="h-px flex-1 bg-field" />
      </div>
      <a href="/api/auth/google" className="btn btn-outline mt-5">Continue with Google</a>
    </>
  );
}
