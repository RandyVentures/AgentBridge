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
- list-contacts: List contacts
  - --limit <value> (optional)
  - example: sample-crm-api list-contacts --limit <value>
- create-contact: Create contact
  - --yes (required for non-GET operations)
  - --body <json> (raw JSON body fallback)
  - --body-stdin (read JSON body from stdin)
  - --body-name <value> (required)
  - --body-email <value> (optional)
  - --body-subscribed <value> (optional)
  - example: sample-crm-api create-contact --yes --body-name <value> --body-email <value> --body-subscribed <value> --body '{"key":"value"}'
- get-contacts-by-contactid: Get contact by ID
  - --contact-id <value> (required)
  - example: sample-crm-api get-contacts-by-contactid --contact-id <value>
- patch-contacts-by-contactid: Update contact fields
  - --contact-id <value> (required)
  - --yes (required for non-GET operations)
  - --body <json> (raw JSON body fallback)
  - --body-stdin (read JSON body from stdin)
  - --body-name <value> (optional)
  - --body-email <value> (optional)
  - example: sample-crm-api patch-contacts-by-contactid --contact-id <value> --yes --body-name <value> --body-email <value> --body '{"key":"value"}'
- delete-contacts-by-contactid: Delete contact
  - --contact-id <value> (required)
  - --yes (required for non-GET operations)
  - example: sample-crm-api delete-contacts-by-contactid --contact-id <value> --yes

## Rules
- Do not echo or log auth secrets.
- Do not pass credentials as command flags.
- Parse command stdout as JSON.
- Treat non-zero exits as failure and read stderr JSON envelope.
