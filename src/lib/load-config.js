const fs = require('fs');
const path = require('path');

function fail(message) {
  throw new Error(`Invalid config: ${message}`);
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function validateAuthCredential(credential, index) {
  if (!isObject(credential)) {
    fail(`auth.credentials[${index}] must be an object`);
  }

  if (!isNonEmptyString(credential.envVar)) {
    fail(`auth.credentials[${index}].envVar must be a non-empty string`);
  }

  if (credential.in !== 'header' && credential.in !== 'query') {
    fail(`auth.credentials[${index}].in must be either "header" or "query"`);
  }

  if (!isNonEmptyString(credential.name)) {
    fail(`auth.credentials[${index}].name must be a non-empty string`);
  }

  if (credential.prefix !== undefined && typeof credential.prefix !== 'string') {
    fail(`auth.credentials[${index}].prefix must be a string when provided`);
  }
}

function validateAuth(auth) {
  if (!isObject(auth)) {
    fail('auth must be an object when provided');
  }

  if (!Array.isArray(auth.credentials) || auth.credentials.length === 0) {
    fail('auth.credentials must be a non-empty array when auth is provided');
  }

  auth.credentials.forEach(validateAuthCredential);
}

function validateCommand(command, index) {
  if (!isObject(command)) {
    fail(`commands[${index}] must be an object`);
  }

  if (!isNonEmptyString(command.name)) {
    fail(`commands[${index}].name must be a non-empty string`);
  }

  if (!isNonEmptyString(command.description)) {
    fail(`commands[${index}].description must be a non-empty string`);
  }

  const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  if (!allowedMethods.has(command.method)) {
    fail(`commands[${index}].method must be one of: GET, POST, PUT, PATCH, DELETE`);
  }

  if (typeof command.path !== 'string' || !command.path.startsWith('/')) {
    fail(`commands[${index}].path must be a string starting with /`);
  }

  if (command.params !== undefined && !isObject(command.params)) {
    fail(`commands[${index}].params must be an object when provided`);
  }

  if (command.requestBody !== undefined) {
    if (!isObject(command.requestBody)) {
      fail(`commands[${index}].requestBody must be an object when provided`);
    }

    if (command.requestBody.required !== undefined && typeof command.requestBody.required !== 'boolean') {
      fail(`commands[${index}].requestBody.required must be a boolean when provided`);
    }

    if (command.requestBody.properties !== undefined) {
      if (!isObject(command.requestBody.properties)) {
        fail(`commands[${index}].requestBody.properties must be an object when provided`);
      }

      Object.entries(command.requestBody.properties).forEach(([propName, propSchema]) => {
        if (!isObject(propSchema)) {
          fail(`commands[${index}].requestBody.properties.${propName} must be an object`);
        }

        if (propSchema.required !== undefined && typeof propSchema.required !== 'boolean') {
          fail(`commands[${index}].requestBody.properties.${propName}.required must be boolean`);
        }
      });
    }
  }
}

function validateConfig(config) {
  if (!isObject(config)) {
    fail('config must export an object');
  }

  if (!isNonEmptyString(config.name)) {
    fail('name must be a non-empty string');
  }

  if (!isNonEmptyString(config.version)) {
    fail('version must be a non-empty string');
  }

  if (typeof config.apiBase !== 'string' || !/^https?:\/\//.test(config.apiBase)) {
    fail('apiBase must be an http(s) URL');
  }

  if (!Array.isArray(config.commands) || config.commands.length === 0) {
    fail('commands must be a non-empty array');
  }

  if (config.auth !== undefined) {
    validateAuth(config.auth);
  }

  const commandNames = new Set();
  config.commands.forEach((command, index) => {
    if (commandNames.has(command.name)) {
      fail(`commands[${index}].name duplicates an existing command: ${command.name}`);
    }
    commandNames.add(command.name);
  });

  config.commands.forEach(validateCommand);
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const resolved = path.resolve(configPath);
  delete require.cache[resolved];
  const config = require(resolved);

  validateConfig(config);

  return config;
}

module.exports = {
  loadConfig,
  validateConfig
};
