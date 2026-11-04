# Refactoring catalog: condensed mechanics

Load this file when naming a smell or applying one refactoring. The workflow is in `SKILL.md`.

These are paraphrased summaries of the refactorings an agent uses most often.
They are grouped as in Fowler's 2nd edition. For each one, the note says when
to use it and the safe sequence of steps. Run the tests after each numbered
step whenever you can. Full catalog: https://refactoring.com/catalog/

Sources (summaries are paraphrased, not quoted): Martin Fowler, *Refactoring* (2nd ed.); Kent Beck, *Tidy First?*; Michael Feathers, *Working Effectively with Legacy Code*.

## Project conventions (defaults)

These are this kit's defaults. They win when they disagree with a mechanic below. A pack may override them.

- Test doubles: `nock` for an outbound HTTP call only. A new test does not use `vi.mock`, `jest.mock`, `sinon.stub`, or `mock.method`. Match the suite's runner (mocha + chai, or `node:test` + `node:assert/strict`).
- Pin current behavior with literal assertions. Leave snapshot tests out.
- Before Extract Function, search for a helper that already does the job. Reuse it.
- In a repo with `queries/` and `commands/`, a read or decision moves to `queries/`, a write to `commands/`. Leave them in separate modules. Import as a namespace.
- Leave feature flags out. A flag is for new behavior.
- A comment that says why, or states a constraint, stays. Delete a comment only when it restates what the code does.
- Generated output (transpiled `lib/`, published types): change the source and its test only.
- Replacing an error code with an exception, or renaming a persisted or serialized field, is a contract change. Stop and ask. An internal rename keeps the wire name.
- Leave a Mongo or SQL query's operators, projection, and round-trips as they are.
- Dead-code checks include string `require`s, route tables, translation keys, and feature-flag names.

## Smell → refactoring map (Fowler, 2nd ed.)

| Smell | Typical refactorings |
|---|---|
| Mysterious Name | Change Function Declaration (rename), Rename Variable, Rename Field |
| Duplicated Code | Extract Function, Slide Statements, Pull Up Method |
| Long Function | Extract Function, Replace Temp with Query, Introduce Parameter Object, Decompose Conditional, Split Loop, Replace Function with Command |
| Long Parameter List | Introduce Parameter Object, Preserve Whole Object, Replace Parameter with Query, Remove Flag Argument, Combine Functions into Class |
| Global Data | Encapsulate Variable (then narrow its scope) |
| Mutable Data | Encapsulate Variable, Split Variable, Separate Query from Modifier, Remove Setting Method, Replace Derived Variable with Query, Change Reference to Value |
| Divergent Change (one module changes for many reasons) | Split Phase, Move Function, Extract Class |
| Shotgun Surgery (one change touches many modules) | Move Function, Move Field, Combine Functions into Class/Transform, Inline Function/Class |
| Feature Envy | Move Function, Extract Function then Move |
| Data Clumps | Extract Class, Introduce Parameter Object, Preserve Whole Object |
| Primitive Obsession | Replace Primitive with Object, Replace Type Code with Subclasses, Replace Conditional with Polymorphism |
| Repeated Switches | Replace Conditional with Polymorphism (or a lookup map in JS) |
| Loops | Replace Loop with Pipeline (`map`/`filter`/`reduce`) |
| Lazy Element | Inline Function, Inline Class, Collapse Hierarchy |
| Speculative Generality | Collapse Hierarchy, Inline Function/Class, Change Function Declaration, Remove Dead Code |
| Temporary Field | Extract Class, Move Function, Introduce Special Case |
| Message Chains | Hide Delegate, Extract Function + Move Function |
| Middle Man | Remove Middle Man, Inline Function |
| Insider Trading | Move Function/Field, Hide Delegate, Replace Subclass/Superclass with Delegate |
| Large Class / Module | Extract Class, Extract Superclass, Replace Type Code with Subclasses |
| Alternative Classes with Different Interfaces | Change Function Declaration, Move Function, Extract Superclass |
| Data Class | Encapsulate Record, Remove Setting Method, Move Function (behavior into the data) |
| Refused Bequest | Push Down Method/Field, Replace Subclass/Superclass with Delegate |
| Comments (explaining *what*) | Extract Function, Change Function Declaration, Introduce Assertion |
| Deep nesting / complex conditionals | Replace Nested Conditional with Guard Clauses, Decompose Conditional, Consolidate Conditional Expression |

