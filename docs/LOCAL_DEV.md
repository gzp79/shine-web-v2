# Running the local environment

This guide describes how to run the full stack locally: the **backend services**
(`identity`, `builder`) from `shine-services`, the **assets** from `shine-assets`,
the optional **game** client, and this **web app**.

The `local` environment (`config.local.ts`) expects everything on `*.scytta.com`
loopback hosts:

| Piece       | Local URL                              | Served by                                          |
| ----------- | -------------------------------------- | -------------------------------------------------- |
| web         | `https://local.scytta.com:4443`        | this repo (Vite dev server)                        |
| assets      | `https://assets.local.scytta.com:4443` | this repo (Vite serves converted assets)           |
| identity    | `https://cloud.local.scytta.com:8443`  | `shine-services` (`identity: local` task)          |
| builder     | `https://cloud.local.scytta.com:8444`  | `shine-services` (`builder: local` task)           |
| builder(WS) | `https://ws.local.scytta.com:8444`     | `shine-services` websocket (`builder: local` task) |
| game        | `https://game.local.scytta.com:8092`   | `shine-services` (`start mocked services`)         |

The game is **optional** — only the `/game` route needs it. Everything else (chat,
account, …) runs without it. See [Game (optional)](#game-optional) below.

The three repos are expected to be checked out side by side in the same parent
directory:

```
<workspace>/
├── shine-web-v2      # this repo
├── shine-services    # identity + builder (Rust)
└── shine-assets      # asset conversion pipeline (CLI, not a server)
```

---

## Quick start

Assumes the three repos are checked out side by side and you have Node ≥ 24, pnpm,
Rust and Docker. Each step links to its details below.

```bash
# 1. Hosts file — map the *.scytta.com names to 127.0.0.1           → [Hosts file]

# 2. Backend services (shine-services, via VS Code tasks)           → [Start the backend services]
cd shine-services/tests && pnpm i && pnpm run mkcert
docker network create shine
#    run VS Code tasks:
#      - "dev environment" (up)
#      - "identity: local"
#      - "builder: local"

# 3. Asset content                                                  → [Assets]
cd ../shine-assets && pnpm i

# 4. Certificates — web cert + trust both CAs                       → [Certificates]
cd ../../shine-web-v2 && pnpm i && pnpm run mkcert
#    then trust both CAs (Windows, from shine-web-v2):
#      certutil -addstore -user "ROOT" ".\certificates\ca.crt"
#      certutil -addstore -user "ROOT" "..\shine-services\certificates\ca.crt"

# 5. Web app                                                         → [Start the web app]
pnpm run env:local
pnpm run dev
```

Then open <https://local.scytta.com:4443>.

The **game** (`/game` route) is optional and needs extra setup — see
[Game (optional)](#game-optional). Everything else runs without it.

Sections below cover each step in detail, plus [Troubleshooting](#troubleshooting).

- [Prerequisites](#prerequisites-once) · [Hosts file](#1-hosts-file) ·
  [Certificates](#2-certificates)
- [Start the backend services](#start-the-backend-services-shine-services) ·
  [Assets](#assets-shine-assets) · [Game (optional)](#game-optional) ·
  [Start the web app](#start-the-web-app-this-repo)
- [Running the real e2e tests](#running-the-real-e2e-tests) ·
  [Troubleshooting](#troubleshooting)

---

## Prerequisites (once)

- **Node ≥ 24** and **pnpm ≥ 11** (this repo and `shine-assets`).
- **Rust** toolchain with `cargo` (`shine-services`).
- **Docker + Docker Compose** (for the services' Postgres/Redis).
- **`gltfpack`** for `shine-assets` (only if you convert 3D models — see below).

### 1. Hosts file

Map the loopback hostnames. On Windows edit `C:\Windows\System32\drivers\etc\hosts`
(as admin) and add:

```
127.0.0.1 local.scytta.com
127.0.0.1 cloud.local.scytta.com
127.0.0.1 assets.local.scytta.com
127.0.0.1 game.local.scytta.com
127.0.0.1 mockbox.foo
127.0.0.1 postgres.mockbox.foo
127.0.0.1 redis.mockbox.foo
```

(`game.local.scytta.com` is only needed for the optional game route;
`mockbox.foo` and the `*.mockbox.foo` entries are only needed for the services'
databases and mock dependencies.)

### 2. Certificates

The web repo and `shine-services` each have their **own** self-signed CA, and each
covers different hostnames. You need both.

| CA                        | Covers (cert SANs)                                               | Serves                                    |
| ------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| web `certificates/ca.crt` | `local.scytta.com`, `assets.local.scytta.com`                    | web + assets on :4443                     |
| services `certs/ca.crt`   | `cloud.local.scytta.com`, `game.local.scytta.com`, `mockbox.foo` | identity :8443, builder :8444, game :8092 |

**Web (this repo):**

```bash
pnpm run mkcert   # creates certificates/ca.* and certificates/cert.* (local + assets)
```

**Services (`shine-services`):** generate `certs/scytta.{crt,key}` from its `tests/`
package:

```bash
cd ../shine-services/tests
pnpm i
pnpm run mkcert   # creates ../certs/ca.* and ../certs/scytta.{crt,key}
```

**Trust both CAs.** The Node-side fetches disable TLS verification
(`NODE_TLS_REJECT_UNAUTHORIZED=0`), but the **browser** talks directly to the web,
assets, identity, builder and game hosts, so it needs to trust both roots. On Windows
(from the web repo root):

```powershell
certutil -addstore -user "ROOT" ".\certificates\ca.crt"
certutil -addstore -user "ROOT" "..\shine-services\certs\ca.crt"
```

**Replace old CAs.** If you regenerate either CA, remove its older trusted root
before adding the replacement. List certificates in the current user's trusted-root
store and identify the old CA by its `Subject`, `Issuer`, or `Cert Hash(sha1)`:

```powershell
certutil -user -store Root
```

Delete only the matching certificate, using its `Cert Hash(sha1)` value:

```powershell
certutil -delstore -user Root <THUMBPRINT>
```

For example, `certutil -delstore -user Root 12fabf678770d44e8b172d17d3463ac0807965be`.
Restart the browser after changing trusted roots so it reloads the certificate store.

> If you had older certs trusted, regenerate with the commands above (they now include
> `assets.local.scytta.com` / `game.local.scytta.com`) and re-run the `certutil` steps —
> otherwise those two hosts throw a name-mismatch warning.

---

## Start the backend services (`shine-services`)

The convenient path is the VS Code tasks in that repo (they inject the
`SHINE--SERVICE--*` env vars that a POSIX shell can't set because of the `--` in
the names). Open `shine-services` in VS Code and run the tasks (Terminal → Run Task):

1. **`dev environment`** → choose `up` — starts Postgres, Redis and Toxiproxy via
   `docker compose -f services/docker-compose.yml -p shine up`. First time only, the
   external docker network must exist:

    ```bash
    docker network create shine
    ```

2. **`identity: local`** — runs `cargo run -p shine-identity --release -- test`,
   listening on `https://cloud.local.scytta.com:8443`.

3. **`builder: local`** — runs `cargo run -p shine-builder --release -- test`,
   listening on `https://cloud.local.scytta.com:8444`.

> Use the **`: local`** tasks, not the `: cloud` ones. The `cloud` tasks currently
> have typos in `tasks.json` (`scytta.crt2`, `SHINE--SERVICE--POSRT`) and are not
> reliable for local use.

### Verify the services are up

Each service exposes a readiness endpoint that returns the literal string `Ok`:

```bash
curl -k https://cloud.local.scytta.com:8443/identity/info/ready
curl -k https://cloud.local.scytta.com:8444/builder/info/ready
```

The startup log line to look for is `Starting service on https://...`.

> **Note:** In this direct-binary dev mode, identity is on `:8443` and builder on
> `:8444` — which is what `config.local.ts` targets. The CI/docker stack instead
> fronts both with nginx on `:8443` (`.../identity`, `.../builder`); that's a
> different mode and not what the `local` web config points at.

---

## Assets (`shine-assets`)

`shine-assets` is **not a server** — it's a CLI that converts source assets
(glTF/GLB, SVG, images → WebP) into a `generated/assets` tree. In the `local`
environment the **web dev server builds and serves the assets itself**: because
`config.local.ts` has `assetUrl` on the same host/port root as `webUrl`,
`vite.config.ts` calls `buildAssets()`, which shells into `../shine-assets` and
runs `pnpm run convert:web`, copying the output into `static-generated/assets`.

So for normal local web dev you don't run `shine-assets` manually — just install
its deps once so the web dev server can invoke it:

```bash
cd ../shine-assets
pnpm i
```

To run a conversion by hand (e.g. to inspect output):

```bash
pnpm run convert:web    # web platform, ui + models → generated/assets
```

Converting 3D models requires the native `gltfpack` binary. On Windows:

```powershell
./scripts/install-gltfpack.ps1
```

---

## Game (optional)

Only the `/game` route needs this. If you don't open `/game`, skip this section —
without it that one route logs `ECONNREFUSED 127.0.0.1:8092` and nothing else is
affected.

The game is a Rust→wasm client living in `shine-services/client/web`. It is **built**
there and **served** by the `start mocked services` task, which runs an HTTPS static
file server on `https://game.local.scytta.com:8092`. The web app fetches
`/latest.json` → `{ "version": "<v>" }`, then dynamically imports
`/<v>/shine-web.js` (the wasm is inlined into that bundle).

The mock emulates the deployed bucket: it serves `client/web/dist` directly, and
synthesizes `/latest.json` (version `custom`) and the `/custom/...` version prefix
in memory — so there's no versioned folder or manifest to assemble on disk.

```bash
cd ../shine-services

# 1. Build the wasm client (needs Rust + wasm32 target + wasm-pack)
cd client/web
pnpm i
pnpm build:wasm    # wasm-pack build ../../crates/shine-game --target web
pnpm build         # -> client/web/dist/{shine-web.js, shine_game_bg.wasm}
cd ../..

# 2. Start the mocks (serves the game on :8092), or use the VS Code task
#    "start mocked services"
cd tests && pnpm i && pnpm run mock:services
```

`/game` should then load. Prerequisites for step 1: `rustup target add
wasm32-unknown-unknown` and `wasm-pack`. Rebuild the client (step 1) whenever the
game changes; the mock always serves the current `client/web/dist`.

The game is served with the `shine-services` cert, which covers
`game.local.scytta.com` — so trust that CA (see [Certificates](#2-certificates)) to
avoid a browser warning on :8092.

---

## Start the web app (this repo)

```bash
pnpm i
pnpm run env:local   # selects config.local.ts into src/generated/config.ts
pnpm run dev         # serves https://local.scytta.com:4443 (assets built on the fly)
```

Open <https://local.scytta.com:4443>.

---

## Running the real e2e tests

The `e2e` Playwright project runs against these real, running services (unlike
`component`/`integration`, which use MSW mocks). With the services, assets and web
dev server all up on the `local` environment:

```bash
pnpm run test:e2e
```

See `.claude/skills/playwright-testing/SKILL.md` for the full test layout.

---

## Troubleshooting

- **`No certificates were found`** — run `pnpm run mkcert` in this repo.
- **TLS / self-signed warnings** — trust **both** CAs (`certificates/ca.crt` and
  `../shine-services/certs/ca.crt`) via `certutil` (see Certificates above). A
  name-mismatch on `assets.local.scytta.com` / `game.local.scytta.com` means the cert
  predates the SAN fix — regenerate with `pnpm run mkcert` and re-trust.
- **Asset build fails on `pnpm run dev`** — ensure `../shine-assets` exists and has had
  `pnpm i`; model conversion additionally needs `gltfpack`.
- **e2e can't reach identity/builder** — confirm the `info/ready` curls above return
  `Ok`, and that the hosts-file entries resolve to `127.0.0.1`.
- **Services won't start** — make sure the docker `dev environment` (`up`) is running
  and the external `shine` docker network exists.
- **`ECONNREFUSED 127.0.0.1:8092` on `/game`** — the optional game server isn't running.
  Start `start mocked services`, or avoid the `/game` route. See
  [Game (optional)](#game-optional).
- **`Failed to fetch game version: 404` on `/game`** — the mock is running but
  `client/web/dist` hasn't been built. Run the build (step 1 of
  [Game (optional)](#game-optional)) and restart `start mocked services`.
