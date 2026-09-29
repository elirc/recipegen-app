# Practice before opening the solutions

Work in a separate branch or copy. Read the [map](01-CODEBASE-MAP.md), then close the worked-change chapter. Keep your answers beside test output so you can distinguish a prediction from something you learned after running the program. The tasks below increase in scope; finishing the first task carefully is more useful than sketching every advanced extension.

## Junior: classify incoming values

Create a table for `null`, an array, a request with a numeric ingredient, a request with string servings, and a valid request containing surrounding ingredient whitespace. Predict the parser result and provider-call count for each. Add one genuinely new boundary case, such as a duplicate dietary option, to the existing test table. Explain why a TypeScript interface would not make that test unnecessary.

## Mid: preserve useful history

Construct a stored history array with two valid results, one result with an invalid timestamp, and one plain string. Predict the returned records and whether localStorage changes during the read. Then design a recovery notice that can report ignored entries without overwriting them. Decide whether the notice belongs in parsing, a storage result type, or the UI. Preserve the current public interface until you can explain the migration cost.

## Mid: make errors useful without leaking internals

The generation response intentionally hides provider exception details. Design an internal structured event containing an attempt number, error category and a correlation identifier. Keep ingredient text, credentials and raw provider messages out of the proposed event. Write tests for the event shape and prove the browser still receives only the generic error. Do not send telemetry to an external service for this exercise.

## Senior: design an asynchronous extension

Suppose generation becomes a background job stored in SQL. Define create, inspect, retry and cancel operations. Specify who owns each record, what prevents duplicate jobs, how status transitions are validated and what happens when a worker finishes after cancellation. Draw a state table before choosing a queue library. Propose one invariant that requires a real database integration test rather than an in-memory fake.

## Review deliverable

Write a short change description containing the concrete trigger, previous behavior, new behavior, executed tests and limits. Include one rejected alternative and its tradeoff. Open [the solutions and rubric](06-SOLUTIONS-AND-REVIEW.md) only after your first attempt. An acceptable answer acknowledges uncertainty instead of treating a mock as evidence of distributed correctness.
