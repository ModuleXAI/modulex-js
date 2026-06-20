/**
 * Type-level guard — org role `member` retired (request side only).
 *
 * The org `member` role was retired (organizations are owner/admin only), so it
 * must NOT be an accepted REQUEST role. The `@ts-expect-error` directives below
 * fail compilation with TS2578 ("Unused '@ts-expect-error' directive") if
 * `RoleUpdateParams.role` or `InviteParams.role` is ever widened back to include
 * `'member'`.
 *
 * Enforcement: this file is type-checked by `pnpm lint` via
 * `tsconfig.typecheck.json` (the main `tsconfig.json` excludes `tests/`). It is
 * NOT a vitest runtime test — it uses the `.test-d.ts` suffix, and the vitest
 * runner only collects files ending in `.test.ts`, so it is skipped there.
 *
 * Scope note: read/response role fields (e.g. `RoleUpdateResponse.new_role`)
 * stay loose `string` so historical `'member'` data still parses — that is
 * deliberately NOT guarded here.
 */
import type { RoleUpdateParams, InviteParams } from '../../src/types/organizations';

// Valid: `'admin'` is the only accepted request role.
const okRole: RoleUpdateParams = { role: 'admin' };
const okInvite: InviteParams = { invitedEmail: 'a@b.com', role: 'admin' };

// @ts-expect-error - 'member' was retired; not assignable to RoleUpdateParams.role ('admin').
const badRole: RoleUpdateParams = { role: 'member' };
// @ts-expect-error - 'member' was retired; not assignable to InviteParams.role ('admin').
const badInvite: InviteParams = { invitedEmail: 'a@b.com', role: 'member' };

// Reference the bindings so they are never flagged as unused.
void okRole;
void okInvite;
void badRole;
void badInvite;
