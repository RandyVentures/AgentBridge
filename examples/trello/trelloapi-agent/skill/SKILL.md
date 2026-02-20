# trelloapi CLI Skill

## Purpose
Use the generated trelloapi CLI from AgentBridge. Always prefer JSON output for machine parsing.

## Location
- CLI project: /Users/randall/Developer/Src/Repos/api-to-cli/examples/trello/trelloapi-agent/cli
- Binary name: trelloapi

## Setup
1. cd /Users/randall/Developer/Src/Repos/api-to-cli/examples/trello/trelloapi-agent/cli
2. npm install
3. npm link

## Auth
- export TRELLO_KEY="<value>"
- export TRELLO_TOKEN="<value>"

## Commands
- get-board: Get a board by ID
  - --boardid <value> (required)
  - example: trelloapi get-board --boardid <value>
- list-board-lists: List lists on a board
  - --boardid <value> (required)
  - example: trelloapi list-board-lists --boardid <value>
- list-list-cards: List cards in a list
  - --listid <value> (required)
  - example: trelloapi list-list-cards --listid <value>

## Rules
- Do not echo or log auth secrets.
- Do not pass credentials as command flags.
- Parse command stdout as JSON.
- Treat non-zero exits as failure and read stderr JSON envelope.
