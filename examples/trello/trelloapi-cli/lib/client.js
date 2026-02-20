async function request(command, options) {
  const auth = {
  "credentials": [
    {
      "envVar": "TRELLO_KEY",
      "in": "query",
      "name": "key"
    },
    {
      "envVar": "TRELLO_TOKEN",
      "in": "query",
      "name": "token"
    }
  ]
};
  const params = new URLSearchParams();
  const commandParams = command.params || {};
  let resolvedPath = command.path;
  const headers = {
    accept: 'application/json'
  };

  (auth.credentials || []).forEach((credential) => {
    const envValue = process.env[credential.envVar];

    if (!envValue) {
      throw new Error(`Missing required auth environment variable: ${credential.envVar}`);
    }

    const authValue = credential.prefix ? `${credential.prefix}${envValue}` : envValue;

    if (credential.in === 'header') {
      headers[credential.name] = authValue;
      return;
    }

    params.append(credential.name, authValue);
  });

  Object.entries(commandParams).forEach(([name, schema]) => {
    const value = options[name];

    if ((value === undefined || value === null || value === '') && schema.required) {
      throw new Error(`Missing required parameter: --${name}`);
    }

    if (value === undefined || value === null || value === '') {
      return;
    }

    const token = `{${name}}`;

    if (resolvedPath.includes(token)) {
      resolvedPath = resolvedPath.replaceAll(token, encodeURIComponent(String(value)));
      return;
    }

    params.append(name, String(value));
  });

  const query = params.toString();
  const url = 'https://api.trello.com/1' + resolvedPath + (query ? '?' + query : '');

  const response = await fetch(url, {
    method: command.method,
    headers
  });

  const text = await response.text();
  let body = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (_err) {
    body = text;
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.statusCode = response.status;
    error.responseBody = body;
    throw error;
  }

  return body;
}

module.exports = {
  request
};
