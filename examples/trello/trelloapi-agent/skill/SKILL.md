# trelloapi CLI Skill

## Purpose
Use the generated trelloapi CLI from AgentBridge. Always prefer JSON output for machine parsing.

## Location
- CLI project: ./cli
- Binary name: trelloapi

## Setup
1. cd ./cli
2. npm install
3. npm link

## Auth
- export TRELLO_KEY="<value>"
- export TRELLO_TOKEN="<value>"

## Commands
- get-board: Get a board by ID
  - --board-id <value> (required)
  - example: trelloapi get-board --board-id <value>
- list-board-lists: List lists on a board
  - --board-id <value> (required)
  - example: trelloapi list-board-lists --board-id <value>
- list-list-cards: List cards in a list
  - --list-id <value> (required)
  - example: trelloapi list-list-cards --list-id <value>

## Rules
- Do not echo or log auth secrets.
- Do not pass credentials as command flags.
- Parse command stdout as JSON.
- Treat non-zero exits as failure and read stderr JSON envelope.
