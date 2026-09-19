export const environment = {
  production: true,
  // Proxied by Vercel (see vercel.json) so the session cookies stay first-party: Safari blocks
  // cookies from a different site outright, whatever their SameSite attribute says.
  apiBaseUrl: '/api',
};
