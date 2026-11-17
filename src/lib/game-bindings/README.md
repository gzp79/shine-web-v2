# Game bindings

Typed access to the commands and snapshots of the builder's command streams (chat, pixel map),
which travel as base64 of their [postcard](https://docs.rs/postcard) bytes. Plain TypeScript, no wasm.

| Path                      | Role                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- |
| `generated/`              | Postcard serializers and snapshot limits written by the generator. Do not edit. |
| `codec.ts`                | Base64 and uuid helpers, and the `wireCodec` encode/parse of a generated type.  |
| `chat.ts`, `pixel-map.ts` | Command builders and state codecs of each stream.                               |

## Regenerating

`generated/` comes from the Rust types of the `shine-services` repo (checked out beside this one). Run
it by hand whenever a command or state type there changes, and commit the result:

```bash
pnpm gen:game-bindings
```

Command types are a permanent wire and log format: see "Command types are a permanent wire and log
format" in `docs/services/builder/command-stream.md` of `shine-services` before changing one.
