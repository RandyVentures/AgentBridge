const fs = require('fs');

function toKebab(name) {
  return String(name)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toCamelCase(name) {
  return String(name).replace(/[-_]+([a-zA-Z0-9])/g, (_m, g1) => g1.toUpperCase());
}

function readOption(options, name) {
  if (Object.prototype.hasOwnProperty.call(options, name)) {
    return options[name];
  }

  const camel = toCamelCase(name);
  if (Object.prototype.hasOwnProperty.call(options, camel)) {
    return options[camel];
  }

  return undefined;
}

function coerceValue(value, type) {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  if (type === 'number') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Expected number but received: ${value}`);
    }
    return parsed;
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = String(value).toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }

    throw new Error(`Expected boolean but received: ${value}`);
  }

  return String(value);
}

function parseJsonText(raw, label) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    throw new Error(`Invalid JSON for ${label}`);
  }
}

function parseJsonBody(rawBody) {
  if (rawBody === undefined || rawBody === null || rawBody === '') {
    return null;
  }

  return parseJsonText(rawBody, '--body');
}

function parseBodyFromStdin(enabled) {
  if (!enabled) {
    return null;
  }

  const raw = fs.readFileSync(0, 'utf8').trim();
  if (!raw) {
    throw new Error('Expected JSON on stdin because --body-stdin was provided');
  }

  return parseJsonText(raw, '--body-stdin');
}

function buildRequestBody(command, options) {
  const requestBody = command.requestBody || null;
  if (!requestBody) {
    return null;
  }

  const direct = parseJsonBody(readOption(options, 'body'));
  const stdin = parseBodyFromStdin(Boolean(readOption(options, 'body-stdin')));

  if (direct !== null && stdin !== null) {
    throw new Error('Use either --body or --body-stdin, not both');
  }

  const properties = requestBody.properties || {};
  const hasBodyProps = Object.keys(properties).length > 0;

  let payload = direct !== null ? direct : stdin !== null ? stdin : hasBodyProps ? {} : null;
  if (payload !== null && (typeof payload !== 'object' || Array.isArray(payload))) {
    throw new Error('Request body must be a JSON object');
  }

  if (payload === null && requestBody.required) {
    throw new Error('Missing required request body. Provide --body, --body-stdin, or body field flags.');
  }

  let hadBodyFlag = false;
  Object.entries(properties).forEach(([propName, schema]) => {
    const optionName = `body-${toKebab(propName)}`;
    const raw = readOption(options, optionName);
    if (raw === undefined || raw === null || raw === '') {
      return;
    }

    if (payload === null) {
      payload = {};
    }

    payload[propName] = coerceValue(raw, schema.type);
    hadBodyFlag = true;
  });

  if (hasBodyProps) {
    if (payload === null) {
      payload = {};
    }

    Object.entries(properties).forEach(([propName, schema]) => {
      if (!schema.required) {
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(payload, propName) || payload[propName] === undefined || payload[propName] === null || payload[propName] === '') {
        const optionName = `--body-${toKebab(propName)}`;
        throw new Error(`Missing required request body field: ${optionName}`);
      }
    });
  }

  if (payload !== null) {
    const isEmptyObject = typeof payload === 'object' && !Array.isArray(payload) && Object.keys(payload).length === 0;
    if (isEmptyObject && !requestBody.required && !hadBodyFlag && direct === null && stdin === null) {
      return null;
    }
  }

  return payload;
}

async function request(command, options) {
  const auth = {
  "credentials": []
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
    const raw = readOption(options, name);

    if ((raw === undefined || raw === null || raw === '') && schema.required) {
      throw new Error(`Missing required parameter: --${name}`);
    }

    if (raw === undefined || raw === null || raw === '') {
      return;
    }

    const value = coerceValue(raw, schema.type);
    const token = `{${name}}`;

    if (resolvedPath.includes(token)) {
      resolvedPath = resolvedPath.replaceAll(token, encodeURIComponent(String(value)));
      return;
    }

    params.append(name, String(value));
  });

  const query = params.toString();
  const url = 'https://api.example-crm.com/v1' + resolvedPath + (query ? '?' + query : '');
  const requestBody = buildRequestBody(command, options);

  if (requestBody !== null) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: command.method,
    headers,
    body: requestBody !== null ? JSON.stringify(requestBody) : undefined
  });

  const text = await response.text();
  let responseBody = text;

  try {
    responseBody = text ? JSON.parse(text) : null;
  } catch (_err) {
    responseBody = text;
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.statusCode = response.status;
    error.responseBody = responseBody;
    throw error;
  }

  return responseBody;
}

module.exports = {
  request
};
