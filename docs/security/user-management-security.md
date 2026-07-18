# User Management security contract

All User Management reads and mutations go through `/api/operations/users`.
The handler resolves the bearer session with `requireForgeActor`, checks the
actor's live account status and capability set, and uses the server-only
Supabase admin client. No service key or Auth admin method is imported by
browser code.

Role mutations require a reason, block self-assignment and self-revocation,
protect the final Owner, and require the appropriate capability. Owner
assignment is Owner-authorized only. Account-status mutations block self
lockout and Admin changes to an Owner. Every successful role or status change
writes an identity audit event with actor, target, reason and before/after
state.

Player Accounts are displayed as safe summaries with masked Player IDs. The
service does not update verification, ownership, visibility or other protected
Player Identity fields. Auto Redeem is reduced to consent state; provider
credentials, payloads and redemption internals are excluded.

The four new identity tables have forced RLS, no `anon` or `authenticated`
table grants and service-role-only access. The identity RPC is restricted to
authenticated callers. Supabase security advisors still report pre-existing
warnings across legacy public tables/functions and note the new forced-RLS
tables have no browser policies; this is intentional because browser table
access is revoked. Advisor output is not a zero-warning claim for the whole
project.
