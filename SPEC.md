# AgentBridge MVP Spec

## Location
- Project folder: `/Users/randall/Developer/Src/Repos/api-to-cli`
- This is independent from `/Users/randall/Developer/Src/Repos/Will`

## Product Identity
- Product name: `AgentBridge`
- Generator package name: `api-to-cli`

## Goal
Given a config file describing API endpoints, generate:
1. a JSON-first CLI, and
2. an MCP server exposing matching tools.

## Demo API (First Example)
- Trello REST API
- Why: popular, free tier, official docs, no first-party Trello CLI from Atlassian

## MVP Scope (Current)
- Input:
  - `api-to-cli.config.js`
- Generator commands:
  - `validate`
  - `generate`
- Output:
  - generated CLI project
- Endpoint support:
  - GET only
- Auth support:
  - env-var credentials injected into header or query

## CLI Behavior Requirements
- Every command prints valid JSON to stdout on success.
- Every failure prints JSON in this shape:
```json
{
  "error": true,
  "code": "REQUEST_FAILED",
  "message": "...",
  "details": {}
}
```
- Exit code:
  - `0` on success
  - non-zero on error

## Security Requirements
- Credentials must come from environment variables only.
- Generated code must not write credentials to files.
- Error output must not include auth headers, tokens, or full request URLs.

## Generated Project Structure (MVP)
```text
<name>-cli/
  package.json
  bin/<name>
  commands/*.js
  lib/client.js
  lib/output.js
```

## Config Shape (MVP)
```js
module.exports = {
  name: "trelloapi",
  version: "1.0.0",
  apiBase: "https://api.trello.com/1",
  auth: {
    credentials: [
      { envVar: "TRELLO_KEY", in: "query", name: "key" },
      { envVar: "TRELLO_TOKEN", in: "query", name: "token" }
    ]
  },
  commands: [
    {
      name: "get-board",
      description: "Get a board by ID",
      method: "GET",
      path: "/boards/{boardId}",
      params: {
        boardId: { type: "string", required: true }
      }
    }
  ]
};
```

## Out of Scope for MVP
- OpenAPI parsing
- MCP generation
- POST/PUT/PATCH/DELETE
- confirmation prompts (`--yes`)
- OAuth flow

## Success Criteria
- `api-to-cli validate --config <file>` validates and returns summary JSON.
- `api-to-cli generate --config <file> --output <dir>` creates runnable CLI.
- Generated CLI executes GET commands and emits valid JSON success/error output.
