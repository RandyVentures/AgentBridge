const { request } = require('../lib/client');
const output = require('../lib/output');

const command = {
  "name": "createcontact",
  "description": "Create contact",
  "method": "POST",
  "path": "/contacts",
  "params": {},
  "requestBody": {
    "required": true,
    "properties": {
      "name": {
        "type": "string",
        "required": true,
        "description": "Contact full name"
      },
      "email": {
        "type": "string",
        "required": false,
        "description": "Contact email"
      },
      "subscribed": {
        "type": "boolean",
        "required": false,
        "description": "Newsletter subscription status"
      }
    }
  }
};

async function createcontact(options) {
  try {
    if (command.method !== 'GET' && !options.yes) {
      throw new Error('This operation changes state. Re-run with --yes to confirm.');
    }

    const data = await request(command, options);
    output.json(data, Boolean(options.pretty));
  } catch (error) {
    output.error(
      {
        code: error.statusCode ? 'HTTP_ERROR' : 'REQUEST_FAILED',
        message: error.message,
        details: {
          statusCode: error.statusCode || null,
          command: command.name
        }
      },
      Boolean(options.pretty)
    );
    process.exit(1);
  }
}

module.exports = {
  run: createcontact,
  command
};
