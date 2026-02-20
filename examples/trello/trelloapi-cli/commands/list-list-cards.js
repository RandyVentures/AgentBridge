const { request } = require('../lib/client');
const output = require('../lib/output');

const command = {
  "name": "list-list-cards",
  "description": "List cards in a list",
  "method": "GET",
  "path": "/lists/{listId}/cards",
  "params": {
    "listId": {
      "type": "string",
      "required": true,
      "description": "Trello list ID"
    }
  }
};

async function listListCards(options) {
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
  run: listListCards,
  command
};
