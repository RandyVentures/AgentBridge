const { request } = require('../lib/client');
const output = require('../lib/output');

const command = {
  "name": "get-board",
  "description": "Get a board by ID",
  "method": "GET",
  "path": "/boards/{boardId}",
  "params": {
    "boardId": {
      "type": "string",
      "required": true,
      "description": "Trello board ID"
    }
  }
};

async function getBoard(options) {
  try {
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
  run: getBoard,
  command
};
