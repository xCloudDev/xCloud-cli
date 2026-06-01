# xCloud CLI

Agent-ready command-line client for the xCloud Public API and xCloud Enterprise API.

This is a standalone repository. The main `xCloudDev/xCloud` Laravel application repository is intentionally not used for CLI distribution.

## Install

### npm

After the package is published to npm:

```bash
npm install -g @xcloud/cli
xcloud --help
```

Before npm publishing, install straight from GitHub:

```bash
npm install -g github:xCloudDev/xCloud-cli
xcloud --help
```

For AI agent mode, install xCloud Terminal instead or alongside this package:

```bash
npm install -g github:xCloudDev/xcloud-terminal
xcloud --ai
xterm --ai --agent hosted
```

`xcloud --ai` opens xCloud Terminal's local agent mode. `--agent hosted` loads portable skills from https://github.com/xCloudDev/xcloud-agent-skills and uses the user's Anthropic/OpenAI/OpenRouter token.

For contributors developing locally:

```bash
git clone https://github.com/xCloudDev/xCloud-cli.git
cd xCloud-cli
npm ci
npm test
node ./bin/xcloud.js --help
npm link   # optional, exposes `xcloud`
```

### Homebrew

This repo includes a formula at `Formula/xcloud-cli.rb`.

For the standalone repository, use:

```bash
brew install --HEAD xCloudDev/xCloud-cli/xcloud-cli
xcloud --help
```

If we later create a dedicated Homebrew tap repository (`xCloudDev/homebrew-xcloud-cli`), the user-facing command can become:

```bash
brew install --HEAD xCloudDev/xcloud-cli/xcloud-cli
```

Homebrew's GitHub tap syntax needs the formula name at the end; `xCloudDev/xCloud-cli` alone is the repository/tap reference, not a formula name.

## Authentication and profiles

The CLI reads configuration from environment variables first, then from `~/.config/xcloud/config.json` or `--config`.

Supported environment variables:

- `XCLOUD_BASE_URL` — for example `https://app.xcloud.host`
- `XCLOUD_API_TOKEN` — Laravel Sanctum bearer token
- `XCLOUD_API_FLAVOR` — `public` or `enterprise`
- `XCLOUD_PROFILE` — profile name in the config file

Create/update a profile:

```bash
xcloud configure \
  --profile prod \
  --base-url https://app.xcloud.host \
  --token "$XCLOUD_API_TOKEN" \
  --api-flavor public
```

Tokens are saved in the config file for human use. Agents and CI should prefer ephemeral environment variables so secrets are not written to disk.

## Global flags

- `--profile <name>`
- `--config <path>`
- `--base-url <url>`
- `--token <token>`
- `--api-flavor public|enterprise`
- `--output table|json|yaml`
- `--yes` for non-interactive write/destructive operations
- `--ai` to delegate into xCloud Terminal agent mode when `@xcloud/terminal` is installed
- `--agent local|hosted` to select local xCloud AI/tool mode or hosted skills mode

## Agent and DevOps usage pattern

Use JSON output and env-provided credentials in CI/CD, runbooks, server scripts, and agent skills:

```bash
XCLOUD_BASE_URL=https://app.xcloud.host \
XCLOUD_API_TOKEN="$TOKEN" \
XCLOUD_API_FLAVOR=public \
xcloud --output json servers list
```

Rules for future xCloud agent skills and DevOps automation:

- Always pass `--output json` when another tool or script consumes the result.
- Use environment variables instead of writing tokens to config for ephemeral CI/agent runs.
- Pass `--yes` only after the skill, runbook, or CI job has verified intent for write/delete operations.
- Prefer typed commands; use `xcloud api ...` only for endpoints not covered yet.
- Keep credentials in secret stores (`GitHub Actions secrets`, CI variables, `~/.config/xcloud/config.json` with `0600` permissions), never in shell history or repository files.

Human-friendly table output remains the default for general users:

```bash
xcloud servers list
xcloud sites status <site-uuid>
```

## Public API commands

Base path: `/api/v1`

Auth: Laravel Sanctum bearer token with scopes such as `read:servers`, `write:servers`, `read:sites`, `write:sites`, or `*`.

