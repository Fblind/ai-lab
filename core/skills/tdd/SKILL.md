---
name: tdd
description: >-
  Red-green loop for one behavior at a time. Use when implementing or fixing
  behavior in a back-end repo, when /implement-ticket is writing tests, or
  when the user invokes /tdd. Mocha and node:test examples. The only test
  double is nock, for an outbound HTTP call. Skips front-end repos that have
  no red-green cycle.
disable-model-invocation: true
---

# TDD

Red, then green, one behavior at a time. Follow this on every cycle.

The open repo's test runner, assertion library, fixtures, and file layout win over the samples below. The samples show the shape. Copy the suite you are editing.

## When this applies

Apply this skill in every repo except the front-end repos listed under `skipRedGreen` in `kit.config.json` (for example a legacy web app or a Vue front end).

In those, reproduce the change in the browser. Do not open a red-green cycle.

A data migration is data. It does not get a test.

Libraries and API services are in scope.

## Seam

A seam is the public boundary you can call without reaching inside: the handler (through the HTTP test client the suite already uses), a command, or a query.

Name the seam in one line before the test: what a caller does, and what response or return value you will see. When this skill is reached from `/implement-ticket`, start the red test. Stop to ask only when two public boundaries could own the behavior.

## Loop

One behavior per cycle.

1. Read the `no-redundant-tests` rule. If the suite already runs this scenario, extend that test. Otherwise add one test in the existing suite file. A new file only when that suite does not exist, named like its neighbors (`*_tests.js` unless the folder uses another suffix).
2. Write the test. Expected values are literals you know from the ticket or a worked example. Run that test alone with the repo's test command (a one-shot run, not `npm run tdd` / watch).
3. Red is done when the assertion fails because the behavior is missing (wrong status, wrong body, wrong return). A syntax error or a failed `require` is not red. Fix the test and run it again.
4. Write the minimum production code that makes that test pass. Run the same test until it is green.
5. Next behavior is the next cycle.

Refactoring is a later review, not a step in this loop.

## What you assert

Assert what the caller sees: HTTP status and body, or the command/query return value.

When the behavior is a write and no public read returns the stored document, read it back with the same data-access object the suite already uses.

A handler change includes one cycle whose input the handler's error map does not know, with the response status 500. Use a real bad input, for example `page: "0"` on a paginated GET. When the unmapped failure is an outbound call, nock that call with a status or connection error the handler does not map. Skip this cycle when the suite already has an unmapped-error test for that handler.

## Test doubles

The only test double is `nock`, and only for an outbound HTTP call the code under test makes. Assert the method and path, and assert the caller-visible outcome. `nock.disableNetConnect()` when the suite already does.

`supertest` (or the suite's request helper) is the client calling your handler. It is not a double.

Pass time and randomness in as arguments when the behavior depends on them. The suite's fixture builders (`*Fixture`, `createFixture`) build the surrounding documents.

A new test does not `sinon.stub`, `sinon.spy`, `mock.method`, or replace a module. Leave doubles that are already in the file. Do not add one to force a failure.

Production code calls other services through the shared API client. The test nocks the URL that client calls. Do not put a raw token in the test; use the suite's existing auth helper.

## Runner

Use the runner `package.json` already uses for this repo.

- **Mocha** repos use `chai`'s `expect` and `describe` / `it`.
- **node:test** repos use `require("node:test")` and `require("node:assert/strict")`.

Do not add the other runner.

## Examples

Mocha, handler calls another service. Outbound HTTP is nocked. The assertion is the response the caller gets.

```javascript
const {expect} = require("chai");
const nock = require("nock");

it("should return the order number issued by the accounts service", async () => {
  nock(config.internalApi.url)
    .post("/sequences/next-number")
    .reply(200, {number: 42});

  const {body} = await request(app)
    .post(`/orders/events/${eventId}/orders`)
    .set("Authorization", authHeader)
    .send(payload)
    .expect(200);

  expect(body.order.displayName).to.equal("ORD-42");
});
```

node:test, same rule. Pure logic asserts a known literal. Nock appears only when the function performs HTTP.

```javascript
const {describe, it} = require("node:test");
const assert = require("node:assert/strict");
const nock = require("nock");

describe("next order number", () => {
  it("returns the number accounts issued", async () => {
    nock("http://internal-api")
      .post("/sequences/next-number")
      .reply(200, {number: 42});

    const number = await nextOrderNumber({accountId: "acc-1"});
    assert.equal(number, 42);
  });
});
```

```javascript
it("sums two fares in minor units", () => {
  assert.equal(sumFares(1050, 250), 1300);
});
```

A test that recomputes the expected value the way production does, or that stubs a query to watch it get called, does not count as a cycle. The expected value is a literal. The call you make is the public function or the handler.
