# Make product quoting yours

Read CLAUDE.md and the current migration, CLI and smoke suite. Ask for the field, rule or wording the operator wants. Inspect existing records, describe the change, add a new numbered migration and update the CLI, tests and documents that use it. Never rewrite an applied migration. Back up real data and test the migration on a disposable copy before applying it. Do not drop fields or bypass quote approval. Run npm test, then npm run migrate for the authorised local change. Explain the new question the operator can now ask.
