/**
 * Vercel Routing Middleware: proxies the backend for each deployment. vercel.json rewrites cannot
 * read environment variables, so the destination lives here and `BACKEND_URL` (an origin) is set
 * per Vercel environment — Production for `main`, Preview scoped to the `dev` branch.
 *
 * `/api` drops its prefix; `/auth` keeps it because the server scopes the refresh cookie to
 * `Path=/auth`, and behind a different path the browser would never send it back.
 */
export const config = { matcher: ['/api/:path*', '/auth/:path*'] };

export default function middleware(request: Request): Response {
  const backend = process.env['BACKEND_URL'];
  if (!backend) {
    throw new Error('BACKEND_URL is not set for this deployment');
  }
  const { pathname, search } = new URL(request.url);
  const path = pathname.startsWith('/api') ? pathname.slice('/api'.length) : pathname;
  // The header @vercel/functions' rewrite() sets, written by hand to skip its 15 transitive packages.
  return new Response(null, {
    headers: { 'x-middleware-rewrite': new URL(path + search, backend).href },
  });
}
