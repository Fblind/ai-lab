---
name: acme-api-client-collection
description: Saves the manual API check made during a ticket into the Acme Tickets API client collection (Postman-like). Use after the manual API check in implement-ticket when an API client tool is connected.
---

# Save the manual API check in the collection

Fictional convention for the fictional Acme Tickets company. It plugs into the **API** step of the manual check in the `implement-ticket` skill.

## When to use

After a real request against a local service for an endpoint this session changed, and only when an API client tool (a Postman-like MCP or CLI) is connected. If none is, print the `curl` command instead and stop.

## Convention

1. **Workspace:** `<workspace-id>` (ask the user once and keep it in this pack, never in the core).
2. **Collection:** named after the repo (`acme-api-orders`). Create it if it does not exist.
3. **Folder:** the resource (`refunds`, `seat-holds`). One request per endpoint and method.
4. **Request name:** `<METHOD> <path>`, for example `POST /orders/{orderId}/refunds`.
5. **Environment variables, never literals:** `{{base-url}}`, `{{jwt}}`, `{{api-key}}`, `{{account-id}}`. The local base URLs are in `acme-repos`.
6. **Headers:** `Authorization: Bearer {{jwt}}`, `x-api-key: {{api-key}}`, `Content-Type: application/json`.
7. **Body:** only the required fields, with sample values.
8. **Example response:** save one example per status code you saw, with ids and emails replaced by obvious fakes.
9. **Never** save a real token, copy environment values, or store customer data.

## Report

One line: collection, folder, request name, and the example saved (or "printed curl: no API client connected").
