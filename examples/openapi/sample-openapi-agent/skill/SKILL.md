# sample-crm-api CLI Skill

## Purpose
Use the generated sample-crm-api CLI from AgentBridge. Always prefer JSON output for machine parsing.

## Location
- CLI project: ./cli
- Binary name: sample-crm-api

## Setup
1. cd ./cli
2. npm install
3. npm link

## Auth
- No auth env vars required

## Commands
- listcontacts: List contacts
  - --limit <value> (optional)
  - example: sample-crm-api listcontacts --limit <value>
- createcontact: Create contact
  - --yes (required for non-GET operations)
  - --body <json> (raw JSON body fallback)
  - --body-stdin (read JSON body from stdin)
  - example: sample-crm-api createcontact --yes --body '{"key":"value"}'
- get-contacts-by-contactid: Get contact by ID
  - --contact-id <value> (required)
  - example: sample-crm-api get-contacts-by-contactid --contact-id <value>
- patch-contacts-by-contactid: Update contact fields
  - --contact-id <value> (required)
  - --yes (required for non-GET operations)
  - --body <json> (raw JSON body fallback)
  - --body-stdin (read JSON body from stdin)
  - example: sample-crm-api patch-contacts-by-contactid --contact-id <value> --yes --body '{"key":"value"}'
- delete-contacts-by-contactid: Delete contact
  - --contact-id <value> (required)
  - --yes (required for non-GET operations)
  - example: sample-crm-api delete-contacts-by-contactid --contact-id <value> --yes

## Rules
- Do not echo or log auth secrets.
- Do not pass credentials as command flags.
- Parse command stdout as JSON.
- Treat non-zero exits as failure and read stderr JSON envelope.