## Tidyings (Kent Beck, *Tidy First?*): tiny, nearly risk-free

Use these before a behavior change, as their own commit boundary. Commit only when the user asked.
- **Guard clauses.** Return early for edge cases so the main path isn't nested.
- **Dead code.** Delete it (git remembers it). Confirm there are no dynamic
  references first (the dead-code checks in Project conventions).
- **Normalize symmetries.** Do the same thing the same way across the file.
- **Reading order / cohesion order.** Reorder declarations so readers meet
  them in a useful order, and put things that change together next to each other.
- **Explaining variable / constant.** Name a sub-expression or a magic number.
- **Explicit parameters.** Pass in values the function currently reads from
  globals or ambient state.
- **Chunk statements.** Add blank lines between logical blocks, as a lead-in
  to Extract Function.
- **Delete redundant comments.** Only a comment that restates what the code does. A why or a constraint stays.

## First set (use constantly)

### Extract Function
*When:* A block needs a comment to explain it, is duplicated, or the function
does more than one thing.
1. Create a new function named for **what it does**, not how it does it.
2. Copy the block in. Pass the variables it reads as parameters. If it
   modifies exactly one variable, return that value. If it modifies more than
   one, first use Split Variable or Replace Temp with Query.
3. Replace the original block with a call. Test.
4. Look for other copies of the same code and replace them too.

### Inline Function
*When:* The body is as clear as the name, or the indirection doesn't help.
Check that the function isn't polymorphic or overridden. Replace each call with
the body, testing as you go, then delete the function.

### Extract Variable / Inline Variable
Name a complex expression with an immutable `const`. Inline a variable when its
name adds nothing to the expression.

### Change Function Declaration (rename, or add or remove a parameter)
- *Simple form:* Change the declaration and all callers in one go. Use this
  only when all callers are in the repo and a tool does the edit.
- *Migration form:* Extract the body into a function with the new signature.
  Make the old function delegate to it (and mark it `@deprecated` if it's
  public). Migrate callers one at a time. Remove the old function once no one
  calls it. **This is required for exported or public APIs.**

### Encapsulate Variable
Wrap widely accessed data in getter and setter functions (or a module API).
Then restrict direct access. This is the first step for Global Data and
Mutable Data.

### Rename Variable / Rename Field
For a field that is persisted or serialized, rename only the internal access.
The wire or DB name is part of the contract.

### Introduce Parameter Object
*When:* The same group of parameters travels together. Create an object or
class for them, add it as a parameter alongside the old ones, move callers over
one at a time, then remove the old parameters.

### Combine Functions into Class / into Transform
*When:* Several functions operate on the same data. Group them in a class
around the data, or in an `enrichX(data)` transform that returns derived fields.
Use the transform when the source data must stay immutable. In a repo
with that layout, group reads in the resource's `queries/` module and writes in `commands/`.

### Split Phase
*When:* The code does two different things in sequence (parse then compute, or
fetch then format). Extract the second phase into its own function, then add an
intermediate data structure between the phases.

## Encapsulation

- **Encapsulate Record / Collection.** Hide a raw object or array behind
  accessors. Return copies or read-only views, not the internal array.
- **Replace Primitive with Object.** Turn a string or number with rules
  (money, email, status) into a small value class.
- **Replace Temp with Query.** Turn a temp that's computed once into a
  function, so extraction becomes easier. The expression must have no side
  effects.
- **Extract Class / Inline Class.** Split a class that has two
  responsibilities by moving fields first, then methods. Use Inline Class for
  the reverse.
- **Hide Delegate / Remove Middle Man.** Add a forwarding method to break a
  message chain, or remove the forwarding methods when a class is only
  forwarding calls.
- **Substitute Algorithm.** Replace a body with a clearer algorithm. Do this
  only with strong tests, and compare the outputs.

## Moving features

- **Move Function.** Move it next to the data it uses most. Copy it to the
  target, adapt it, make the source delegate to it, test, then update callers
  and remove the delegate.
- **Move Field.** Encapsulate the field first, then move it and update the
  accessors.
