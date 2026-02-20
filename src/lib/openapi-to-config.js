const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validateConfig } = require('./load-config');

function isUrl(value) {
  return /^https?:\/\//i.test(String(value));
}

function readLocalFile(specPath) {
  const resolved = path.resolve(process.cwd(), specPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Spec file not found: ${resolved}`);
  }

  return fs.readFileSync(resolved, 'utf8');
}

async function readSpecText(specInput) {
  if (isUrl(specInput)) {
    const response = await fetch(String(specInput));
    if (!response.ok) {
      throw new Error(`Unable to fetch spec: HTTP ${response.status}`);
    }

    return response.text();
  }

  return readLocalFile(String(specInput));
}

function parseSpec(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return yaml.load(text);
  }
}

function resolveParameter(spec, parameter) {
  if (!parameter || typeof parameter !== 'object') {
    return null;
  }

  if (!parameter.$ref) {
    return parameter;
  }

  const match = String(parameter.$ref).match(/^#\/components\/parameters\/([^/]+)$/);
  if (!match) {
    throw new Error(`Unsupported parameter $ref: ${parameter.$ref}`);
  }

  const key = match[1];
  const resolved = spec.components && spec.components.parameters && spec.components.parameters[key];

  if (!resolved) {
    throw new Error(`Unable to resolve parameter ref: ${parameter.$ref}`);
  }

  return resolved;
}

function resolveSchema(spec, schema) {
  if (!schema || typeof schema !== 'object') {
    return null;
  }

  if (!schema.$ref) {
    return schema;
  }

  const match = String(schema.$ref).match(/^#\/components\/schemas\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const key = match[1];
  return spec.components && spec.components.schemas && spec.components.schemas[key];
}

function resolveRequestBody(spec, requestBody) {
  if (!requestBody || typeof requestBody !== 'object') {
    return null;
  }

  if (!requestBody.$ref) {
    return requestBody;
  }

  const match = String(requestBody.$ref).match(/^#\/components\/requestBodies\/([^/]+)$/);
  if (!match) {
    throw new Error(`Unsupported requestBody $ref: ${requestBody.$ref}`);
  }

  const key = match[1];
  const resolved = spec.components && spec.components.requestBodies && spec.components.requestBodies[key];

  if (!resolved) {
    throw new Error(`Unable to resolve requestBody ref: ${requestBody.$ref}`);
  }

  return resolved;
}

function dedupeParameters(parameters) {
  const map = new Map();

  parameters.forEach((parameter) => {
    if (!parameter || !parameter.name) {
      return;
    }

    const key = `${parameter.in}:${parameter.name}`;
    map.set(key, parameter);
  });

  return [...map.values()];
}

function inferTypeFromSchema(schema) {
  const resolved = schema && typeof schema === 'object' ? schema : {};
  if (resolved.type === 'integer' || resolved.type === 'number') {
    return 'number';
  }

  if (resolved.type === 'boolean') {
    return 'boolean';
  }

  return 'string';
}

function inferType(parameter) {
  return inferTypeFromSchema(parameter.schema || {});
}

function buildCommandName(method, routePath, operation) {
  if (operation.operationId && String(operation.operationId).trim()) {
    return String(operation.operationId)
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  const parts = routePath
    .split('/')
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return `by-${part.slice(1, -1)}`;
      }

      return part;
    });

  return [method.toLowerCase(), ...parts]
    .join('-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function extractRequestBody(spec, requestBody) {
  const resolved = resolveRequestBody(spec, requestBody);
  if (!resolved) {
    return undefined;
  }

  const content = resolved.content || {};
  const jsonContent = content['application/json'];
  if (!jsonContent || !jsonContent.schema) {
    return undefined;
  }

  const schema = resolveSchema(spec, jsonContent.schema) || jsonContent.schema;
  const request = {
    required: Boolean(resolved.required)
  };

  if (schema.type === 'object' && schema.properties && typeof schema.properties === 'object') {
    const required = new Set(Array.isArray(schema.required) ? schema.required : []);
    const properties = {};

    Object.entries(schema.properties).forEach(([name, propSchema]) => {
      const resolvedProp = resolveSchema(spec, propSchema) || propSchema;
      properties[name] = {
        type: inferTypeFromSchema(resolvedProp),
        required: required.has(name),
        description: (resolvedProp && resolvedProp.description) || `${name} field`
      };
    });

    request.properties = properties;
  }

  return request;
}

function operationToCommand(spec, method, routePath, operation) {
  const combinedParameters = dedupeParameters([
    ...((operation.__pathParameters || []).map((parameter) => resolveParameter(spec, parameter))),
    ...((operation.parameters || []).map((parameter) => resolveParameter(spec, parameter)))
  ]);

  const params = {};

  combinedParameters.forEach((parameter) => {
    if (!parameter || !parameter.name) {
      return;
    }

    if (parameter.in !== 'path' && parameter.in !== 'query') {
      return;
    }

    params[parameter.name] = {
      type: inferType(parameter),
      required: parameter.in === 'path' ? true : Boolean(parameter.required),
      description: parameter.description || `${parameter.name} (${parameter.in})`
    };
  });

  return {
    name: buildCommandName(method, routePath, operation),
    description: operation.summary || operation.description || `${method.toUpperCase()} ${routePath}`,
    method: method.toUpperCase(),
    path: routePath,
    params,
    requestBody: extractRequestBody(spec, operation.requestBody)
  };
}

function normalizeName(rawName) {
  return String(rawName)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toConfigFromSpec(spec, overrides = {}) {
  if (!spec || typeof spec !== 'object') {
    throw new Error('Invalid OpenAPI: spec must be an object');
  }

  const title = (spec.info && spec.info.title) || overrides.name;
  const version = overrides.version || (spec.info && spec.info.version) || '1.0.0';
  const server = (spec.servers && spec.servers[0] && spec.servers[0].url) || '';

  if (!title) {
    throw new Error('Missing CLI name: provide --name or include info.title in spec');
  }

  if (!server || !/^https?:\/\//.test(server)) {
    throw new Error('OpenAPI spec must include servers[0].url with http(s) base URL');
  }

  const paths = spec.paths && typeof spec.paths === 'object' ? spec.paths : {};
  const commands = [];
  const methods = ['get', 'post', 'put', 'patch', 'delete'];

  Object.entries(paths).forEach(([routePath, pathItem]) => {
    if (!pathItem || typeof pathItem !== 'object') {
      return;
    }

    methods.forEach((method) => {
      if (!pathItem[method] || typeof pathItem[method] !== 'object') {
        return;
      }

      const operation = {
        ...pathItem[method],
        __pathParameters: Array.isArray(pathItem.parameters) ? pathItem.parameters : []
      };

      commands.push(operationToCommand(spec, method, routePath, operation));
    });
  });

  if (commands.length === 0) {
    throw new Error('No supported operations found in OpenAPI spec');
  }

  const config = {
    name: normalizeName(title),
    version: String(version),
    apiBase: String(server).replace(/\/$/, ''),
    commands
  };

  validateConfig(config);

  return config;
}

async function loadConfigFromOpenApi({ specInput, name, version }) {
  if (!specInput) {
    throw new Error('Missing required flag: --spec <path-or-url>');
  }

  const text = await readSpecText(specInput);
  const spec = parseSpec(text);

  if (!spec || typeof spec !== 'object') {
    throw new Error('Failed to parse OpenAPI spec');
  }

  return toConfigFromSpec(spec, { name, version });
}

module.exports = {
  loadConfigFromOpenApi
};