```bash
xcloud health
xcloud user show
xcloud user tokens
xcloud user revoke-token <token-id> --yes
xcloud integrations cloudflare
xcloud blueprints list

xcloud servers list
xcloud servers show <server-uuid>
xcloud servers sites <server-uuid>
xcloud servers databases <server-uuid>
xcloud servers cron-jobs <server-uuid>
xcloud servers monitoring <server-uuid>
xcloud servers tasks <server-uuid>
xcloud servers php-versions <server-uuid>
xcloud servers sudo-users <server-uuid>
xcloud servers create-sudo-user <server-uuid> --data '{"username":"deploy"}' --yes
xcloud servers delete-sudo-user <server-uuid> <sudo-user-uuid> --yes
xcloud servers create-wordpress-site <server-uuid> --data '{"domain":"example.com"}' --yes
xcloud servers power-cycle <server-uuid> --yes

xcloud sites list
xcloud sites show <site-uuid>
xcloud sites backups <site-uuid>
xcloud sites status <site-uuid>
xcloud sites ssl <site-uuid>
xcloud sites domain <site-uuid>
xcloud sites monitoring <site-uuid>
xcloud sites events <site-uuid>
xcloud sites deployment-logs <site-uuid>
xcloud sites git <site-uuid>
xcloud sites ssh <site-uuid>
xcloud sites update-ssh <site-uuid> --data '{"public_key":"ssh-ed25519 ..."}' --yes
xcloud sites backup <site-uuid> --yes
xcloud sites purge-cache <site-uuid> --yes
```

`servers power-cycle` calls the API endpoint `POST /servers/{uuid}/reboot`. The command name avoids local-machine dangerous words while still mapping to the xCloud server action.

## Enterprise API commands

Base path: `/api/enterprise/v1.0`

Auth: Laravel Sanctum bearer token for an enterprise client (`auth.enterprise`).

```bash
xcloud --api-flavor enterprise health
xcloud enterprise servers list
xcloud enterprise servers show <server-uuid>
xcloud enterprise servers create --data '{"name":"Demo"}' --yes
xcloud enterprise servers update <server-uuid> --data '{"name":"New"}' --yes
xcloud enterprise servers delete <server-uuid> --yes

xcloud enterprise sites list
xcloud enterprise sites show <site-uuid>
xcloud enterprise sites create --data '{"domain":"example.com"}' --yes
xcloud enterprise sites update <site-uuid> --data '{"domain":"example.org"}' --yes
xcloud enterprise sites delete <site-uuid> --yes
xcloud enterprise sites suspend <site-uuid> --yes
xcloud enterprise sites staging <site-uuid> --yes
xcloud enterprise sites publish-staging <site-uuid> --yes
xcloud enterprise sites purge-cache <site-uuid> --yes
xcloud enterprise sites ssh-keys <site-uuid>
xcloud enterprise sites create-ssh-key <site-uuid> --data '{"public_key":"ssh-ed25519 ..."}' --yes

xcloud enterprise users list
xcloud enterprise users show <user-uuid>
xcloud enterprise users create --data '{"email":"user@example.com"}' --yes
xcloud enterprise users update <user-uuid> --data '{"name":"User"}' --yes
xcloud enterprise users delete <user-uuid> --yes
xcloud enterprise users get-auth-token <user-uuid>

xcloud enterprise addon email products
xcloud enterprise addon email provider
xcloud enterprise addon email purchase --data '{"product_uuid":"..."}' --yes

xcloud enterprise addon mailbox products
xcloud enterprise addon mailbox accounts
xcloud enterprise addon mailbox show <mailbox-uuid>
xcloud enterprise addon mailbox purchase --data '{"product_uuid":"..."}' --yes
xcloud enterprise addon mailbox update <mailbox-uuid> --data '{"name":"Inbox"}' --yes
xcloud enterprise addon mailbox delete <mailbox-uuid> --yes

xcloud enterprise addon patchstack products
xcloud enterprise addon patchstack sites
xcloud enterprise addon patchstack show <site-uuid>
xcloud enterprise addon patchstack purchase --data '{"site_uuid":"..."}' --yes
xcloud enterprise addon patchstack delete <site-uuid> --yes
```

## Raw API escape hatch

```bash
xcloud api get /servers --query page=2 --output json
xcloud api put /sites/<uuid>/ssh --data '{"public_key":"ssh-ed25519 ..."}' --yes
xcloud api post /sites/<uuid>/backup --data '{}' --yes
xcloud --api-flavor enterprise api get /servers --output json
```

The raw path is automatically prefixed with the configured API base path.

## Endpoint map source

The route map was initially researched from:

- xCloud Public routes: `routes/public-api.php`
- xCloud Public OpenAPI: `docs/public/xcloud-public-api.openapi.yaml`
- xCloud Enterprise routes: `routes/xcloud-enterprise-api.php`
- xCloud Enterprise OpenAPI: `docs/enterprise/xcloud-enterprise-api.openapi.json`
- xCloud Enterprise reference: `docs/api/xcloud-enterprise-api-reference.md`