- **Move Statements into Function / to Callers.** Pull repeated surrounding
  statements into the function, or push statements that vary out to the callers.
- **Replace Inline Code with Function Call.** Use the existing helper or a
  language function (`Array.prototype.includes`). Leave lodash out.
- **Slide Statements.** Move related lines next to each other. Check that
  nothing in between reads or writes the same state.
- **Split Loop.** One loop, one job. An extra in-memory pass is acceptable.
  A Mongo or SQL query stays one query.
- **Replace Loop with Pipeline.** Use `filter`/`map`/`reduce`. Watch out for
  early `break`/`return`, `await` inside the loop (sequential vs. parallel
  execution), and mutation.
- **Remove Dead Code.**

## Organizing data

- **Split Variable.** One variable, one purpose. Use `const` per purpose.
- **Rename Field.** See above.
- **Replace Derived Variable with Query.** Compute it instead of storing and
  syncing it.
- **Change Reference to Value / Value to Reference.** Use immutable values for
  small concepts, and a shared repository for entities with identity.

## Simplifying conditional logic

- **Decompose Conditional.** Extract the condition and each branch into
  well-named functions.
- **Consolidate Conditional Expression.** Merge checks that lead to the same
  result into one named predicate.
- **Replace Nested Conditional with Guard Clauses.** Handle edge cases early
  and keep the normal path flat.
- **Replace Conditional with Polymorphism.** Use this for switches on type
  that repeat in several places. In JS a strategy or lookup map is often enough
  (`const handlers = { a: fnA, b: fnB }`). Keep a default or error path that
  is equivalent to the old `default:` branch.
- **Introduce Special Case (Null Object).** Replace repeated `if (x == null)`
  or `'unknown'` checks with an object that provides the default behavior.
- **Introduce Assertion.** Make an assumption explicit. The assertion must
  never fail in correct code, so it doesn't change behavior.

## Refactoring APIs

- **Separate Query from Modifier.** A function returns a value **or** has a
  side effect, not both.
- **Parameterize Function.** Merge near-duplicate functions that differ only by
  a literal.
- **Remove Flag Argument.** Replace `fn(x, true)` with two explicit functions.
- **Preserve Whole Object.** Pass the object instead of several fields pulled
  out of it, unless that creates an unwanted dependency.
- **Replace Parameter with Query / Query with Parameter.** Use these to move
  responsibility between caller and callee. Use the second one to make a
  function pure and testable.
- **Remove Setting Method.** Set the value in the constructor and make it
  immutable afterwards.
- **Replace Constructor with Factory Function.**
- **Replace Function with Command / Command with Function.** Use a command
  object for complex logic that needs to be broken into pieces, and switch back
  once it's simple.
- **Return Modified Value.**
- **Replace Error Code with Exception / Exception with Precheck.** These
  change the error contract, so treat them as API changes and ask first.

## Dealing with inheritance

- **Pull Up / Push Down Method or Field.** Move shared behavior to the parent,
  or behavior that only one subclass uses down to that subclass.
- **Extract Superclass / Collapse Hierarchy.**
- **Replace Type Code with Subclasses / Remove Subclass.**
- **Replace Subclass with Delegate / Replace Superclass with Delegate.** Prefer
  composition when inheritance is used for code reuse rather than a real
  "is-a" relationship.

## Legacy code (Feathers): getting tests in place

- **Characterization test.** Call the code, assert whatever it returns now
  (start with a placeholder assertion, read the actual value, and pin it with
  a literal). Cover edge cases you see in the code paths. Extend the existing
  suite. Outbound HTTP is `nock` only.
- **Seams.** These are places where you can vary a dependency without editing
  the code there. Pass the dependency as a parameter or
  constructor argument, or `nock` the URL the API client calls. Leave module
  mocks and `sinon` out of a new test.
- **Dependency-breaking moves** (minimal and mechanical): Parameterize
  Constructor or Function, Extract Interface (a JSDoc type), Extract and
  Override Call, Wrap Method, and Sprout Function or Class. Sprouting means
  putting new logic in a new, tested function and calling it from the legacy
  code. That is a behavior change, so it is a separate step from the refactor.
- **Scratch refactoring.** Refactor freely in a throwaway branch to understand
  the code, then discard it and do it properly.
