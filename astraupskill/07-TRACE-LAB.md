# Trace lab: request, retry and stored-record recovery

Use [generation.ts](../lib/generation.ts), [validation.ts](../lib/validation.ts), and [storage.ts](../lib/storage.ts) as the only implementation references during the first pass. Draw a row for every function boundary. Record the value's trust level, the next operation and whether that operation can change external state. This exercise teaches a habit useful in larger CRUD systems: explain a transition precisely before proposing a layer or pattern.

| Scenario | Input parser | Provider calls | Output parser | Observable result |
|---|---|---:|---|---|
| JSON null | Rejects object shape | 0 | Not reached | Controlled 400 |
| Valid input, valid recipes | Accepts normalized input | 1 | Accepts | 200 with parsed recipes |
| Valid input, bad recipes, then good recipes | Accepts | 2 | Rejects then accepts | 200 after bounded retry |
| Valid input, two failures | Accepts | 2 | Fails or is not reached | Generic 500 |
| Mixed saved history | Not a new API request | 0 | Per-record validation | Only valid records returned |

Now trace the null case from the HTTP adapter. JSON decoding succeeds, which is different from a syntax error. The adapter delegates the decoded value. The object guard throws; the orchestrator catches that validation error and constructs a response. The route converts that result into an HTTP response. Locate the point where the original code instead destructured null using the [original snapshot](snapshots/app__api__recipes__route.ts.original.txt).

For the retry case, write the attempt counter before and after each provider call. Explain why parsing must happen inside the attempt's try block for invalid provider output to participate in the retry policy, while request parsing belongs before the loop. Then ask what would happen if the SDK independently retried transport errors. The application's two attempts are not necessarily two physical network requests; the current suite does not establish that network count.

For storage, identify the difference between corrupt JSON and a corrupt record inside valid JSON. The first returns an empty collection through the outer catch. The second is rejected inside the per-item parser while other records remain visible. Neither read removes persisted bytes. Finish by translating this policy into a hypothetical SQL import: which failures should abort one record, one batch, or the entire transaction? There is no universal answer; state the user-visible atomicity requirement first.
