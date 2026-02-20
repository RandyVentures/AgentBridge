function toKebab(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getAuthEnvVars(config) {
  const authVars = (config.auth && Array.isArray(config.auth.credentials))
    ? config.auth.credentials.map((credential) => credential.envVar)
    : [];

  return [...new Set(authVars)];
}

module.exports = {
  toKebab,
  getAuthEnvVars
};
