export const environment = {
  production: true,
  // Proxied by Netlify (see netlify.toml) so the session cookies stay first-party: Safari blocks
  // cookies from a different site outright, whatever their SameSite attribute says.
  apiBaseUrl: '/api',
};
