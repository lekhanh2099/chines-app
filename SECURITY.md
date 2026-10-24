# Security policy

## Supported versions

Security fixes target the latest `main` branch. Older commits and development
branches are not maintained as separate security release lines. When reporting a
deployed build, include its commit or version if known.

## Report a vulnerability privately

Use GitHub's [Report a vulnerability form](https://github.com/lekhanh2099/chines-app/security/advisories/new).
Private vulnerability reporting is enabled for this repository.

Do not disclose vulnerability details in public issues, pull requests or
discussions. Ordinary bugs and feature requests can use the existing
[Engineering task form](https://github.com/lekhanh2099/chines-app/issues/new/choose).

Include enough information to investigate:

- The affected feature, route and commit or deployed version, if known.
- Reproduction steps using accounts and synthetic data you control.
- The observed behavior, expected security boundary and potential impact.
- A minimal proof of concept or redacted screenshots/logs, when useful.

Never submit passwords, session cookies, access tokens, Supabase secret or
service-role keys, AI provider keys, or another person's private data. Redact
sensitive values before attaching evidence. Avoid destructive testing or access
to accounts and data you do not control.

## Handling and disclosure

Maintainers assess reports privately, validate the affected boundary and prepare
a scoped fix with regression evidence. The reporting channel is used to discuss
reproduction details, remediation and coordinated public disclosure. Share
vulnerability details publicly only after coordinating with the maintainer.

Contributors handling security fixes follow the existing
[change and verification workflow](CONTRIBUTING.md) and
[risk and confirmation policy](docs/agent/risk-confirmation.md). Database rights,
production changes and credentials retain their existing approval boundaries.

Repository policy, automated scanning and passing CI provide different evidence.
They do not establish that every application path or production environment has
been audited. Security fixes and their production rollout must be verified
separately.
