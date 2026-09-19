export const environment = {
  production: true,
  // Proxied by Vercel (see vercel.json) so the session cookies stay first-party: Safari blocks
  // cookies from a different site outright, whatever their SameSite attribute says.
  apiBaseUrl: '/api',
  // The proxy mounts `/auth` at the root instead of under `/api` because the server scopes the
  // refresh cookie to `Path=/auth`. Behind a prefix the browser would store it and never send it.
  authBaseUrl: '/auth',
};
