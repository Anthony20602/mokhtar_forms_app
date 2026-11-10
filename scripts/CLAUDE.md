<claude-mem-context>
# Recent Activity

### Nov 10, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #181 | 2:03 PM | ○ | Dev PostgreSQL confirmed running on 5433; port 3000 occupied while the configured web port 3100 is free | ~281 |
| #133 | 10:23 AM | ● | Dev database startup still blocked: embedded PostgreSQL binaries missing from node_modules, so the data import could not reach the database | ~500 |
| #132 | 10:22 AM | ↻ | dev-db.mjs rewritten to drive PostgreSQL through pg_ctl and initdb with start, stop, and status commands | ~542 |
| #131 | " | ○ | Root cause of dev database start failure: PostgreSQL refuses to run under an administrator account on Windows | ~388 |
| #130 | " | ● | Dev database still fails to start after the relative-path patch; the underlying error is hidden | ~426 |
| #126 | 10:21 AM | ● | dev-db.mjs switched to a cwd-relative data path and gained error handling for initialise and start | ~366 |
| #115 | 10:20 AM | ◆ | dev-db.mjs added: runs an embedded PostgreSQL cluster on port 5433 with data in .pgdata for development | ~465 |
| #114 | " | ◆ | db-backup.mjs added: pg_dump-based SQL backup into ./backups with auto-located pg_dump on Windows | ~477 |
| #113 | " | ◆ | db-import.mjs created: one-time transactional import of Saghbine.db persons into PostgreSQL with gender and religion normalization | ~591 |
| #112 | " | ◆ | db-setup.mjs added: creates the database if missing, then applies SQL migrations tracked in schema_migrations | ~458 |
| #111 | " | ◆ | Shared DB script helpers created in scripts/_db.mjs: DATABASE_URL loading, maintenance-DB URL, and friendly connection error messages | ~455 |
</claude-mem-context>