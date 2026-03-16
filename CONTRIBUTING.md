# Contributing to ModuleX JS SDK

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/ModuleXAI/modulex-js.git
cd modulex-js

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Type check
pnpm lint
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build the package (ESM + CJS + types) |
| `pnpm clean` | Remove dist/ and coverage/ |
| `pnpm dev` | Build in watch mode |
| `pnpm lint` | Type check with TypeScript |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:integration` | Run integration tests (requires `.env`) |

## Running Integration Tests

Integration tests require a real ModuleX API account. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
# Edit .env with your values
pnpm test:integration
```

## Code Style

- **TypeScript strict mode** is enforced
- No external linter/formatter is configured — follow existing code conventions
- Use `camelCase` for method names and parameters
- Use `snake_case` for API request/response fields (SDK converts automatically)
- Keep zero runtime dependencies

## Branch Naming

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation changes
- `chore/short-description` — maintenance tasks

## Commit Messages

Use concise, imperative mood commit messages:

```
feat: add workflow duplication endpoint
fix: handle 429 retry-after header correctly
docs: update SSE streaming examples
chore: bump typescript to 5.5
```

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. Add or update tests for any changed functionality
3. Ensure `pnpm lint && pnpm test && pnpm build` all pass
4. Update documentation if you changed public APIs
5. Open a PR with a clear title and description
6. Link any related issues

PRs require at least one maintainer review before merging.

## Adding a New Endpoint

1. Add types in `src/types/<resource>.ts`
2. Add the method in `src/resources/<resource>.ts`
3. Re-export any new public types from `src/index.ts`
4. Add a unit test in `tests/<resource>.test.ts`
5. Add an integration test in `tests/integration/<resource>.test.ts`

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

Open a [GitHub Discussion](https://github.com/ModuleXAI/modulex-js/discussions) or reach out at dev@modulex.dev.
