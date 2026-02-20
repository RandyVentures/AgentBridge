# AgentBridge (`api-to-cli`)

Generate AI-agent-friendly CLIs from API configs.

## What It Does
AgentBridge takes an API config and generates artifacts that an AI agent can use immediately:
- A JSON-first CLI project
- A `SKILL.md` file with usage instructions
- A machine-readable `agentbridge.manifest.json`

This means anyone can create a CLI layer for an API, even if the API owner never ships one.

## Current Scope
- Generator commands:
  - `validate`
  - `generate`
  - `scaffold`
- Generated CLI support:
  - GET endpoints (MVP)
  - JSON output by default
  - JSON error envelope
  - Env-var auth injection (`header` or `query`)

## Project Location
- `/Users/randall/Developer/Src/Repos/api-to-cli`

## Core Commands

```bash
# 1) Validate config only
node ./bin/api-to-cli.js validate \
  --config ./examples/trello/api-to-cli.config.js

# 2) Generate only the CLI project
node ./bin/api-to-cli.js generate \
  --config ./examples/trello/api-to-cli.config.js \
  --output ./examples/trello/trelloapi-cli

# 3) Generate a full agent bundle (CLI + skill + manifest)
node ./bin/api-to-cli.js scaffold \
  --config ./examples/trello/api-to-cli.config.js \
  --output ./examples/trello/trelloapi-agent
```

## Scaffold Output Layout

```text
<output>/
  README.md
  agentbridge.manifest.json
  cli/
    package.json
    bin/<name>.js
    commands/*.js
    lib/client.js
    lib/output.js
    README.md
  skill/
    SKILL.md
```

## Architecture

```mermaid
flowchart LR
  C[api-to-cli.config.js] --> V[validate]
  C --> G[generate]
  C --> S[scaffold]
  G --> CLI[Generated CLI Project]
  S --> CLI2[cli/]
  S --> SK[skill/SKILL.md]
  S --> MF[agentbridge.manifest.json]
  MF --> AG[AI Agent]
  SK --> AG
  AG --> RUN[Run generated CLI commands]
  RUN --> API[Target REST API]
```

## How AI Agents Use This
1. Agent reads `agentbridge.manifest.json` to discover commands, params, auth env vars, and install steps.
2. Agent reads `skill/SKILL.md` for operating rules and command examples.
3. Agent executes the generated CLI and parses JSON stdout/stderr.

## Suggested Usage Flows

### Flow A: Local Personal Use (No API Owner Needed)
1. Write `api-to-cli.config.js` for the target API.
2. Run `scaffold`.
3. Set required auth env vars.
4. Let your agent use the generated CLI locally.

### Flow B: Team/Internal Use
1. Run `scaffold`.
2. Commit generated output to an internal repo.
3. Publish generated CLI to private npm registry (optional).
4. Point team agents to the shared skill + manifest.

### Flow C: Public Distribution
1. Generate CLI from API config.
2. Validate behavior, docs, and API ToS compliance.
3. Publish generated CLI package publicly.
4. Publish skill + manifest so agents can onboard automatically.

## Security Model
- Credentials are read from environment variables only.
- Generated CLIs do not persist credentials.
- Generated errors do not include auth headers or full URLs.
- Do not pass API keys/tokens as CLI flags.

## Example Config (Trello)
See `examples/trello/api-to-cli.config.js` for:
- query-based auth (`TRELLO_KEY`, `TRELLO_TOKEN`)
- path parameter endpoints
- generated command mapping

## Smoke Test

```bash
npm run test:smoke
```

This runs:
- `validate:trello`
- `generate:trello`
- `scaffold:trello`

## Notes
- Generated CLIs depend on `commander`.
- The generator currently targets CommonJS + Node runtime with `fetch` support.
- Planned next phases include MCP generation and OpenAPI input support.
