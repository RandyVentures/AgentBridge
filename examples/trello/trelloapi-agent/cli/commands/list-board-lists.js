const { request } = require('../lib/client');
const output = require('../lib/output');

const command = {
  "name": "list-board-lists",
  "description": "List lists on a board",
  "method": "GET",
  "path": "/boards/{boardId}/lists",
  "params": {
    "boardId": {
      "type": "string",
      "required": true,
      "description": "Trello board ID"
    }
  }
};

async function listBoardLists(options) {
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
  run: listBoardLists,
  command
};
