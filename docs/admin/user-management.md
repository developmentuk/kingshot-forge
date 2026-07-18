# User Management — Operations Centre

Authorized Operations users can open `/operations/users` to search and page
through the safe Forge Identity projection. Filters cover role and account
status. `/operations/users/:userId` provides detail, linked Player Account
summary, capabilities, Auto Redeem consent state and identity audit history.

Role assignment, role revocation and account-status changes are server
authorized and require a written reason. The UI exposes the available controls
but the API remains authoritative for Owner protection, final-owner safety,
self-lockout prevention and capability checks.

The Player View `/settings` route contains account, linked Player Account,
Auto Redeem and security summaries. It does not expose Auth metadata or
provider credentials. Workspace preferences remain authorization-safe because
the switcher accepts only currently accessible workspace IDs.

The current list implementation obtains a bounded server-side Auth page and
then filters and paginates the safe projection. This is suitable for the
foundation and is explicitly a scale follow-up for 8.0C.
