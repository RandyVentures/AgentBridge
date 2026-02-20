const { request } = require('../lib/client');
const output = require('../lib/output');

const command = {
  "name": "listcontacts",
  "description": "List contacts",
  "method": "GET",
  "path": "/contacts",
  "params": {
    "limit": {
      "type": "number",
      "required": false,
      "description": "Max contacts to return"
    }
  }
};

async function listcontacts(options) {
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
  run: listcontacts,
  command
};
