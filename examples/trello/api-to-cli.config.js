module.exports = {
  name: 'trelloapi',
  version: '1.0.0',
  apiBase: 'https://api.trello.com/1',
  auth: {
    credentials: [
      {
        envVar: 'TRELLO_KEY',
        in: 'query',
        name: 'key'
      },
      {
        envVar: 'TRELLO_TOKEN',
        in: 'query',
        name: 'token'
      }
    ]
  },
  commands: [
    {
      name: 'get-board',
      description: 'Get a board by ID',
      method: 'GET',
      path: '/boards/{boardId}',
      params: {
        boardId: {
          type: 'string',
          required: true,
          description: 'Trello board ID'
        }
      }
    },
    {
      name: 'list-board-lists',
      description: 'List lists on a board',
      method: 'GET',
      path: '/boards/{boardId}/lists',
      params: {
        boardId: {
          type: 'string',
          required: true,
          description: 'Trello board ID'
        }
      }
    },
    {
      name: 'list-list-cards',
      description: 'List cards in a list',
      method: 'GET',
      path: '/lists/{listId}/cards',
      params: {
        listId: {
          type: 'string',
          required: true,
          description: 'Trello list ID'
        }
      }
    }
  ]
};
