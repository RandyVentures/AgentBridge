# API-to-CLI Project Brief

## Working Name
- Recommended: `AgentBridge`
- NPM package (generator): `api-to-cli`
- Why this split: product name can be brandable, while npm name stays literal and searchable.

Other viable names:
- `APIBridge`
- `CLIForge`
- `Toolwire`

## Problem
Most APIs are not directly usable by AI agents. We want a generator that turns a REST API definition into:
1. an AI-agent-friendly CLI (JSON-first output), and
2. an MCP server exposing equivalent tools.

## What We Are Building (MVP)
- Input:
  - `api-to-cli.config.js` custom config (first)
  - OpenAPI support later
- Output:
  - Installable Node CLI
  - MCP server
- Core behavior:
  - JSON output by default
  - Consistent JSON error envelope
  - Shared auth handling (API key + bearer first)
  - Safe-by-default confirmations for destructive methods

## Explicit Non-Goals (MVP)
- Full OAuth/device flow in v1
- Every OpenAPI edge case in v1
- Multi-language generators in v1

## Demo API Choice (Free + Popular, No First-Party CLI)
Recommended demo target: **Trello REST API**
- Popular real product used by millions
- Free plan available
- Official REST API docs and auth flow
- No first-party Trello CLI from Atlassian (there are community CLIs, which is fine and reinforces the need)

Key references:
- API reference landing: https://developer.atlassian.com/cloud/trello/rest/
- API introduction (first calls, key + token): https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/
- Authorization details: https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/
- Pricing (Free plan): https://trello.com/pricing

## MVP Command Set for Trello Demo
- `trelloapi me`
- `trelloapi list-boards`
- `trelloapi list-cards --board-id <id>`
- `trelloapi create-card --list-id <id> --name <title> --yes`

## Build Sequence
1. Generator from custom config -> CLI output (GET-only)
2. Add POST/PUT/PATCH/DELETE with `--yes` guard
3. Generate MCP server from same config
4. Add OpenAPI parsing layer

## Immediate Next Step (Before Coding)
Finalize:
1. Product name (`AgentBridge` vs alternatives)
2. Package names (`api-to-cli`, `@randyventures/api-to-cli`, or other)
3. Trello as first official example API
