# Hub v2 review findings

Review of `feature/hub-v2` against `origin/main` (`/code-review medium`), with each finding checked
against the code. Files are under `src/lib/builder/`.

| #   | Finding                                          | Verdict               | Severity |
| --- | ------------------------------------------------ | --------------------- | -------- |
| 1   | Pending command kept after it entered a snapshot | Confirmed (code path) | Medium   |
| 2   | Gap or bad command leaves chat `unsynced`        | Confirmed, by design? | Low      |
| 3   | No error isolation in stream hub loops           | Confirmed (latent)    | Medium   |
| 4   | `BuilderHub.#dispatch` has no try/catch          | Confirmed (latent)    | Low      |
| 5   | Listener keeps the first `userId`                | Partly, by design     | Low      |
| 6   | Stale replica status / retry timer               | Refuted               | -        |
| 7   | `#pruneAnnotations` is O(n·m)                    | Refuted (negligible)  | -        |
| 8   | Context accessors written by hand                | Partly                | Nit      |

"Confirmed" means the code path exists as described. For 1 and 2 the trigger also depends on what the
server sends, and the server is not in this repo, so that part is unverified.

## Confirmed

### 1. Pending command survives a resync that folded it into the snapshot

`chat/chatReplica.ts:220` — `#onSync` drops a pending command only if its `commandId` is in the sync's
`commands`. If the server confirmed the command and then compacted it into `snapshot.data`, it is in
the snapshot but not in `commands`.

- `view()` applies the pending `add` on top of the confirmed messages. The message exists twice,
  because a confirmed message's `id` is the `commandId` of its `add`.
- `resend` returns the command, so `ChatStream.#onFrame` sends it again. Duplicate or nack depends on
  server dedupe, which is unknown here.

Fix: after building `messages`, also drop pending commands whose `commandId` equals the `id` of a
message in the restored state. Add a `chatReplica.test.ts` case: pending `add`, then a sync whose
snapshot holds that message and whose `commands` is empty. Expect `pendingCount` 0, one message in
`view()`, and empty `resend`.

Open question: does the server ever compact a command out of the `commands` list while a client is
still subscribed? If it never does, this cannot happen, but the guard is cheap.

### 3. Stream hub loops have no error isolation

`streamHub.ts:121-133`. `BuilderHub.#notify` catches handler errors, but the stream hub's own loops
do not:

- `#onConnected` — a throw in `createListener` or `listener.connected()` aborts the loop. Later
  streams (such as the game scene's) are never subscribed after that reconnect.
- `#activate` — a throw after `#sendSubscribe` skips `#release(entry)`. Callers of `subscribe()`
  waiting on `entry.waiting` never resolve.
- `#onDisconnected` — same loop problem.
- `#route` — a throwing `listener.frame` propagates into `BuilderHub.#dispatch`; see finding 4.

Latent today: `ChatStream`'s `connected` and `disconnected` cannot throw. `frame` can, through
`commands.arrive` (dev-command code), and game-scene listeners are not part of this review.

Fix: wrap each per-entry call in try/catch with `logAPI.error('[streams] ...')`, as `#notify` does.
Run `#release` in a `finally`. Add a `streamHub.test.ts` case: two streams, the first listener's
`connected` throws, and the second still gets subscribed.

### 4. `BuilderHub.#dispatch` has no try/catch around handlers

`hub.svelte.ts:200`. One throwing handler stops delivery to the other handlers of that frame type,
and the error reaches `ws.onmessage` in `ResilientWebSocket`, which has no catch. The socket is not
broken, but the remaining handlers miss the frame. `#notify` already treats lifecycle handlers this way.

Fix: wrap the call in try/catch, log with `logAPI.error('[hub] frame handler failed', error)`, and
iterate a copy (`[...handlers]`) as `#notify` does. Add a test in `hub.svelte.test.ts`.

Findings 3 and 4 can land together.

## Low priority or needs a decision

### 2. A gap or undecodable command leaves chat `unsynced`

`chat/chatReplica.ts:208-216`. A version gap (`wire.version !== version + 1`) or a command that
`ChatCommand.parse` rejects makes `#onSync` return `unsynced`. `ChatStream.#retryLater` then
resubscribes every 5s, and the server presumably returns the same data, so the chat stays disabled.

The 5s retry is the intended recovery for `streamUnsynced`. `chatReplica.ts` says it mirrors the Rust
`ClientStream`, so this may be deliberate. It is only a problem if the server can return a log with a
hole or a command this client cannot parse. A plausible case is a newer server adding a command tag.

Decision needed: keep as is, or surface a distinct state/log line, or back off the retry. No change
planned until the server contract is checked.

### 5. Listener keeps the first `userId`

`streamHub.ts:136` — `entry.listener ??= entry.createListener(userId)`. `ChatStream` builds its
`ChatReplica` and `#selfId` from that first id. The `StreamHub` doc comment (line 29) says
"`createListener` runs once ... and its listener serves every reconnect", so this is documented.

It matters only if the same `BuilderHub` reconnects as a different user. The hub lives in
`BuilderShell.svelte`, below `AuthGuard`, so a logout normally destroys it. A session switch that
keeps the layout mounted (for example, another tab changes the cookie and the socket reconnects) would
leave the old id in place.

Optional fix: store the `userId` on `Entry` and, in `#activate`, rebuild the listener when it differs.
Update the doc comment at line 29 if so.

### 8. Context accessors written by hand

`hub.svelte.ts:221` and `streamHub.ts:171` call `context.tryGet()` and throw manually.
`createContext().get()` already throws when the context is absent, so both can use it. `tryGet*` is
for contexts where a missing provider is valid, and these are not.

The reviewer's other point does not hold. `createContext` exists only in `#lib/ui/utils`, and every
usage imports it from there. The `.claude/CLAUDE.md` Contexts section says `#lib/utils`, which is wrong.
Fix that line in `CLAUDE.md` rather than moving code.

Fix: `return context.get()`, which drops the duplicated error message.

## Refuted

### 6. Stale replica status and retry timer (`chat/chatStream.svelte.ts:85`)

- A late frame cannot overwrite `reconnecting`. After `disconnected` the socket is closed, so no
  frames arrive. The next frames come after `connected`, and `#activate` calls `listener.connected()`,
  which calls `replica.resync()`, so the status is `waiting` again. `#onCommands` returns `NOTHING`
  unless the status is `live`.
- `disconnected` already calls `#clearRetry()`, and a new connection always follows a disconnect.
- After `destroy()`, `unsubscribe` removes the stream, so `#route` no longer delivers frames.

### 7. `#pruneAnnotations` cost (`chat/chatStream.svelte.ts:190`)

`CHAT_WINDOW` is 200, and pruning only runs above 400 annotations, then shrinks to the messages still
in the room (at most 200). The worst case is about 400 × 200 comparisons, once per roughly 200
annotated arrivals. Not worth changing; a `Set` would only be a style choice.

## Suggested order

1. Findings 3 and 4 together: error isolation in `streamHub.ts` and `hub.svelte.ts`, plus tests.
2. Finding 1: dedupe pending against restored messages, plus test. Check the server's compaction
   behavior first if possible.
3. Finding 8 and the `CLAUDE.md` path correction.
4. Findings 2 and 5 only after a decision.
