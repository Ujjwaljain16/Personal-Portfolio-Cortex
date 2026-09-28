// GENERATED from agent-verified research; edit records with care.
// Every record cites commits/files/PRs (see `evidence`) and says how it was checked.
// Decisions come from ADRs, design docs and commit history; investigations need a
// measurement or a reproduced analysis. `provenance` says whether the reasoning was
// written down at the time ("recorded") or inferred from history ("reconstructed").

export type RecordKind = "decision" | "investigation";
export type RecordStatus = "adopted" | "superseded" | "reverted" | "partial" | "abandoned";
export type Verdict = "adopted" | "confirmed" | "partial" | "rejected" | "inconclusive";
export type EvidenceType = "commit" | "file" | "pr" | "issue" | "doc" | "benchmark" | "test" | "release";

export interface EvidenceLink {
    type: EvidenceType;
    label: string;
    /** Omitted when the source is not public (e.g. the private migrateDB repository). */
    href?: string;
    note: string;
}

export interface Alternative {
    option: string;
    whyNot: string;
}

export interface Measurement {
    label: string;
    value: string;
    source: string;
}

export interface EngineeringRecord {
    id: string;
    kind: RecordKind;
    project: string;
    /** Set when the project has a page under /projects. */
    projectId?: string;
    title: string;
    date: string; // YYYY-MM-DD, from the decisive commit / PR merge / document
    dateSource: string;
    provenance: "recorded" | "reconstructed";
    rationaleSource: "stated" | "inferred";
    origin: string;
    authors: string[];
    /** Strongest records, listed first. */
    featured: boolean;
    // decisions
    context?: string;
    decision?: string;
    alternatives?: Alternative[];
    consequences?: string;
    status?: RecordStatus;
    // investigations
    question?: string;
    method?: string;
    result?: string;
    measured?: boolean;
    numbers?: Measurement[];
    verdict?: Verdict;
    evidence: EvidenceLink[];
    /** What was opened or run to confirm the record. */
    verification: string;
}

export const records: EngineeringRecord[] = [
    {
        "id": "ab-fail-closed-framing-and-config",
        "kind": "decision",
        "project": "AgentBrake",
        "projectId": "agentbrake",
        "title": "Anything the proxy cannot parse is now blocked instead of forwarded, and a bad policy file stops startup",
        "date": "2026-09-28",
        "dateSource": "commit 373adcd",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal project",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "In 0fc99c8 the interceptor split each stdin chunk on newlines, ran JSON.parse on each piece, and in the catch branch wrote the piece to the server unchanged. A tool call split across two chunks therefore reached the server as two unchecked fragments, and any message that JavaScript's JSON.parse rejects but another JSON parser accepts (for example a bare NaN) skipped every policy. The loader had the same shape: a config file that failed validation was replaced by a hand-written default with no policies.",
        "decision": "Framing moved to a byte-level line buffer used in both directions (src/proxy/framing.ts), with a size cap and UTF-8 validation. On the client path, unparseable input, JSON-RPC batches, non-object messages, malformed tools/call params, unknown policy actions and a policy that throws are all answered with a JSON-RPC error and not forwarded; forwarded messages are re-serialised so the server sees what the policies saw. An invalid or missing config exits with code 2 unless AGENT_BRAKE_ALLOW_INVALID_CONFIG=1 is set.",
        "alternatives": [
            {
                "option": "Keep forwarding lines that cannot be parsed, and fix only the chunk splitting",
                "whyNot": "The parser difference between the proxy and the server would still let a message through unchecked; blocking is the only safe answer when the proxy cannot classify a message."
            },
            {
                "option": "Keep the silent fallback to default policies for a bad config",
                "whyNot": "A typo in the policy file would disable enforcement without any sign. The fallback remains available only as an explicit opt-in."
            }
        ],
        "consequences": "tests/proxy.test.ts splits a tools/call at every byte boundary and asserts the policy still applies, and covers multiple messages per chunk, CRLF, invalid UTF-8, batches, oversize lines and duplicate keys. The test count went from 22 to 85. The same commit also fixed max_tool_calls counting one call too few, wired the circuit breaker to real tool errors, and made a killed proxy terminate its child. Remaining limits: the proxy covers stdio only, and regular-expression argument rules can still be bypassed.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "373adcd",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/373adcd",
                "note": "Adds framing, fail-closed handling and config refusal, with the regression tests."
            },
            {
                "type": "commit",
                "label": "0fc99c8",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/0fc99c8",
                "note": "The last commit before the change: the catch branch that forwards unparseable lines."
            },
            {
                "type": "file",
                "label": "tests/proxy.test.ts",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/blob/373adcd/tests/proxy.test.ts",
                "note": "Byte-boundary split test and the other framing cases."
            }
        ],
        "verification": "Read src/proxy/interceptor.ts at 0fc99c8 and at 373adcd; ran npm test (85 passing), tsc --noEmit and the build after the change."
    },
    {
        "id": "superset-deprecated-permissions-explicit-delete-vs-rename",
        "kind": "decision",
        "project": "Apache Superset",
        "title": "Remove deprecated permissions with two explicit-list migrations, not a sweep",
        "date": "2026-09-23",
        "dateSource": "PR #44142 merged (merge commit 350dd0d)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "Issue #33272 (opened 2025-04-29) showed that installs upgraded from 1.5.x keep many permissions that fresh installs lack (for example `can select star on Superset`): 286-291 permissions after upgrading 1.5.2 to 5.0.0-RC2, against 160 on a fresh install. `clean_perms` only deletes PermissionView rows with NULL foreign keys. On the issue, maintainer rusackas noted that the hard part is not deleting a permission a custom role still needs. The per-object database_access/datasource_access/schema_access/catalog_access permissions share names across many view menus, so a name-based sweep is unsafe.",
        "decision": "Two Alembic migrations that name exact (view_menu, permission) pairs on the `Superset` view menu. One deletes permissions with no proportionate successor (`PVM_LIST`, 10 entries in the merged file) through a new `delete_pvms()` helper in superset/migrations/shared/security_converge.py, which unassigns each PVM from roles and reuses `_delete_old_permissions()` for orphan-safe removal. The other maps old permissions to verified live successors (`PVM_MAP`, 29 entries) with the existing `migrate_roles()`, so roles keep access. A rename is used only when the successor is proportionate: four dead permissions whose only successor was a write-level grant (`can_testconn`, `can_sqllab_viz`, `can_import_dashboards`, `can_add_slices`) are deleted instead. The one write-level rename left is `can_copy_dash` to `Dashboard.can_write`, argued in the migration as the same action. Downgrades are documented no-ops.",
        "alternatives": [
            {
                "option": "Delete everything not in an allow-list of current permissions, or sweep by permission name",
                "whyNot": "Stated in the PR: cannot tell dead from 'not used by a built-in role', and names like database_access are reused across many view menus; explicit (view, permission) pairs make the object-level permissions unreachable."
            },
            {
                "option": "Extend `migrate_roles()` to handle deletion with no successor",
                "whyNot": "The author confirmed by reading it that an empty replacement tuple is silently never processed (gabotorresruiz reproduced this), so a small `delete_pvms()` helper was added and `migrate_roles`, `clean_perms` and FAB's `security_cleanup` were left untouched."
            },
            {
                "option": "Rename all deprecated permissions to the successor named in `@deprecated(new_target=...)` (the author's own intermediate state: delete list reduced to 6, rename list up to 34)",
                "whyNot": "gabotorresruiz showed a role holding only the dead `can_testconn` would come out of the migration holding `Database.can_write` (create/edit/delete connections). After that thread `can_testconn`, `can_sqllab_viz`, `can_import_dashboards` and `can_add_slices` moved back to deletion."
            }
        ],
        "consequences": "Review changed the data materially. rebenitez1802 found that the delete list named `can_test_conn` where the real permission is `can_testconn`, and that the rename `can_get_or_create_table` targeted a name that never existed (the real one is `can_sqllab_table_viz`); both silently did nothing. The author then re-checked all 25 deletion candidates and reported that 19 had a live successor. gabotorresruiz showed a role holding only the dead `can_testconn` would gain `Database.can_write`, so four write-level renames went back to deletion. He also showed the policy was not pinned (re-adding that rename left 161 tests green); the author added `test_can_copy_dash_is_the_only_write_level_rename`. Three no-op Alembic merge migrations (2026-09-16, 09-17, 09-23) resolved head splits from master. UPDATING.md documents the split. The lists cover only individually verified permissions. +1152/-2 lines, 11 files. Merged 2026-09-23; not in a tagged release as of 2026-09-28 (latest tag 6.1.0, 2026-05-13).",
        "status": "adopted",
        "evidence": [
            {
                "type": "pr",
                "label": "apache/superset/pull/44142",
                "href": "https://github.com/apache/superset/pull/44142",
                "note": "Description, review threads and 4 approvals (gabotorresruiz twice, rebenitez1802, rusackas); merged by rusackas; merge commit 350dd0d60ece9f1aff08d3b89b16c89aa4c1fe8a."
            },
            {
                "type": "issue",
                "label": "apache/superset/issues/33272",
                "href": "https://github.com/apache/superset/issues/33272",
                "note": "'Deprecated permissions are not deleted after upgrade' with permission counts per upgrade path (1.5.2 to 5.0.0-RC2 leaves 286-291 permissions vs 160 on a fresh install); opened 2025-04-29."
            },
            {
                "type": "file",
                "label": "2026-09-10_00-00_1f5f4fb8bfc1_delete_deprecated_permissions_33272.py@350dd0d",
                "href": "https://github.com/apache/superset/blob/350dd0d/superset/migrations/versions/2026-09-10_00-00_1f5f4fb8bfc1_delete_deprecated_permissions_33272.py",
                "note": "PVM_LIST of 10 `Superset` PVMs and the comment block giving removal evidence and why the four write-level successors were not used."
            },
            {
                "type": "file",
                "label": "security_converge.py@350dd0d",
                "href": "https://github.com/apache/superset/blob/350dd0d/superset/migrations/shared/security_converge.py",
                "note": "`delete_pvms()` with the comment that an empty pvm_map is deliberate for `_delete_old_permissions`."
            },
            {
                "type": "commit",
                "label": "350dd0d",
                "href": "https://github.com/apache/superset/commit/350dd0d",
                "note": "Squash merge `fix(security): delete deprecated permissions left over after upgrades (#44142)`, 2026-09-23 (GitHub API)."
            }
        ],
        "verification": "Read the PR body, all review, inline and issue comments, the diff (11 files), and the merged rename migration at 350dd0d, in which 29 keys are counted in PVM_MAP; PVM_LIST has 10 entries in the delete migration diff. The 25/19/6/34 figures are the author's statements in the 2026-09-15 comment; sqlite/Postgres upgrade runs are the reviewers' reported results and were not re-run."
    },
    {
        "id": "bhttp-error-then-bounded-drain",
        "kind": "decision",
        "project": "BHTTP-1",
        "projectId": "bhttp-1",
        "title": "After sending ERROR, half-close and drain input for at most 1 s and 64 KiB",
        "date": "2026-09-22",
        "dateSource": "commit 362fc0a (server with drain); c68262e (spec wording)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "If a program closes a TCP connection while unread data is pending, the operating system may send a reset, and the reset can reach the peer before the ERROR frame it just sent, destroying it. All 41 commits in the public repository are timestamped within 74 minutes (2026-09-22 00:10 to 01:24 +05:30) and the first ten share the times 00:10:25 to 00:10:26, so the history does not show how the design evolved over time; the reasoning below comes from a code comment, the specification and docs/ARCHITECTURE.md.",
        "decision": "fail() writes the ERROR frame, then drain() calls CloseWrite (TCP FIN), sets a 1 s read deadline and copies at most 64 KiB (io.LimitReader) to io.Discard before the connection is closed. SPEC section 9 makes the FIN mandatory and the bounded drain a SHOULD with those reference values. c68262e added that the time limit runs from the moment the ERROR was sent, and that a peer that just sent an ERROR MUST treat a reset like EOF.",
        "alternatives": [
            {
                "option": "Close immediately after writing ERROR",
                "whyNot": "The comment above drainTime in server.go (362fc0a) and docs/ARCHITECTURE.md give the reason: closing with unread data pending can make the OS reset the connection, and the reset can destroy the ERROR before the peer reads it."
            },
            {
                "option": "Drain without a bound",
                "whyNot": "The same comment and docs/ARCHITECTURE.md: without both a time limit and a byte limit a hostile peer could keep the connection open forever by never stopping."
            }
        ],
        "consequences": "TestDrainIsBoundedInSizeAndTime (an endless sender and a silent peer, over net.Pipe, which has no CloseWrite, so the FIN step is not exercised there) and TestServerStopsTalkingToAPeerThatKeepsSending (real TCP) pin the bounds; go test -count=1 ./internal/server passes. The cost is that a connection that hit a fault stays open for up to 1 s.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "362fc0a",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/commit/362fc0a",
                "note": "Introduces internal/server/server.go containing drainTime = time.Second and drainBytes = 64 << 10."
            },
            {
                "type": "commit",
                "label": "c68262e",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/commit/c68262e",
                "note": "Spec: bound measured 'from the moment the ERROR was sent'; peer that just sent ERROR treats reset as EOF."
            },
            {
                "type": "test",
                "label": "server_test.go::TestDrainIsBoundedInSizeAndTime",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/blob/HEAD/internal/server/server_test.go",
                "note": "Asserts the drain consumes no more than drainBytes and returns within drainTime plus 1 s."
            },
            {
                "type": "file",
                "label": "server.go@fe7c745",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/blob/fe7c745/internal/server/server.go",
                "note": "drain() and the constant block with the explanatory comment."
            },
            {
                "type": "file",
                "label": "ARCHITECTURE.md@fe7c745",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/blob/fe7c745/docs/ARCHITECTURE.md",
                "note": "Line 77: after ERROR the server half-closes, then reads and discards for at most one second and 64 KiB."
            }
        ],
        "verification": "Read server.go, SPEC.md section 9 and the tests; go test -count=1 ./internal/server passes. Attribution: All 41 commits are authored by Ujjwaljain16 and none carries a Co-Authored-By trailer. Whether the specification and docs were AI-assisted cannot be determined from the repository; the owner should confirm before publishing."
    },
    {
        "id": "superset-catalog-self-reference-fail-closed",
        "kind": "decision",
        "project": "Apache Superset",
        "title": "Treat a catalog qualifier as a self-reference only when the database is statically configured",
        "date": "2026-09-16",
        "dateSource": "PR #43974 merged (merge commit 187e7d4)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "For engines with `supports_catalog = False` (such as MSSQL) Superset stores permissions and datasets without a catalog, but T-SQL and sqlglot still parse `abcm.dbo.temp` with `abcm` as a catalog. `raise_for_access` then looked up a permission like `[db].[abcm].[dbo]` that cannot exist and denied a query that only restated the connection's own database (issue #31406). Any change sits in an authorization path, so a wrong equality would grant access instead of denying it.",
        "decision": "`raise_for_access` resolves the connection's statically configured database once per check and sets the parsed catalog to None only when it matches that name exactly on a non-catalog engine; the normalised catalog is used for both the catalog_perm/schema_perm check and the `SqlaTable.query_datasources_by_name` lookup. The database name comes from a new engine-spec hook, `get_catalog_from_engine_params` (default in db_engine_specs/base.py reads the URL database; the MSSQL override in mssql.py reads, in the order the real connection string is built: `Database=` inside `odbc_connect`, a `database` URL query parameter, the URL path database, then `connect_args[\"database\"]`). Anything not statically determinable returns None and keeps the existing denial. The exact host/DSN-only URI from the original report stays denied and the PR was reworded to 'partially addresses #31406'.",
        "alternatives": [
            {
                "option": "Compare the parsed catalog only to `database.url_object.database` (first revision of the PR)",
                "whyNot": "rebenitez1802's CHANGES_REQUESTED review showed that for `mssql+pyodbc://SuperSet:pw@abcm` SQLAlchemy yields host='abcm' and database=None, so the fix did not fire for the reporter's own connection, and the tests hid it by setting `url_object.database` on a mock."
            },
            {
                "option": "Fall back to `database.database_name`",
                "whyNot": "The author's comment says it is the Superset connection's display name and can be renamed independently of the real database, so using it as an authorization identity could turn a denied cross-database reference into an allowed one."
            },
            {
                "option": "Resolve the login's default database by querying SQL Server",
                "whyNot": "Adds live I/O to the authorization path; the author scoped it out and gabotorresruiz agreed live resolution has no place there."
            },
            {
                "option": "Case-insensitive comparison of the qualifier and the database name (raised by a Bito bot review suggestion)",
                "whyNot": "Case sensitivity depends on the engine's configurable collation; a false negative falls back to today's denial, while a wrong case-fold would merge two distinct databases. The author kept the comparison exact and gabotorresruiz agreed; rebenitez1802 called the remaining false negative defensible if the PR was scoped honestly."
            }
        ],
        "consequences": "The path-form, `database` query-parameter, odbc_connect and connect_args forms now authorize self-referential qualifiers; a genuinely different database, or a wrong-case name, still fails. Review continued after approval: gabotorresruiz showed that a `?database=` URL query parameter overrides the path database in the connection string SQLAlchemy builds, so the merged hook checks `odbc_connect` first, then the query parameter, then the path, then `connect_args`. `Initial Catalog=` is deliberately not recognised: it is an OLEDB/ADO.NET keyword and the author reports that ODBC Driver 18 ignores it. Reviewers report that the new tests fail on the base commit while the denial guards pass (rebenitez1802: the two headline guards; gabotorresruiz: seven raise_for_access tests at the final head). Cost: the literal DSN-only URI from #31406 is still denied. sadpandajoe closed the issue on 2026-09-17, after the merge, inviting a new ticket if problems remain. +1317/-3 lines, 6 files. Not in a tagged release as of 2026-09-28.",
        "status": "adopted",
        "evidence": [
            {
                "type": "pr",
                "label": "apache/superset/pull/43974",
                "href": "https://github.com/apache/superset/pull/43974",
                "note": "Description, author's design comments (2026-09-08, 09-09, 09-14, 09-16), a CHANGES_REQUESTED review by rebenitez1802 on 2026-09-08 (fix is a no-op for the reporter's URI; tests mask it), approvals by rebenitez1802 (09-09) and gabotorresruiz (09-11, 09-16). Merged by rusackas; merge commit 187e7d4d804555f2f7cd76ad49889a99493b91a7."
            },
            {
                "type": "issue",
                "label": "apache/superset/issues/31406",
                "href": "https://github.com/apache/superset/issues/31406",
                "note": "Original report \"Permission denied for sql access between databases\" (opened 2024-12-11). The PR says it only partially addresses it; sadpandajoe closed it on 2026-09-17 citing the merge."
            },
            {
                "type": "commit",
                "label": "187e7d4",
                "href": "https://github.com/apache/superset/commit/187e7d4",
                "note": "Squash merge `fix(security): handle self-referential catalog qualifiers (#43974)`, 2026-09-16 (GitHub API)."
            },
            {
                "type": "file",
                "label": "mssql.py@187e7d4",
                "href": "https://github.com/apache/superset/blob/187e7d4/superset/db_engine_specs/mssql.py",
                "note": "`get_catalog_from_engine_params` and `_parse_odbc_connect_database` with the docstring stating the precedence rules and the fail-closed None result (read in the PR diff)."
            }
        ],
        "verification": "Read the full PR body, both review threads, every human comment and inline comment, and the diff (gh pr diff 43974; files base.py, mssql.py, security/manager.py, three unit-test files). Test-failure claims are the reviewers' reported runs; the tests were not re-run locally."
    },
    {
        "id": "verify-against-real-infrastructure",
        "kind": "decision",
        "project": "Fuze",
        "projectId": "fuze",
        "title": "Build the real image and run the real stack after mocks and SQLite missed critical defects",
        "date": "2026-09-15",
        "dateSource": "commit 764e2c6 (with a74c00c the same day)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "By 15 September 2026 the backend had a 198-test suite (per the commit messages). The author's gaps.md records that all verification had run against in-memory SQLite (section 9) and a shared local virtualenv (section 11), and that Postgres-specific behaviour and the Docker build had only been reasoned about, not run. A production-readiness pass then built and ran the stack for real.",
        "decision": "Three changes. (1) .github/workflows/docker-build.yml builds the production image on relevant pushes and pull requests, checks that /app/alembic.ini exists in the image, and imports the app inside it. (2) A disposable local rig: Postgres with pgvector and Redis in Docker, the real gunicorn/gevent command in a Linux container, seeded users with pre-minted JWTs, and scripts/locustfile.py wired to the heavy endpoints (the rig is not committed; the seed script and Locust file are). (3) scripts/e2e_smoke_test.py, a 23-check journey covering health, register, login, CORS, bookmark save through real RQ background processing, search, dashboard, recommendations, SSE ticket and auth edge cases. Per a74c00c it was run against hosted Postgres (Supabase) and Redis (Upstash).",
        "alternatives": [
            {
                "option": "Keep relying on SQLite unit tests and a local virtualenv",
                "whyNot": "gaps.md sections 9 and 11 say this was not a clean stand-in for the production image or for Postgres, and the defects listed below were not visible to it."
            }
        ],
        "consequences": "Defects the 198-test suite did not catch: (1) alembic.ini was never copied into the image, so the migration step in start.sh (added 2026-07-27) had probably failed on every boot behind its '|| echo Warning' fallback; this is the author's inference and the Space was not inspected. (2) requirements.txt did not resolve: a real build failed after 428 s with resolution-too-deep (unbounded mcp via scrapling[all]), and playwright==1.53.0 conflicted with scrapling's exact 1.56.0; fixed with mcp==1.24.0 and playwright==1.56.0. (3) alembic/env.py's statement timeout never applied, and CREATE INDEX CONCURRENTLY failed on a fresh Postgres. (4) The analyze_content() call after embedding raised TypeError on every worker job while RQ reported success. The workflow passed on all three commits. Stated limits: two gunicorn workers not load-tested; start.sh still soft-fails migrations; the first production migration run waits for a deploy, which is blocked while the Space is offline.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "764e2c6",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/764e2c6",
                "note": "Message lists the deploy blockers, docker-build.yml, and the pin fixes; 48 files."
            },
            {
                "type": "commit",
                "label": "a74c00c",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/a74c00c",
                "note": "Message: content analysis silently broken for every bookmark, found by an end-to-end run against real Postgres and Redis."
            },
            {
                "type": "file",
                "label": "docker-build.yml@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/.github/workflows/docker-build.yml",
                "note": "Builds the image, asserts /app/alembic.ini exists, imports the app inside it. Header names two defects it would have caught: the missing alembic.ini and an h2/hpack resolution error."
            },
            {
                "type": "doc",
                "label": "gaps.md@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/gaps.md",
                "note": "Sections 9, 11, 13 and 14 give the before and after."
            },
            {
                "type": "file",
                "label": "requirements.txt@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/requirements.txt",
                "note": "mcp==1.24.0, playwright==1.56.0 pins present."
            },
            {
                "type": "file",
                "label": "e2e_smoke_test.py@a74c00c",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/a74c00c/scripts/e2e_smoke_test.py",
                "note": "The 23-check journey (23 check() calls counted)."
            }
        ],
        "verification": "Read both commit messages and the relevant diffs, gaps.md sections 9-14, docker-build.yml; ran 'gh run list --workflow docker-build.yml' (read-only): success for 764e2c6, a74c00c, 491a221; confirmed the two pins in requirements.txt. Could not reproduce the build (Docker daemon not running on this machine). Attribution: Commits 764e2c6, a74c00c and 491a221 carry a 'Co-Authored-By: Claude Sonnet 5' trailer, and gaps.md is an AI-written first-person document (it addresses the repository owner as 'you')."
    },
    {
        "id": "load-test-redis-pool-mass-logout",
        "kind": "investigation",
        "project": "Fuze",
        "projectId": "fuze",
        "title": "Load test at 75 users: a fail-closed JWT revocation check logged out valid users",
        "date": "2026-09-15",
        "dateSource": "commit 764e2c6",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "Where does the single-worker gevent deployment break under concurrent authenticated load, and why?",
        "method": "Disposable local rig in Docker: Postgres+pgvector, Redis, the real 'gunicorn --workers 1 --worker-class gevent' command in a Linux container, 10 users x 40 bookmarks seeded, JWTs minted directly to bypass the login rate limiter, Locust (scripts/locustfile.py) hitting bookmarks, dashboard, text and semantic search, unified-orchestrator recommendations and health. Ran 25 and 75 concurrent users on a laptop Docker VM of about 3.8 GB with shared CPU.",
        "result": "At 75 concurrent users about 38% of authenticated requests returned 401 'Token has been revoked' for tokens that were never revoked (approximate figure from gaps.md and the commit message; no raw Locust output is committed). The author's diagnosis: the Redis pool (max_connections 20, shared by caching, rate limiting and the revocation check) was exhausted and .exists() raised. check_if_token_revoked in run_production.py returned True on any exception, so every failure counted as revoked. Fix in 764e2c6: fail open on Redis errors or a missing connection (the check runs only after signature and expiry validate) and raise the pool to 50. A re-run at 75 users reported 0 failures in 595 requests; because both changes landed together and fail-open cannot return this 401, that does not prove the pool is no longer exhausted. At 25 users the author reports median latency under 100 ms with no failures; at 75 users, 2-5 s, which the author calls consistent with the single gunicorn worker (two workers not re-tested).",
        "measured": true,
        "numbers": [
            {
                "label": "authenticated 401 rate at 75 users before fix",
                "value": "about 38% (approximate as written)",
                "source": "gaps.md section 13; commit 764e2c6 message. Author-reported; no raw output committed."
            },
            {
                "label": "failures at 75 users after fix",
                "value": "0 failures across 595 requests",
                "source": "gaps.md@764e2c6 line 401. Fail-open and pool 50 were applied together."
            },
            {
                "label": "Redis pool size",
                "value": "20 to 50 connections",
                "source": "git show 764e2c6 -- backend/utils/redis_utils.py"
            },
            {
                "label": "median latency at 25 users",
                "value": "under 100 ms, 0% failures",
                "source": "gaps.md section 13 (author-reported)"
            },
            {
                "label": "median latency at 75 users",
                "value": "2-5 s",
                "source": "gaps.md section 13 (author-reported, laptop Docker VM of about 3.8 GB)"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "764e2c6",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/764e2c6",
                "note": "run_production.py: fail-open check with a comment quoting the 38% figure. redis_utils.py: max_connections 20 to 50."
            },
            {
                "type": "file",
                "label": "locustfile.py@764e2c6",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/764e2c6/scripts/locustfile.py",
                "note": "Load script using pre-minted JWTs."
            },
            {
                "type": "doc",
                "label": "gaps.md@764e2c6",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/764e2c6/gaps.md",
                "note": "Section 13 with the method and both runs."
            },
            {
                "type": "file",
                "label": "seed_loadtest_data.py@764e2c6",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/764e2c6/scripts/seed_loadtest_data.py",
                "note": "NUM_USERS = 10, BOOKMARKS_PER_USER = 40; mints JWTs with create_access_token."
            }
        ],
        "verification": "Read the run_production.py and redis_utils.py diffs, the locustfile and gaps.md section 13. Not re-run: needs Docker (daemon not running here) and Postgres+Redis. No regression test pins the fail-open behaviour (no 'revoked_jti' in tests). Numbers are from a laptop VM, so only the shape transfers to real hosting; the fail-open choice trades some revocation enforcement during Redis trouble for availability. Attribution: Commits 764e2c6, a74c00c and 491a221 carry a 'Co-Authored-By: Claude Sonnet 5' trailer, and gaps.md is an AI-written first-person document (it addresses the repository owner as 'you')."
    },
    {
        "id": "classifier-thresholds-calibrated-to-six",
        "kind": "decision",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "Failure classifier thresholds were fitted to six known outcomes; the docs now say so",
        "date": "2026-09-07",
        "dateSource": "doc first committed in ec006c0; correction in commit 38eefbf",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "Stage 17 added 'flashflow report' with a four-label decision tree (STABLE, ACUTE_COLLAPSE, CHRONIC_COLLAPSE, RECOVERY_LIMITED) meant to reproduce Stage 15/16's characterization of six routing policies. It needed two numeric constants.",
        "decision": "Gate on the bottleneck's dispatch share within its own congestion episode (concentrated if at least 1.2x fair share) and on committed work (severe if at least 10x capacity). An undrained queue is classed as collapse first; for every drained case committed work is then checked, whether or not the policy concentrated. The decision tree and both constants were adjusted iteratively until the tool reproduced Stage 15/16's published characterization of the six policies: five exactly, and weighted-round-robin as a documented refinement.",
        "alternatives": [
            {
                "option": "Gate chronic vs acute on fraction of time over capacity (first version)",
                "whyNot": "Misclassified EWMA as RECOVERY_LIMITED: its slow drain (to about 6.85 s of 8 s) gives a fraction comparable to round-robin's."
            },
            {
                "option": "Measure concentration from whole-run completed share",
                "whyNot": "Gave EWMA about 0.8x fair share; completions undercount a backlogged target and the worst episode is not the run-long favorite."
            },
            {
                "option": "Check committed work only on the concentrated branch",
                "whyNot": "Misclassified P2C-load (committed work 4) as RECOVERY_LIMITED instead of STABLE."
            }
        ],
        "consequences": "The original doc and code comment said the constants were chosen up front and not tuned. An audit (9e24add describes its audit as 12 parallel agents) noted that the same document's bug narrative contradicted this; 38eefbf rewrote both to say the constants were calibrated on a fixed six-point sample with no held-out policy or scenario. 9e24add also fixed 'explain' printing 'traffic concentrated' for round-robin; tests now assert on the rendered text. A re-run of all six policies reproduced the documented labels and committed-work values (4, 163, 8, 97, 4, 71) but showed the code comment's '1.4x to 3.1x fair share for every non-round-robin policy' does not hold: EWMA is 4.37x, and P2C-load is 1.05x on two of three seeds, equal to round-robin's 1.053. P2C-load's STABLE label comes from the drained and low-severity gates, not the 1.2 threshold. A seventh policy or another scenario is untested.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "ec006c0",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/ec006c0",
                "note": "Adds the classifier, report/explain/stress-map CLI and the bug narrative."
            },
            {
                "type": "commit",
                "label": "38eefbf",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/38eefbf",
                "note": "Retracts the 'not tuned after the fact' claim in code comment and doc; commit message explains why."
            },
            {
                "type": "commit",
                "label": "9e24add",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/9e24add",
                "note": "Fixes explain narrative contradicting Classify; adds rendered-text tests."
            },
            {
                "type": "file",
                "label": "report.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/report/report.go",
                "note": "Constants 1.2 and 10, the corrected comment, and the windowed dispatch-share function."
            },
            {
                "type": "doc",
                "label": "Stage17-DiagnosticTooling.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage17-DiagnosticTooling.md",
                "note": "Decision tree, the three bugs and the calibration caveat."
            },
            {
                "type": "test",
                "label": "scenario_report_test.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/report/scenario_report_test.go",
                "note": "Tests asserting on the rendered explanation text."
            }
        ],
        "verification": "Read internal/report/report.go and the Stage 17 doc. Built cmd/flashflow in a clone and ran the report for all six policies, then read concentration, committed work and drain time per seed from the JSON it wrote. Five of the six labels match the documented outcomes exactly; weighted round-robin is a documented refinement. The decisive commits (ec006c0, 38eefbf, 9e24add) are authored by Ujjwaljain16. The audit that prompted the correction was an AI-agent review, not an independent human review; the author made the resulting changes."
    },
    {
        "id": "flagship-worst-p99-claim-retracted",
        "kind": "investigation",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "'Adaptive has the worst P99 in every seed' checked against its own JSON and retracted",
        "date": "2026-09-07",
        "dateSource": "commit bbaecb1",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "The README and Stage 16 docs said Adaptive's P99 was the worst of six policies in all three flagship seeds (16000-16002). Does the committed result file say that?",
        "method": "An audit compared the docs to experiments/016-final-synthesis/results/016-flagship-results.json (5 targets at 15-75 ms, Capacity=1, FlashCrowd workload, 8 s horizon, three seeds with 0.3 arrival jitter, six policies). The claim was rewritten in README, Stage16.md, the claim ledger (C24, now RETIRED with a note on the earlier overstatement), the Stage 16 learning notes and docs/index.html. For this record, cmd/experiment-016-flagship was also re-run four times on a clone of HEAD.",
        "result": "The claim was false as written. Adaptive's P99 was the highest of the six policies in seeds 16001 (4732.39 vs EWMA 4717.98 ms, a 0.3 percent margin) and 16002 (4853.07 vs 4725.03 ms), but not in 16000, where EWMA was higher (4399.88 vs 4072.11 ms) and Adaptive was second-highest. In no seed was Adaptive in the lower half of the six. The wording adopted in the repo ('worst of six in 2 of 3 seeds, near-tie in the third') is loose: the near-tie is seed 16001, not 16000. Adaptive's mean latency (583-714 ms) is well below EWMA's (935-983 ms) in every seed, so mean latency alone would have hidden the tail problem. Four re-runs gave identical stdout and identical JSON apart from the timestamp. The source demo doc (Stage16-FlagshipDemo.md) had already hedged ('at or near the worst'); the overclaim entered when it was summarised into README and the ledger.",
        "measured": true,
        "numbers": [
            {
                "label": "Seed 16000 P99: EWMA vs Adaptive (ms)",
                "value": "4399.88 vs 4072.11 (Adaptive not worst)",
                "source": "experiments/016-final-synthesis/results/016-flagship-results.json; re-run identical"
            },
            {
                "label": "Seed 16001 P99: Adaptive vs EWMA (ms)",
                "value": "4732.39 vs 4717.98 (0.3% apart)",
                "source": "same; re-run identical"
            },
            {
                "label": "Seed 16002 P99: Adaptive vs EWMA (ms)",
                "value": "4853.07 vs 4725.03 (Adaptive worst)",
                "source": "same; re-run identical"
            },
            {
                "label": "Mean latency, Adaptive per seed (ms)",
                "value": "638.06 / 714.37 / 582.73",
                "source": "re-run of go run ./cmd/experiment-016-flagship"
            },
            {
                "label": "Mean latency, EWMA per seed (ms)",
                "value": "970.95 / 935.06 / 982.73",
                "source": "re-run of go run ./cmd/experiment-016-flagship"
            },
            {
                "label": "Changed lines across 4 re-runs, excluding timestamp",
                "value": "0",
                "source": "git diff after each run in the clone"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "commit",
                "label": "bbaecb1",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/bbaecb1",
                "note": "Commit message lists the three per-seed P99 pairs and the files corrected (README, Stage16.md, Stage16-ClaimLedger.md, learning notes, docs/index.html)."
            },
            {
                "type": "file",
                "label": "016-flagship-results.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/016-final-synthesis/results/016-flagship-results.json",
                "note": "The result file that disproves the 'every seed' wording."
            },
            {
                "type": "file",
                "label": "Stage16-ClaimLedger.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage16-ClaimLedger.md",
                "note": "Row C24 records the retirement and names the seed-16000 counterexample."
            },
            {
                "type": "commit",
                "label": "5cea6ef",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/5cea6ef",
                "note": "Commit that added the three-seed flagship experiment."
            }
        ],
        "verification": "Read the bbaecb1 message and diff and opened the flagship result JSON at HEAD. Ran the flagship experiment four times in a clone at HEAD (Go 1.23.3); every P99 and mean value matched the committed file and only the timestamp changed. The correcting commit is authored by Ujjwaljain16; its message credits an independent from-scratch audit, which the project describes as an AI-agent pass, not a human review."
    },
    {
        "id": "acute-vs-chronic-collapse",
        "kind": "investigation",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "One metric could not explain why two policies never drain: acute vs chronic collapse",
        "date": "2026-09-07",
        "dateSource": "commit dc74b6c (canonical scenario and first results); interpretation in cc66922",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "In an overloaded 5-target scenario, two of six routing policies never drain their queue within the horizon. Does one measure (traffic concentration or 'committed backlog') explain both?",
        "method": "cmd/experiment-015a runs one fixed scenario (5 targets 15-75 ms, Capacity=1, FlashCrowd base 20 req/s to peak 300 req/s at t=2.5 s, 8 s horizon) across six policies and records top-1 share, peak queue depth, committed backlog (requests dispatched to the bottleneck between congestion onset and material diversion), fraction of the run above rho 1.0, and whether the queue drains. A falsification run (F1, commit dacce77) sent Adaptive load far under capacity. The flagship experiment repeated the scenario over three jittered seeds.",
        "result": "No single measure explained both. Round-robin has a small committed backlog (4) but spends 0.711 of the run over capacity and never drains; Stage15.md attributes this to its fixed 1/5 share to the slowest target exceeding that target's capacity (chronic). Adaptive has a large backlog (86 in 015a) and 0.700 of the run over capacity, also without draining (acute over-commitment during the burst). EWMA has the largest backlog (97) but drains at 6850 ms. F1 (a 3-target topology at load far under capacity) showed concentration alone is not enough: Adaptive reached top-1 share 1.000 with no congestion and zero backlog. Over three jittered flagship seeds round-robin was identical (backlog 4, 0.711, no drain) while Adaptive's backlog was 107/127/93; Adaptive drained in seed 16000 but not in 16001 or 16002, so the acute/chronic contrast is cleanest in the single 015a run. Stage15.md lists the limits: one scenario, six policies, no systematic search for a third failure shape.",
        "measured": true,
        "numbers": [
            {
                "label": "015a committed backlog: RR / WRR / LC / EWMA / P2C / Adaptive",
                "value": "4 / 9 / 6 / 97 / 6 / 86",
                "source": "go run ./cmd/experiment-015a; matches Stage15.md table; re-run identical"
            },
            {
                "label": "015a fraction of run above rho 1.0: RR / Adaptive",
                "value": "0.711 / 0.700",
                "source": "Stage15.md Backlog Dynamics table; re-run time_above_rho1.0: RR 5689 ms, Adaptive 5597 ms (of an 8000 ms horizon)"
            },
            {
                "label": "015a drains within horizon: RR / Adaptive / EWMA",
                "value": "No / No / Yes (6850 ms)",
                "source": "re-run: t7 found=false for RR and Adaptive, 6850 ms for EWMA"
            },
            {
                "label": "015a top-1 share: RR / Adaptive",
                "value": "0.212 / 0.599",
                "source": "re-run output"
            },
            {
                "label": "Flagship RR across seeds 16000/16001/16002",
                "value": "backlog 4/4/4, fraction above cap 0.711/0.711/0.711, drains=false in all",
                "source": "go run ./cmd/experiment-016-flagship"
            },
            {
                "label": "Flagship Adaptive backlog across seeds",
                "value": "107 / 127 / 93 (threshold 0.30)",
                "source": "go run ./cmd/experiment-016-flagship"
            },
            {
                "label": "Flagship Adaptive drains within horizon, seeds 16000/16001/16002",
                "value": "yes / no / no (EWMA: yes / no / yes)",
                "source": "go run ./cmd/experiment-016-flagship, drains= field"
            },
            {
                "label": "F1 (015b): Adaptive at low load, 3 targets",
                "value": "top-1 share 1.000, peak depth 1, no congestion, committed backlog 0",
                "source": "go run ./cmd/experiment-015b"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "dc74b6c",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/dc74b6c",
                "note": "Adds the canonical scenario and the first six-policy result; message notes RR backlog 4 yet never drains."
            },
            {
                "type": "commit",
                "label": "dacce77",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/dacce77",
                "note": "Falsification runs: F1 (Adaptive top-1 share 1.000 with zero congestion), F3, F4, F6."
            },
            {
                "type": "commit",
                "label": "cc66922",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/cc66922",
                "note": "Stage 15 close-out: states committed backlog explains acute collapse only and a second measure is needed for chronic."
            },
            {
                "type": "file",
                "label": "Stage15.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage15.md",
                "note": "Backlog Dynamics section and the Limitations list (single scenario, no search for a third shape)."
            },
            {
                "type": "file",
                "label": "015A-canonical-scenario-backlog-dynamics.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/015-mechanism-identification/results/015A-canonical-scenario-backlog-dynamics.json",
                "note": "Committed per-policy numbers."
            }
        ],
        "verification": "Read Stage15.md, the dc74b6c, dacce77 and cc66922 messages and cmd/experiment-015a/main.go. Re-ran experiment 015a and the flagship in a clone at HEAD; the committed JSON and the docs matched except for the timestamp. The decisive commits are authored by Ujjwaljain16 and were not part of an external review."
    },
    {
        "id": "async-advisory-lock-on-separate-connection",
        "kind": "decision",
        "project": "RecoveryOS",
        "projectId": "recoveryos",
        "title": "Take async advisory locks on a separate sync connection after one leaked permanently",
        "date": "2026-09-02",
        "dateSource": "commit 5655649",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "advisory_lock_async was written for AsyncSession callers (reconciliation, anomaly windows) that deliberately commit the session while still holding the lock. Postgres advisory locks taken with pg_advisory_lock belong to a session (connection), not to a transaction.",
        "decision": "advisory_lock_async no longer uses the caller's session connection. It checks out its own psycopg2 connection from get_sync_engine() via asyncio.to_thread, takes and releases the lock there, catches BaseException (so task cancellation still rolls back), and shields the unlock call from cancellation. An earlier attempt that wrapped the session's async engine in a second AsyncEngine was replaced because it broke the test suite's per-test engine isolation.",
        "alternatives": [
            {
                "option": "Lock and unlock on the caller's own AsyncSession",
                "whyNot": "AsyncSession.commit() returns its DBAPI connection to the pool and may check out a different one. Found live: pg_advisory_unlock ran on a different backend pid, returned false without error, and the real holder went back to the pool still holding the lock, deadlocking every later caller of that key with no exception logged."
            },
            {
                "option": "Wrap the session's async engine in a second AsyncEngine for the lock",
                "whyNot": "Individually correct, but two tests later it hit the documented asyncpg event-loop failure that tests/integration/conftest.py rebuilds engines to avoid."
            }
        ],
        "consequences": "Four new tests in test_advisory_lock_async.py cover release after CancelledError with an aborted transaction, release after the wrapped block commits the session, lock and unlock never going through the caller's session, and release after a plain exception. The test file notes that the commit-based test can pass by chance on a quiet connection pool, so the never-through-the-session test is the deterministic guard. The in-process suite did not expose the bug; the commit message says it appeared when the demo endpoints were tested against a concurrent, multi-container deployment. The helper had been added four days earlier (cb317e9, 2026-08-29). Cost: every locked section now holds one extra pooled sync connection for its duration.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "5655649",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/5655649",
                "note": "Message describes the live reproduction (unlock on a different backend pid), the discarded second-AsyncEngine attempt, and the BaseException/shield changes."
            },
            {
                "type": "file",
                "label": "database.py",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/recoveryos/database.py",
                "note": "advisory_lock_async docstring and implementation use get_sync_engine() plus asyncio.to_thread."
            },
            {
                "type": "test",
                "label": "test_advisory_lock_async.py::test_lock_and_unlock_never_go_through_the_callers_session",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/tests/integration/test_advisory_lock_async.py",
                "note": "Pins the separate-connection property."
            },
            {
                "type": "commit",
                "label": "6be61a3",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/6be61a3",
                "note": "Earlier fix to the sync helper: rollback ran unconditionally and could discard a caller's uncommitted write; scoped to the exception path with a test that fails against the old code."
            },
            {
                "type": "commit",
                "label": "cb317e9",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/cb317e9",
                "note": "Adds advisory_lock_async (2026-08-29) and wraps reconcile_pending_recovery and persist_anomaly_window in it; the first version of the helper that 5655649 later replaced."
            }
        ],
        "verification": "Read commit 5655649 and 6be61a3 messages and diffs, the current advisory_lock_async source, and the test names in test_advisory_lock_async.py. Did not reproduce the deadlock (needs a live multi-container Postgres). Attribution: Decisive commit 5655649 carries a 'Co-Authored-By: Claude Sonnet 5' trailer. All cited commits are authored by Ujjwaljain16. The commit message and docstring read as AI-assisted."
    },
    {
        "id": "bounded-ai-fusion-replaces-zero-authority",
        "kind": "decision",
        "project": "RecoveryOS",
        "projectId": "recoveryos",
        "title": "Let the LLM break economic near-ties and raise risk flags, but never grant permission",
        "date": "2026-09-02",
        "dateSource": "commit 3bf04ea (zero-authority position first pinned in b8ccb2b, 2026-08-29)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "Money-moving decisions in RecoveryOS come from a deterministic propensity/EVI/policy chain. On 2026-08-29 an audit found the docs overclaimed what the LLM influenced, and b8ccb2b corrected them and added a test proving build_decision() never read diagnosis output, which meant deleting the whole diagnosis service would change no outcome.",
        "decision": "Four days later, 3bf04ea gave the investigator a second output, a RecoveryRecommendation (closed six-action enum, confidence, closed-set risk_flags, rationale). orchestrator._apply_ai_fusion can use it in two ways, both behind ai_recommendation_fusion_enabled (default false). (1) Tie-break: it can pick among candidates that already cleared the EVI floor, are individually policy-ALLOWed, and lie within ai_tie_break_tolerance_bps (default 100, i.e. 1%) of the winner; 8e24eb6 later added a confidence floor of 0.5. (2) Escalation: AIRiskSignalEscalationRule, an ordinary policy rule, turns a non-empty risk_flags into ESCALATE. The recommendation has no amount, provider, ID or idempotency-key fields.",
        "alternatives": [
            {
                "option": "Zero AI authority: LLM output is explanation only (the b8ccb2b position)",
                "whyNot": "It was kept for the core argmax and the 11 AI-blind rules, but the LLM then had no causal effect on outcomes; 3bf04ea deliberately superseded it for near-ties and risk flags. The old test was rewritten, and its docstring says so."
            },
            {
                "option": "Let the LLM propose candidates or actions and check them afterwards",
                "whyNot": "README section 16 gives this reason: if AI could propose novel candidates, 'AI may never create permission' would be unenforceable. It also states the AI never sees candidate EVI scores."
            }
        ],
        "consequences": "Structural tests hold the boundary: an AST walk fails if enqueue_recovery_job or process_job reference recommendation identifiers; the pure argmax and the 11 AI-blind policy rules are scanned for diagnosis and confidence identifiers; exactly one rule may reference ai_risk. The rule count is asserted exactly, so adding a rule fails the test until reviewed (78de026 updated it for MoneyExposureLimitRule). The TRD was corrected in 3bf04ea (new section 3.5, threat table) and again in 0456cfb (a RE-CORRECTED note that 'zero causality' was no longer true). Real-model evidence is thin: 2 real recommendations, no tie-break or escalation observed. The 0.5 floor is described in the commit and docs as fixed before any measurement; git history cannot confirm that. The headline benchmark is labelled whole-system lift, not AI-attributed lift.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "b8ccb2b",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/b8ccb2b",
                "note": "Corrects TRD overclaims and adds the structural test that build_decision never reads diagnosis or confidence."
            },
            {
                "type": "commit",
                "label": "3bf04ea",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/3bf04ea",
                "note": "Introduces bounded fusion and the AIRiskSignalEscalationRule; message lists what the AI can never do."
            },
            {
                "type": "commit",
                "label": "8e24eb6",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/8e24eb6",
                "note": "Confidence floor added because confidence was persisted but never read; 0.5 stated as pre-committed, not tuned."
            },
            {
                "type": "file",
                "label": "test_diagnosis_has_no_decision_authority.py",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/tests/integration/test_diagnosis_has_no_decision_authority.py",
                "note": "Docstring records that the old F1 test was deliberately superseded and what remains unconditionally true."
            },
            {
                "type": "test",
                "label": "test_ai_recommendation_adversarial.py::test_execution_boundary_never_references_recommendation_fields",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/tests/unit/test_ai_recommendation_adversarial.py",
                "note": "AST identifier walk over enqueue_recovery_job and process_job."
            },
            {
                "type": "doc",
                "label": "TRD.md",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/docs/TRD.md",
                "note": "Authority hierarchy and the RE-CORRECTED note on the earlier claim."
            }
        ],
        "verification": "Read commits b8ccb2b, 3bf04ea, 8e24eb6; TRD section 3.5; the two test files; ran 'pytest tests/unit' (323 passed) and the execution-boundary and fusion tests in test_ai_recommendation_adversarial.py (4 passed). The integration-level AST tests in test_diagnosis_has_no_decision_authority.py were read but not run (they import DB fixtures). Attribution: Decisive commit 3bf04ea carries a 'Co-Authored-By: Claude Sonnet 5' trailer (it is also a 31-file, about 4,900-line commit that bundles the mission state machine). All cited commits are authored by Ujjwaljain16. The TRD and test docstrings are long AI-assisted prose."
    },
    {
        "id": "compliance-aware-same-budget-baseline",
        "kind": "decision",
        "project": "RecoveryOS",
        "projectId": "recoveryos",
        "title": "Benchmark against a baseline with the same attempt budget and the same compliance rules",
        "date": "2026-09-02",
        "dateSource": "commit 7c65faa (same-budget step in 98f9387, 2026-08-29)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "The incremental-revenue number compares RecoveryOS's real outcomes with a counterfactual naive strategy on a simulator. The first baseline modelled one retry attempt while RecoveryOS could make several, and neither baseline checked the regulatory rules that block RecoveryOS.",
        "decision": "The comparator was rebuilt in steps. 688cd1b made baseline and execution call one shared resolve_simulated_outcome(). 98f9387 gave the naive strategy the same attempt budget (later min(max_retries, mission_max_attempts), 0456cfb). 7c65faa then runs each baseline attempt through the real services.policy_engine.evaluate() chain with a fixed RETRY_NOW candidate, so only the compliance blocking is borrowed from RecoveryOS: propensity, EVI and action selection are not used, and the naive hopeless-failure filter stays. d11e0ae made outcome draws deterministic per (payment_id, attempt), because re-running one seed could give a different headline number. 7b9000d fixed time-based rules reading the real clock for synthetic payments (93% of one seed's BLOCKs).",
        "alternatives": [
            {
                "option": "Single-attempt naive baseline (original)",
                "whyNot": "98f9387: RecoveryOS gets up to max_retries attempts, so the gap mixed 'more attempts' with 'better decisions'. The same commit records that an earlier fair-baseline query summed the whole dataset against one payment and produced a nonsensical negative number."
            },
            {
                "option": "Same-budget baseline that ignores compliance rules",
                "whyNot": "Kept only as compliance_blind_fair_baseline_DIAGNOSTIC_ONLY: it may retry in NPCI peak windows and above RBI limits. RecoveryOS loses to it in all 5 seeds (mean minus 142,189 rupees), and the docs state the compliance-aware baseline, not this one, is the headline comparison."
            }
        ],
        "consequences": "The documented headline changed from +42,491.88 rupees (seed 42, single-attempt baseline) to +73,181.78 rupees (5 seeds, compliance-aware baseline). Limits visible in the code: the compliance-aware baseline stops at its first non-ALLOW verdict and does not reschedule, while RecoveryOS schedules re-evaluations. Both arms use the same per-(payment, attempt) draw, which plausibly explains why RecoveryOS recovers a strict superset (baseline_only = 0 in all seeds); this is an inference, and the artifact does not break down which mechanism produced the 22 to 43 extra recovered payments per seed. The artifact was generated on 2026-09-02, before MoneyExposureLimitRule was added on 2026-09-06, and was not regenerated. The benchmark runs on a simulator, as README section 17 states.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "98f9387",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/98f9387",
                "note": "Introduces the same-attempt-budget baseline and states why the single-attempt baseline was unfair."
            },
            {
                "type": "commit",
                "label": "7c65faa",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/7c65faa",
                "note": "Compliance-aware comparator that reuses the policy engine unmodified."
            },
            {
                "type": "commit",
                "label": "7b9000d",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/7b9000d",
                "note": "Clock bug: 93% of one seed's BLOCKs traced to reading real wall-clock time."
            },
            {
                "type": "commit",
                "label": "d11e0ae",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/d11e0ae",
                "note": "Non-reproducible outcome draws found and fixed; adds baseline_runs unique constraint."
            },
            {
                "type": "file",
                "label": "baseline.py",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/services/pipeline/baseline.py",
                "note": "Docstring for compute_and_persist_compliance_aware_baseline_run and the break-on-first-block loop."
            }
        ],
        "verification": "Read the four commit messages and the baseline.py compliance-aware function and loop end to end; read README sections 9, 10, 17; compared with the per-seed JSON (see the campaign investigation). Attribution: None of the cited commits (688cd1b, 98f9387, 7c65faa, 7b9000d, d11e0ae, 0456cfb) carry a Claude co-author trailer; all are authored by Ujjwaljain16. The repo as a whole is AI-assisted (16 of 139 commits carry the trailer; .claude/ is gitignored as AI tooling), so a general disclosure is still appropriate."
    },
    {
        "id": "compliance-aware-five-seed-campaign",
        "kind": "investigation",
        "project": "RecoveryOS",
        "projectId": "recoveryos",
        "title": "Five-seed campaign against a compliance-aware baseline: positive in every seed",
        "date": "2026-09-02",
        "dateSource": "commit 8d19486",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "Once the baseline gets the same attempt budget and obeys the same compliance rules, does RecoveryOS still recover more revenue, and is the result stable across seeds?",
        "method": "tests/evaluation/multi_seed_runner.py runs five seeds through the live pipeline in an accelerated-cooldown mode (retry cooldown set to 0 so rescheduled re-evaluations are due immediately), with the diagnoser pinned to an invalid Gemini key so the deterministic fallback diagnoser is used and AI fusion stays at its default of off. It then computes a single-attempt baseline, a compliance-blind same-budget baseline (diagnostic only) and the compliance-aware same-budget baseline. Each seed also records safety_integrity checks: duplicate ledger rows and attempts, and that computing baselines did not change decision-table row counts.",
        "result": "Incremental recovery versus the compliance-aware baseline was positive in all five seeds, and RecoveryOS's recovered payments were a strict superset of the baseline's each time (baseline_only = 0). The mean is 73,181.78 rupees, and the README mean and 95% CI (52,918.53 to 93,445.04 rupees) match the artifact. Against the compliance-blind diagnostic comparator RecoveryOS loses in all five seeds. Integrity counters show zero duplicate ledger rows or attempts. Because the runs used the deterministic diagnoser with AI fusion off, the lift is not attributable to the LLM, and unsafe_ai_deltas = 0 is trivially satisfied. Caveats: the baseline stops at its first blocked verdict; the strict-superset result may follow from shared per-attempt draws (an inference, not stated in the repo); the artifact predates the 2026-09-06 policy rule change and was not regenerated.",
        "measured": true,
        "numbers": [
            {
                "label": "Per-seed incremental vs compliance-aware baseline (paise)",
                "value": "5796757; 8458182; 9029644; 7923669; 5382640",
                "source": "tests/evaluation/artifacts/multi_seed_compliance_aware_aggregate.json incremental_recoveryos_vs_compliance_aware_fair_paise"
            },
            {
                "label": "Mean incremental (artifact and independent recomputation agree)",
                "value": "7318178.4 paise (73,181.78 rupees)",
                "source": "aggregate.mean_incremental_recovery_paise; python statistics.mean over the five per-seed values"
            },
            {
                "label": "Standard deviation (artifact and independent recomputation agree)",
                "value": "1632205.069 paise",
                "source": "aggregate.incremental_recovery_std_paise; python statistics.stdev"
            },
            {
                "label": "95% confidence interval of the mean, as reported in the artifact and README",
                "value": "[5291853.03 ; 9344503.77] paise",
                "source": "aggregate.incremental_recovery_95pct_t_ci_paise; reproduced exactly with t = 2.776 (the exact t for 4 degrees of freedom, 2.7764451, gives [5291528.13 ; 9344828.67], about 3 rupees wider on each side)"
            },
            {
                "label": "Recovered revenue means, RecoveryOS vs compliance-aware baseline",
                "value": "113346288.2 vs 106028109.8 paise",
                "source": "aggregate; python mean over per-seed recovered_revenue_paise"
            },
            {
                "label": "Payments recovered only by RecoveryOS, per seed",
                "value": "22; 35; 43; 39; 35 (baseline_only 0 in all)",
                "source": "payment_level_comparison_vs_compliance_aware_baseline"
            },
            {
                "label": "Compliance-blind diagnostic comparator, per seed (paise)",
                "value": "-20535838; -12017715; -15832245; -11483251; -11225425 (mean -14218894.8, i.e. -142,189 rupees)",
                "source": "incremental_recoveryos_vs_compliance_blind_fair_paise_DIAGNOSTIC_ONLY; docs/phase8_priority0_multi_seed_baseline.md addendum states the same mean"
            },
            {
                "label": "Recovery rate, RecoveryOS vs compliance-aware baseline (mean of 5 seeds)",
                "value": "0.4566 vs 0.4213",
                "source": "aggregate.recoveryos_recovery_rate_mean, compliance_aware_baseline_recovery_rate_mean; recomputed from per-seed recovered_count / failed_payments"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "7c65faa",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/7c65faa",
                "note": "The comparator being evaluated."
            },
            {
                "type": "benchmark",
                "label": "multi_seed_compliance_aware_aggregate.json",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/tests/evaluation/artifacts/multi_seed_compliance_aware_aggregate.json",
                "note": "Per-seed and aggregate results, including safety_integrity and blocked-by-rule counts."
            },
            {
                "type": "doc",
                "label": "README.md",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/README.md",
                "note": "Public headline; every figure checked matches the JSON."
            },
            {
                "type": "file",
                "label": "docker-compose.override.baseline.yml",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/docker-compose.override.baseline.yml",
                "note": "Pins the diagnoser to an invalid Gemini key so the campaign runs on the deterministic fallback diagnoser."
            }
        ],
        "verification": "Loaded the aggregate JSON, recomputed mean, sd, CI, means of revenue and the diagnostic gaps in Python and compared to README section 9 and the prose addendum in docs/phase8_priority0_multi_seed_baseline.md. Did not re-run the campaign (about 10 minutes per seed plus Docker). Attribution: Cited commits 8d19486 and 7c65faa carry no Claude co-author trailer; authored by Ujjwaljain16. The repo overall is AI-assisted (16 of 139 commits carry the trailer)."
    },
    {
        "id": "lightgbm-lift-was-duplicate-rows",
        "kind": "investigation",
        "project": "RecoveryOS",
        "projectId": "recoveryos",
        "title": "LightGBM's 0.04 AUC lift came from duplicated rows; logistic regression stays in production",
        "date": "2026-08-25",
        "dateSource": "commit 4d5dd77 (production adapter using LR in 09f9ef9 the same day; splits fixed in 47ffb5f and 60b95eb on 2026-09-02)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "The Phase 2 certificate said LightGBM beat logistic regression by 0.0401 AUC and cleared the lift gate of more than 0.03. Was that lift real?",
        "method": "Set-compared episode IDs across the train and validation parquet splits instead of trusting the certificate. The builder generated val_random and test_scenario with separate build_simulator calls that re-used the seeds of train and test_random respectively, so their first N episodes replayed the same RNG stream. Compared LightGBM and LR on test_temporal, a split with zero overlap with train. After giving those two splits their own seeds (47ffb5f), regenerated the dataset and retrained (60b95eb).",
        "result": "8,820 of val_random's 15,000 rows (58.8%) were verbatim copies of train rows, and 8,739 of test_scenario's 15,000 rows (58.3%) duplicated test_random rows. On the clean test_temporal split LR was marginally ahead of LightGBM (0.8378 vs 0.8374), so the >0.03 gate failed and propensity.py loads model_lr.pkl. After the seeds were decorrelated (47ffb5f), the regenerated artifacts show no LightGBM lift on val_random either (0.8324 vs 0.8324) and 0.0001 on test_temporal. Separately, test_leakage_seed.py, a leakage check on an independent seed, had no test function and never ran in CI until 67f7857.",
        "measured": true,
        "numbers": [
            {
                "label": "Old val_random AUC, LightGBM vs LR (contaminated split)",
                "value": "0.8757 vs 0.8356 (gap 0.0401)",
                "source": "git show cdfa12c:models/recovery/artifacts/eval_val_random.json"
            },
            {
                "label": "Old test_temporal AUC, LightGBM vs LR",
                "value": "0.8374 vs 0.8378",
                "source": "git show cdfa12c:models/recovery/artifacts/eval_test_temporal.json"
            },
            {
                "label": "Duplicate rows: val_random vs train / test_scenario vs test_random",
                "value": "8,820 of 15,000 (58.8%) / 8,739 of 15,000 (58.3%)",
                "source": "gaps.md section C.2 (the parquet data is not committed, so this was not re-derived)"
            },
            {
                "label": "New val_random AUC, LightGBM vs LR",
                "value": "0.8324 vs 0.8324",
                "source": "models/recovery/artifacts/eval_val_random.json at HEAD"
            },
            {
                "label": "New test_temporal AUC, LightGBM vs LR",
                "value": "0.8365 vs 0.8364 (lift 0.0001)",
                "source": "models/recovery/artifacts/eval_test_temporal.json at HEAD; matches README section 10 and the 60b95eb message"
            },
            {
                "label": "Root-cause check: same seed, 1,500 episodes generated twice",
                "value": "1500 of 1500 identical rows; different seed 0 of 1500",
                "source": "ad-hoc script over build_simulator and EpisodeGenerator at HEAD (visible features plus label); run locally, not committed"
            },
            {
                "label": "Propensity unit tests",
                "value": "14 passed",
                "source": "pytest tests/unit/test_propensity.py at HEAD (re-run during this audit), includes test_lgbm_does_not_beat_baseline_on_the_real_holdout_so_lr_stays_default"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "4d5dd77",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/4d5dd77",
                "note": "Documents the 59 percent duplicate finding and the model-selection correction in gaps.md."
            },
            {
                "type": "commit",
                "label": "09f9ef9",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/09f9ef9",
                "note": "Production adapter loads LR, not LightGBM, citing the held-out AUC."
            },
            {
                "type": "commit",
                "label": "47ffb5f",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/47ffb5f",
                "note": "Gives val_random and test_scenario decorrelated seeds."
            },
            {
                "type": "commit",
                "label": "60b95eb",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/60b95eb",
                "note": "Regenerates data and re-certifies; LR remains the model with 0.0001 lift."
            },
            {
                "type": "commit",
                "label": "67f7857",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/commit/67f7857",
                "note": "Adds the CI step because test_leakage_seed.py at repo root had no test_ function and never ran."
            },
            {
                "type": "doc",
                "label": "gaps.md",
                "href": "https://github.com/Ujjwaljain16/RecoveryOS/blob/HEAD/gaps.md",
                "note": "Full audit; its 'not yet fixed' paragraph is stale after 47ffb5f."
            }
        ],
        "verification": "Read gaps.md C.2, the old and new eval JSON via git show and from HEAD, the three fix commits, and test_leakage_seed.py. Ran the propensity unit tests and my seed-determinism script. Could not re-derive the 58.8 percent figure because the parquet data is gitignored. Attribution: None of the cited commits (4d5dd77, 09f9ef9, 47ffb5f, 60b95eb, 67f7857) carry a Claude co-author trailer; all are authored by Ujjwaljain16. The repo overall is AI-assisted (16 of 139 commits carry the trailer)."
    },
    {
        "id": "ml-rewrite-rejected-then-two-stage-reintroduced",
        "kind": "decision",
        "project": "Fuze",
        "projectId": "fuze",
        "title": "Rejected a modular ML rewrite, then rebuilt a similar pipeline behind flags three days later",
        "date": "2026-07-25",
        "dateSource": "commits 691294b and 1f4deb2 (reversing the audit in 34ebbe5 and cf9172d, 2026-07-22)",
        "provenance": "recorded",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "In July 2026 code from a side branch (architecture-shift, last commit 2026-05-13) was being folded into integration-review. ML-CONVERGENCE-AUDIT.md (34ebbe5) and ARCHITECTURE-CONVERGENCE.md (665c370), both 2026-07-22, kept the 3,091-line unified_recommendation_orchestrator.py as canonical and rejected backend/ml/engines/, backend/ml/recommendation/ (including a cross-encoder re_ranker: 'High memory/CPU overhead; causes latency spikes on single-worker deployments'), the Supabase match_user_content RPC ('unneeded RPC dependencies') and a data_layer that 'bypasses' the repository and Unit of Work. cf9172d had brought over the Alembic framework and only the HNSW (0003), user-URL unique (0004) and embedding_metadata (0005) migrations.",
        "decision": "On 2026-07-25 the same shapes were committed as new code. 1f4deb2 added a Pipeline plus Strategy layer (ml/recommendation/{domain,pipeline,retrieval,scorer,data_layer,shadow_evaluator}.py, ml/engines/{base,smart}_engine.py) with a pure-function scorer and a two-stage retriever: pgvector cosine ANN top-100 over saved_content.embedding (HNSW index from 0003), then scoring, with NULL-embedding rows appended. 691294b added Postgres functions search_bookmarks_semantic_v1 and search_bookmarks_hybrid_v1 (migration 0006) and a new /api/search/rpc-semantic endpoint behind the search_rpc flag, falling back to the existing SearchService. The legacy orchestrator stayed the serving path. ADR-001 to ADR-005 (a9ec4d1, same day) describe the layers; ADR-001 calls the orchestrator a 3,092-line 'god object'. No document mentions the 2026-07-22 audit.",
        "alternatives": [
            {
                "option": "Keep only the monolithic orchestrator (position of the 2026-07-22 audit)",
                "whyNot": "Not kept. ADR-001 (2026-07-25) describes the orchestrator as a 3,092-line 'god object' to decompose; the repository has no note reconciling this with the audit's description of it as stable and canonical."
            },
            {
                "option": "Supabase match_user_content.sql RPC",
                "whyNot": "Held back in cf9172d as an 'unneeded RPC'; replaced by the project's own versioned Postgres functions in migration 0006."
            },
            {
                "option": "Cross-encoder re-ranker from the side branch",
                "whyNot": "Rejected in the audit for memory and CPU cost. The new design has no cross-encoder; ranking uses the pure-function scorer (ADR-004)."
            },
            {
                "option": "Existing ORM query using the pgvector <=> operator (SearchService.semantic_search)",
                "whyNot": "Kept as the fallback when the flag is off. It already orders by cosine distance inside Postgres, so the RPC's advantage is unproven: migration 0006 says it removes 'Python/SQLAlchemy round-trip overhead' but no comparison was measured."
            }
        ],
        "consequences": "The new code is only partly live. The orchestrator builds RecommendationPipeline() without a Unit of Work and, since RECOMMENDATION_SHADOW_MODE defaults to true, runs it after each uncached legacy request; its data layer logs 'initialized without UnitOfWork' and returns no candidates (verified: results []), so the shadow comparison sees nothing. Serving through the pipeline (RECOMMENDATION_PIPELINE_ENABLED, default false) would return an empty list. No code sets RecommendationRequest.query_embedding, which the ANN branch needs, so CandidateRetriever is unreachable and untested. The RPC functions have no tests, the endpoint has no frontend caller, and the flag defaults to false in code (runtime flag values cannot be checked). HNSW speed and recall are asserted only in the 0003 docstring; no EXPLAIN output or recall measurement is in the repo.",
        "status": "partial",
        "evidence": [
            {
                "type": "commit",
                "label": "34ebbe5",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/34ebbe5",
                "note": "ML-CONVERGENCE-AUDIT.md rejects engines/, recommendation/, re_ranker and RPC search."
            },
            {
                "type": "commit",
                "label": "cf9172d",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/cf9172d",
                "note": "Brings only the HNSW/unique/metadata migrations; holds the RPC SQL as 'unneeded'."
            },
            {
                "type": "commit",
                "label": "1f4deb2",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/1f4deb2",
                "note": "Adds the pipeline, retriever, scorer, SmartEngine, shadow evaluator and golden tests (21 files, 2,108 insertions)."
            },
            {
                "type": "commit",
                "label": "691294b",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/691294b",
                "note": "Adds migration 0006, rpc_search_service.py and a new POST /api/search/rpc-semantic endpoint gated by the search_rpc flag."
            },
            {
                "type": "file",
                "label": "retrieval.py@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/backend/ml/recommendation/retrieval.py",
                "note": "Two-stage ANN query and NULL-embedding fallback; the ANN branch needs request.query_embedding."
            },
            {
                "type": "file",
                "label": "0003_hnsw_indexes.py@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/backend/alembic/versions/0003_hnsw_indexes.py",
                "note": "HNSW parameters and CONCURRENTLY rationale."
            },
            {
                "type": "commit",
                "label": "a9ec4d1",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/a9ec4d1",
                "note": "Adds ADR-001 to ADR-006 (2026-07-25, two minutes after 1f4deb2)."
            },
            {
                "type": "file",
                "label": "unified_recommendation_orchestrator.py@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/backend/ml/unified_recommendation_orchestrator.py#L2371-L2430",
                "note": "Builds RecommendationPipeline() with no UnitOfWork; shadow mode default true, cutover default false."
            }
        ],
        "verification": "Read ML-CONVERGENCE-AUDIT.md, ARCHITECTURE-CONVERGENCE.md, cf9172d/1f4deb2/691294b diffs, retrieval.py, data_layer.py, orchestrator wiring (lines 2366-2440), grep for query_embedding assignments and CandidateRetriever usage (none outside retrieval.py/data_layer.py); ran RecommendationPipeline().run() in a Python shell: 'uow: None results: []'; verified backend/ml at 665c370 has no engines/ or recommendation/ directories; wc -l of the orchestrator before 1f4deb2 was 3,091. Attribution: All cited commits are authored by Ujjwaljain16 and none carries a Claude co-author trailer. The audit and ADR documents are written in a structured, emoji-marked style, but the repository does not say whether they were AI-assisted."
    },
    {
        "id": "minidb-volcano-vs-vectorized-benchmark",
        "kind": "investigation",
        "project": "MiniDB",
        "projectId": "minidb",
        "title": "Vectorized executor missed its 5-10x goal: measured about 1.0-2.3x",
        "date": "2026-06-16",
        "dateSource": "commit 7b7c4ce (benchmarks/volcano_vs_vectorized.ts, docs/BENCHMARKS.md, Architecture.md chapter 5)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "How much faster is the DataChunk engine than the Volcano engine on SELECT name, salary FROM employees WHERE age > 50 (10% selectivity), and why is it not the 5-10x the authors expected?",
        "method": "benchmarks/volcano_vs_vectorized.ts: for 10k, 50k and 100k rows, rows are inserted directly into the heap, then the physical plan runs through the Volcano Executor and through VecSeqScan/VecFilter/VecProject, with 3 warm-ups and 5 timed iterations each, each in its own transaction. Architecture.md attributes the small gap to per-row async overhead and to strict-2PL row locking. To test that, a copy of the script (not committed to the repository) was run at 100k rows only, in four variants, three times each: default; TrackedOperator.next() replaced by a pass-through (removes the per-row performance.now() calls the Volcano tree makes); LockManager.acquireRowLock replaced by an empty async function; both changes together. No repository files were modified.",
        "result": "Six runs of the documented script gave about 1.5-2.3x at 10k rows, 1.1-1.4x at 50k and 1.0-1.3x at 100k, so the gap is small and noisy; the documented 1.19x at 100k is inside that range. Stubbing out row locks cut vectorized time at 100k rows from roughly 183-224 ms to 57-71 ms and Volcano from 222-270 ms to 100-116 ms. Volcano is also timed with two performance.now() calls per row per operator (TrackedOperator), about 14-24% of its time; with tracking off the 100k speedup was about 0.95-1.17x. With both locks and tracking removed, the vectorized engine was only about 1.1-1.4x faster. The comparison is not like for like: Volcano materializes a ResultSet, while the vectorized side only counts surviving rows in the selection vector. Runs made while the machine was busy varied widely and are not reported.",
        "measured": true,
        "numbers": [
            {
                "label": "Documented, 10k rows: Volcano / Vectorized",
                "value": "24.86 ms / 11.39 ms (2.18x)",
                "source": "docs/BENCHMARKS.md, README section 10"
            },
            {
                "label": "Documented, 100k rows: Volcano / Vectorized",
                "value": "173.25 ms / 145.02 ms (1.19x)",
                "source": "docs/BENCHMARKS.md"
            },
            {
                "label": "Documented earlier measurements",
                "value": "1.26x at 10k, 1.82x at 50k, 1.27x at 250k after direct page decoding",
                "source": "docs/Architecture.md, chapter 5 section 8 (lines 3494-3509)"
            },
            {
                "label": "Re-run, 10k rows",
                "value": "Volcano 28.01 ms / Vectorized 12.38 ms (2.26x)",
                "source": "npx tsx benchmarks/volcano_vs_vectorized.ts (my run)"
            },
            {
                "label": "Re-run, 50k rows",
                "value": "Volcano 102.86 ms / Vectorized 71.42 ms (1.44x)",
                "source": "same run"
            },
            {
                "label": "Re-run, 100k rows",
                "value": "Volcano 218.71 ms / Vectorized 166.72 ms (1.31x)",
                "source": "same run"
            },
            {
                "label": "Independent re-runs (5 runs) of the unmodified script, speedup range",
                "value": "10k: 1.48-2.22x; 50k: 1.12-1.35x; 100k: 1.02-1.32x",
                "source": "npx tsx benchmarks/volcano_vs_vectorized.ts, verifier runs"
            },
            {
                "label": "Ablation, 100k, default, 3 runs (Volcano / Vectorized ms)",
                "value": "269.80/223.58, 244.18/200.02, 221.97/183.00",
                "source": "zz_exp_locks2.ts, no env vars"
            },
            {
                "label": "Ablation, 100k, per-row tracking off",
                "value": "213.50/210.99, 185.11/195.50, 191.51/163.36",
                "source": "zz_exp_locks2.ts, PLAIN=1"
            },
            {
                "label": "Ablation, 100k, row locks stubbed out",
                "value": "116.34/70.90, 108.27/56.72, 99.72/57.31",
                "source": "zz_exp_locks2.ts, NOLOCK=1"
            },
            {
                "label": "Ablation, 100k, locks stubbed and tracking off",
                "value": "81.07/61.09, 76.91/53.94, 91.21/79.81",
                "source": "zz_exp_locks2.ts, NOLOCK=1 PLAIN=1"
            }
        ],
        "verdict": "inconclusive",
        "evidence": [
            {
                "type": "commit",
                "label": "7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/commit/7b7c4ce",
                "note": "Adds the benchmark and BENCHMARKS.md 'Engineering Reality' text: 'While we didn't achieve 10x...'."
            },
            {
                "type": "file",
                "label": "Architecture.md@6a0c80d",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/6a0c80d/MiniDB_Projects/Team_ARIES_Recovery/docs/Architecture.md",
                "note": "Chapter 5 sections 7-8: the lock bottleneck explanation and the 1.26x/1.82x/1.27x measurements. The 350 ms vs 20 ms Amdahl figures there are introduced with 'Suppose' and are illustrative, not measured."
            },
            {
                "type": "file",
                "label": "Executor.ts",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/HEAD/MiniDB_Projects/Team_ARIES_Recovery/src/execution/Executor.ts",
                "note": "TrackedOperator wraps every operator and calls performance.now() around each next()."
            }
        ],
        "verification": "Ran volcano_vs_vectorized.ts unmodified; ran my ablation copies (untracked, since removed from the clone; kept under decisions/minidb_experiments) three times per variant; read VecSeqScan.ts, SeqScanOp.ts, Executor.ts, VecProject.ts. Single machine, Node 22.19, Windows 11, other processes may have been running. Attribution: All cited commits are authored by Ujjwaljain16 (git shortlog: 21 commits, one author). The README lists a two-person team, and git history cannot show which parts each person wrote, so the record should say \"commits by Ujjwaljain16; two-person course project\". No Co-Authored-By trailers exist in the history; whether AI tools were used cannot be determined from the repository. The 5-10x expectation and the lock explanation come from docs/Architecture.md (chapter 5), whose long narrative style may be AI-assisted; thi"
    },
    {
        "id": "typeaheadx-virtual-nodes-150-1000-500",
        "kind": "decision",
        "project": "TypeAheadX",
        "title": "Virtual nodes per Redis node set to 500 after trying 150 and 1000",
        "date": "2026-06-10",
        "dateSource": "commit b116d06 (settles on 500); 66845c0 (150 measured, 1000 chosen)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "With 3 physical nodes the ring arcs are uneven unless each node is placed many times. The first ring used 150 virtual nodes per node. This was a course project, and the 150, 1000 and 500 stages all fall within under two hours of one day (66845c0 at 03:12 and b116d06 at 04:59 on 2026-06-10, +05:30).",
        "decision": "At 66845c0 the phase-4 distribution doc reports that 150 vnodes gave ownership 39.6% / 28.6% / 31.7% and concludes VIRTUAL_NODES=1000 (Settings default 1000). In b116d06 the docs, scripts and Settings default were changed to 500: 'providing 90% of the load balancing benefits of 1000 virtual nodes, but consuming only 50% of the memory footprint and CPU routing cost'. backend/.env.example (changed in 05af6b4) and the Settings default are 500; the ConsistentHashRing constructor default in consistent_hash_ring.py is still 150 and applies only when no setting is passed.",
        "alternatives": [
            {
                "option": "150 virtual nodes",
                "whyNot": "Measured ownership 39.6% / 28.6% / 31.7% (ring_analysis.py); redis-a owned about 6 points more than its fair share."
            },
            {
                "option": "1000 virtual nodes",
                "whyNot": "Better balance (33.3% / 32.5% / 34.1%) on a ring of 3000 positions, twice the 1500 at 500. The doc's own estimate says the extra lookup cost is negligible, so the '90% of the benefit at 50% of the cost' argument in b116d06 is asserted rather than measured. b116d06 also left the sentence 'reduced the standard deviation of arc sizes by nearly 7x' in place, which matches 1000 (7.62e35 to 1.11e35), not 500 (2.40e35, about 3.2x)."
            }
        ],
        "consequences": "Final ownership with 500: 33.86% / 34.58% / 31.57% (ring_analysis.py re-run, matching README). Rebalance moved 24.64% of keys at 1000 vnodes (66845c0 doc) and 26.18% at 500 (b116d06 doc), so 500 is a little further from the ideal 25%. A sweep over the deterministic ring gave ownership standard deviation of 25.87 (1 vnode), 6.02 (10), 0.40 (50), 4.64 (150), 1.28 (500) and 0.66 (1000) percentage points: balance is not monotonic in vnode count and one fixed ring is a single sample, so 50 happens to beat 500. Later doc figures (10 vnodes about 30% std, 150 about 10%) are not produced by any script in the repo; the sweep gives 6.02 and 4.64.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "66845c0",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/66845c0",
                "note": "docs/phase4-distribution-analysis.md with the 150/500/1000 table; config default 1000."
            },
            {
                "type": "commit",
                "label": "b116d06",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/b116d06",
                "note": "Changes 1000 to 500 in config.py, scripts and docs with the 'sweet spot' rationale."
            },
            {
                "type": "file",
                "label": "ring_analysis.py@66845c0",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/66845c0/scripts/ring_analysis.py",
                "note": "Computes arc sizes and per-node ownership for 150, 500, 1000 vnodes."
            },
            {
                "type": "file",
                "label": ".env.example",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/HEAD/backend/.env.example",
                "note": "VIRTUAL_NODES=500."
            },
            {
                "type": "commit",
                "label": "05af6b4",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/05af6b4",
                "note": "Sets VIRTUAL_NODES=500 in backend/.env.example (that file was not part of b116d06)."
            }
        ],
        "verification": "Ran scripts/ring_analysis.py (output: 150 -> 39.65/28.64/31.71, 500 -> 33.86/34.58/31.57, 1000 -> 33.38/32.51/34.11) and a separate sweep script over ConsistentHashRing (not committed to the repo); diffed b116d06 for the 1000 to 500 change. Attribution: Course project: the README does not say so, but docs/phase4-completion.md@66845c0 contains 'Viva Talking Points' and the phase briefs 3.md, 4.md and 5.md (committed, then deleted in the next phase) are written as instructions to a student ('most students will completely mess up'), so the work followed a written brief. All 15 commits are by Ujjwaljain16, none has a Co-Authored-By trailer, and 14 of 15 fall on one day (2026-06-10, 00:23 to 21:22 +05:30; the last is 2026-06-22)."
    },
    {
        "id": "typeaheadx-hot-shard-reproduction",
        "kind": "investigation",
        "project": "TypeAheadX",
        "title": "Why one Redis node took about 60% of hits although keys were split evenly",
        "date": "2026-06-10",
        "dateSource": "docs added in commit 05af6b4; my offline reproduction 2026-09-28",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "Is the 60% share of redis-a in the 100,000-request benchmark a defect in the ring, or a result of the Zipfian workload?",
        "method": "Recreated the workload of scripts/final_benchmark.py offline: 10,000 items (10 named queries such as 'iphone 16', then query_item_10 to query_item_9999), ranks from numpy.random.zipf(a=1.3) clipped to 10,000, 100,000 requests, mapped to nodes through ConsistentHashRing(500) using the cache key 'suggestion:<query>' (the service lower-cases and trims the prefix, which does not change these keys). Five seeds. Counted the owner of every item and of the top ten. This assumes every request is a hit on its owning node, which the live metrics count only for hits. The reproduction script is not in the repository.",
        "result": "The ring balances keys but not traffic. The 10,000 keys split 3,361 (redis-a), 3,477 (redis-b) and 3,162 (redis-c), about 33.6% / 34.8% / 31.6%. The three most popular items ('iphone 16', 'chatgpt', 'samsung galaxy s24') all hash to redis-a; rank 1 alone is 25.2 to 25.7% of requests and rank 2 is 10.2 to 10.5%. Simulated request share of redis-a over five seeds: 59.77% to 59.98%. The repo reports 60.30 / 20.99 / 18.71 (docs/performance-report.md) and 60.58 / 20.82 / 18.60 (README.md, docs/unexpected-findings.md) for the same finding, and the README calls the workload 'real traffic', although the hot query names are synthetic and defined in final_benchmark.py. The proposed fix (an in-process L1 cache or hot-key replication) is not implemented: nothing like it exists in backend/app.",
        "measured": true,
        "numbers": [
            {
                "label": "Unique keys per node (10,000 items)",
                "value": "3,361 / 3,477 / 3,162",
                "source": "offline reproduction script (ring is deterministic; script not in the repo)"
            },
            {
                "label": "Simulated request share of redis-a, 5 seeds",
                "value": "59.77% to 59.98%",
                "source": "offline reproduction script (not in the repo)"
            },
            {
                "label": "Live share reported in docs",
                "value": "60.30% / 20.99% / 18.71%",
                "source": "docs/performance-report.md"
            },
            {
                "label": "Other live share in docs",
                "value": "60.58% / 20.82% / 18.60%",
                "source": "README.md; docs/unexpected-findings.md"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "05af6b4",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/05af6b4",
                "note": "Adds docs/performance-report.md and docs/unexpected-findings.md with the finding."
            },
            {
                "type": "file",
                "label": "final_benchmark.py",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/HEAD/scripts/final_benchmark.py",
                "note": "generate_queries defines the synthetic workload and top-10 names."
            },
            {
                "type": "commit",
                "label": "66845c0",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/66845c0",
                "note": "The ring whose placement produces the skew."
            }
        ],
        "verification": "Ran my offline reproduction (hot.py) five seeds; read final_benchmark.py, performance-report.md, unexpected-findings.md; grepped backend/app for LRU/L1. The full stack (Redis x3, Postgres, API) was not started. Attribution: Course project: the README does not say so, but docs/phase4-completion.md@66845c0 contains 'Viva Talking Points' and the phase briefs 3.md, 4.md and 5.md (committed, then deleted in the next phase) are written as instructions to a student ('most students will completely mess up'), so the work followed a written brief. All 15 commits are by Ujjwaljain16, none has a Co-Authored-By trailer, and 14 of 15 fall on one day (2026-06-10, 00:23 to 21:22 +05:30; the last is 2026-06-22).",
        "context": "This is a course project. The ring spreads keys evenly across three Redis nodes, yet one node served about 60% of cache hits in the repo's 100,000-request benchmark."
    },
    {
        "id": "typeaheadx-redis-cache-latency-phase3",
        "kind": "investigation",
        "project": "TypeAheadX",
        "title": "Redis cache-aside cut database reads but did not change latency in a local test",
        "date": "2026-06-10",
        "dateSource": "doc first committed in 0c36797 (later deleted in 05af6b4)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "Does adding a Redis cache in front of the PostgreSQL prefix query reduce request latency?",
        "method": "Per docs/phase3-performance-comparison.md: 1,000 sequential requests from scripts/cache_benchmark.py, 90% drawn from 5 fixed 'hot' prefixes and 10% from 7 fixed 'cold' prefixes, so only 12 distinct cache keys. The 'no cache' column is not a paired run: it is the phase-1 baseline (docs/phase1-performance-baseline.md), measured earlier with scripts/benchmark.py, which sent 1,000 requests for the single prefix 'iph'. Read from history; not re-run because it needs Postgres and Redis with the 150,000-row dataset.",
        "result": "Recorded: p50 about 7.5 ms without the cache and about 7.1 ms with it; p95 about 10.0 ms and about 12.2 ms; database reads 1000 per 1k requests (one per request, by construction) versus 13; hit rate 98.7%. Each figure is one run, so the latency differences cannot be told from noise, and with only 12 distinct keys about 13 misses per 1,000 is expected of any cache. The doc attributes the flat latency to an unloaded local PostgreSQL holding the data in RAM (asserted, not measured). The 100,000-request run in docs/performance-report.md (a different workload) reports warm-cache p50 420.01 ms, p99 790.03 ms and cold p50 175.00 ms, p99 401.88 ms. README.md line 15 still says 'a sub-millisecond autocomplete experience', which no recorded end-to-end number supports. The projected 'about 5 ms' warm p50 on Kubernetes is not measured.",
        "measured": true,
        "numbers": [
            {
                "label": "p50 without / with Redis",
                "value": "about 7.5 ms / about 7.1 ms",
                "source": "docs/phase3-performance-comparison.md@0c36797 (baseline column is the earlier phase-1 run, single prefix)"
            },
            {
                "label": "p95 without / with Redis",
                "value": "about 10.0 ms / about 12.2 ms",
                "source": "same; single run"
            },
            {
                "label": "Database reads per 1,000 requests without / with Redis",
                "value": "1000 / 13",
                "source": "same; the workload has 12 distinct prefixes, and 1000 is one read per request by construction"
            },
            {
                "label": "Phase-1 baseline p50 / p95 / p99 (single prefix 'iph')",
                "value": "7.48 / 9.95 / 11.86 ms",
                "source": "docs/phase1-performance-baseline.md (deleted in 05af6b4); scripts/benchmark.py@8fe2206"
            },
            {
                "label": "100k-request warm cache p50 / p99, throughput (different workload)",
                "value": "420.01 ms / 790.03 ms, 197.17 RPS",
                "source": "docs/performance-report.md@HEAD"
            },
            {
                "label": "100k-request cold cache p50 / p99 (different workload)",
                "value": "175.00 ms / 401.88 ms",
                "source": "docs/performance-report.md@HEAD"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "0c36797",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/0c36797",
                "note": "Adds docs/phase3-performance-comparison.md and the Redis cache."
            },
            {
                "type": "commit",
                "label": "05af6b4",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/05af6b4",
                "note": "Deletes the per-phase docs and adds docs/performance-report.md with the 100k-request numbers."
            },
            {
                "type": "file",
                "label": "performance-report.md",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/HEAD/docs/performance-report.md",
                "note": "Warm p50 420.01 ms and p99 790.03 ms; cold p50 175 ms."
            },
            {
                "type": "file",
                "label": "README.md",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/HEAD/README.md",
                "note": "Line 15: 'A sub-millisecond autocomplete experience'."
            },
            {
                "type": "file",
                "label": "phase3-performance-comparison.md@0c36797",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/0c36797/docs/phase3-performance-comparison.md",
                "note": "The table this record quotes; the file is deleted at HEAD."
            },
            {
                "type": "benchmark",
                "label": "cache_benchmark.py@0c36797",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/0c36797/scripts/cache_benchmark.py",
                "note": "Workload: 5 hot and 7 cold fixed prefixes, 90/10 split, 1,000 sequential requests."
            },
            {
                "type": "benchmark",
                "label": "benchmark.py@8fe2206",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/8fe2206/scripts/benchmark.py",
                "note": "Phase-1 baseline script: 1,000 requests for the single prefix 'iph'."
            }
        ],
        "verification": "Read the phase-3 and phase-1 docs via git show, performance-report.md and README.md. Not re-run (needs the full stack). Attribution: Course project: the README does not say so, but docs/phase4-completion.md@66845c0 contains 'Viva Talking Points' and the phase briefs 3.md, 4.md and 5.md (committed, then deleted in the next phase) are written as instructions to a student ('most students will completely mess up'), so the work followed a written brief. All 15 commits are by Ujjwaljain16, none has a Co-Authored-By trailer, and 14 of 15 fall on one day (2026-06-10, 00:23 to 21:22 +05:30; the last is 2026-06-22).",
        "context": "This is a course project. The phase-3 measurement was taken on 2026-06-10, on one developer machine, shortly after the Redis cache was added."
    },
    {
        "id": "lexis-cycle-repair-regression",
        "kind": "investigation",
        "project": "Lexis AI",
        "projectId": "lexis-ai",
        "title": "Swapping DFS for Kahn's algorithm broke cycle repair on 2 of 4 test graphs",
        "date": "2026-06-09",
        "dateSource": "commit 6dee148",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "team repository (4 contributors); the code under test is by Ujjwaljain16 (git blame attributes all lines of graph_validator.py and graph_repair.py to this account); the check described below was run during a later review on 2026-09-28",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "Does GraphRepair.repair_cycles still remove cycles when fed the output of the new Kahn-based GraphValidator, as it did with the old DFS validator?",
        "method": "Loaded graph_validator.py and graph_repair.py from 6dee148^ (DFS version) and from the current main branch (Kahn version) and ran the same four hand-made graphs through GraphValidator.validate, GraphRepair.repair_cycles and validate again on the remaining edges: a pure 3-cycle A->B->C->A, the same cycle with the concepts listed in another order, the cycle plus an upstream node (R->A) and a downstream node (C->D), and two disjoint cycles (A,B,C and X,Y). All edges are PREREQUISITE edges with a confidence value. The check script is not part of the repository.",
        "result": "The DFS version left no cycle in all 4 graphs; the Kahn version left a cycle in 2 of 4. For A->B->C->A with a downstream node D, the Kahn validator reports the residual node set [A, B, C, D]. repair_cycles treats a reported cycle as a path (its comment describes a DFS path such as [A, B, C, A]) and builds edges from consecutive entries, so it selects C->D, deletes that valid edge and the cycle remains. With two disjoint cycles the validator reports all five nodes as one cycle and repair removes only X->Y, leaving A, B, C cyclic. The two passing cases contain only the cycle itself, where list order happens to match path order. The orchestrator publishes without re-validating and no test covers cycle repair, so the regression would go unnoticed. The graphs are hand-made; graphs produced by the LLM were not tested.",
        "measured": true,
        "numbers": [
            {
                "label": "Old DFS validator + repair: graphs left cyclic after repair",
                "value": "0 of 4",
                "source": "Same four graphs run against graph_validator.py and graph_repair.py from 6dee148^"
            },
            {
                "label": "Kahn validator + repair (current main): graphs left cyclic after repair",
                "value": "2 of 4 (cycle with downstream node; two disjoint cycles)",
                "source": "Same four graphs run against the files on main"
            },
            {
                "label": "Kahn output for cycle A,B,C plus downstream D",
                "value": "[['A','B','C','D']]; edge removed: C->D",
                "source": "Same run"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "commit",
                "label": "6dee148",
                "href": "https://github.com/Ujjwaljain16/GenAI-34/commit/6dee148",
                "note": "The switch to Kahn's algorithm with graph_repair.py unchanged (git diff --stat shows no change to graph_repair.py)."
            },
            {
                "type": "file",
                "label": "graph_validator.py@6dee148",
                "href": "https://github.com/Ujjwaljain16/GenAI-34/blob/6dee148/backend/app/services/graph_validator.py",
                "note": "detect_cycles returns [cycle_nodes]: all nodes whose in-degree stays above 0 after Kahn's pass, in concept-list order, including nodes downstream of the cycle."
            },
            {
                "type": "file",
                "label": "graph_repair.py@6dee148",
                "href": "https://github.com/Ujjwaljain16/GenAI-34/blob/6dee148/backend/app/services/graph_repair.py",
                "note": "Builds cycle edges from consecutive entries and the closing edge."
            }
        ],
        "verification": "Re-ran the check on files taken from 6dee148^ and from main; outputs match the numbers above. Read ingestion_orchestrator.py (validate, repair once, publish) and tests/test_golden_book.py (assertions commented out)."
    },
    {
        "id": "nevupai-revenge-flag-validation",
        "kind": "investigation",
        "project": "NevUpAI",
        "title": "The '100% revenge-flag accuracy' check compares seeded labels with themselves",
        "date": "2026-04-27",
        "dateSource": "scripts/validate_metrics.ts added in 62f45dd; claim in DECISIONS.md/README from 7e5eace",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "hackathon (single author)",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "DECISIONS.md says the revenge flag algorithm identified all 10 revenge-flagged trades in the seed dataset (100%). Does the worker's rule reproduce those labels?",
        "method": "Read seeds/seed.ts and scripts/validate_metrics.ts: the seed inserts revenge_flag from the dataset label (revengeFlag === \"true\") and does not call computeRevengeFlag; validate_metrics reads that stored column back and compares it with the same dataset label. Then transcribed the predicate of computeRevengeFlag in src/worker/metrics.ts (a trade whose emotionalState is anxious or fearful and whose entry falls within 90 s after the exit of one of the same user's losing trades) into a short Python script and ran it over nevup_seed_dataset.json (388 trades, 10 labelled revenge). The script is not part of the repository.",
        "result": "The 10/10 figure cannot fail: it compares the seeded revenge_flag column with the dataset labels it was loaded from, and the worker's rule is never applied. The same script's main() also prints the '8/10' pathology match and the Avery Chen and Jordan Lee lines as fixed strings (validatePathologyDetection is defined but never called). Applying the worker's SQL rule to the 388 seeded trades gives 0 true positives, 14 false positives, 10 false negatives and 364 true negatives. All 10 labelled trades follow a losing trade and have an anxious or fearful state, but each starts 60 or 120 s after that trade's entry, while it is still open (it exits 300 to 12,600 s later), so the rule's condition of an entry within 90 s after a loss exit never holds. The Python transcription was not run against Postgres.",
        "measured": true,
        "numbers": [
            {
                "label": "Trades / labelled revenge in seed",
                "value": "388 / 10",
                "source": "nevup_seed_dataset.json"
            },
            {
                "label": "Worker rule vs seed labels: TP / FP / FN / TN",
                "value": "0 / 14 / 10 / 364",
                "source": "Python transcription of computeRevengeFlag run over nevup_seed_dataset.json (not published)"
            },
            {
                "label": "Gap from labelled trade entry to previous trade entry",
                "value": "60 or 120 seconds for all 10",
                "source": "Same script over the seed"
            },
            {
                "label": "Pathology match rate printed by validate_metrics.ts",
                "value": "'8/10' (hard-coded string; validatePathologyDetection never called)",
                "source": "nevup-backend/scripts/validate_metrics.ts@3d3b274"
            },
            {
                "label": "Claim",
                "value": "'Revenge flag accuracy: 100% (all 10 revenge-flagged trades in the seed correctly identified)'",
                "source": "nevup-backend/DECISIONS.md"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "commit",
                "label": "7420567",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/commit/7420567",
                "note": "Adds computeRevengeFlag with the 90 s exit-to-entry rule and the anxious/fearful gate."
            },
            {
                "type": "commit",
                "label": "62f45dd",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/commit/62f45dd",
                "note": "Adds scripts/validate_metrics.ts."
            },
            {
                "type": "file",
                "label": "seed.ts@3d3b274",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/blob/3d3b274/nevup-backend/seeds/seed.ts",
                "note": "Inserts revenge_flag from row.revengeFlag; SEED_METRICS block never calls computeRevengeFlag."
            },
            {
                "type": "file",
                "label": "validate_metrics.ts@3d3b274",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/blob/3d3b274/nevup-backend/scripts/validate_metrics.ts",
                "note": "Compares DB revenge_flag with trade.revengeFlag from the same dataset."
            }
        ],
        "verification": "Read seed.ts, validate_metrics.ts, metrics.ts, worker/index.ts (reconciliation also skips revenge flags); ran the Python check (output: trades 388 labelled 10 TP 0 FP 14 FN 10 TN 364)."
    },
    {
        "id": "gitissue-week45-eval-audit",
        "kind": "investigation",
        "project": "GitIssue",
        "projectId": "gitissue",
        "title": "Week 4.5 eval: 1 auto-labelled true positive and a corrupted final_score column",
        "date": "2026-03-18",
        "dateSource": "commit 8eda41b (scripts/week45_evaluate.py and reports/week45_report_small.json); bug introduced in 34031e1 (2026-03-17)",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal (single author)",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "question": "What does scripts/week45_evaluate.py report on the sampled real-repo data, and is it evidence that the duplicate suggester meets its precision/recall targets?",
        "method": "Read week45_evaluate.py (precision = TP/(TP+FP) over labelled suggestions; recall = known duplicates that have any suggestion row; PR curve at thresholds 0.50 to 0.95), reports/week45_report_small.json and reports/week45_label_samples_small.csv (20 rows). Recomputed each CSV row's expected final score with the committed formula 0.5*semantic + 0.2*keyword + 0.2*structural + 0.1*label and compared it with the stored final_score. Read app/feedback/logger.py.",
        "result": "The report (generated 2026-03-17) has 20 labelled suggestions: 1 true positive, 0 false positives, 1 related-not-duplicate and 18 cant_tell, all with labeled_by 'bootstrap-auto', an automated step whose script is not in the repository. Precision 100% is 1 of 1. Recall 66.67% counts 2 of 3 known duplicates that have any suggestion row, at any score; the curve shows recall and F1 of 0 at all ten thresholds, so the recommended threshold 0.5 is only the first entry. Separately, 19 of 20 stored final_score values equal label_score: the ON CONFLICT update in logger.py sets final_score = $7, which is label_score (final_score is $8), so re-scoring a pair overwrites it. The one row that matches the formula is the only one with source signal strength below the 0.3 gate, so it was scored once. The true positive stores 1.0 but the formula gives 0.399, below the 0.85 comment threshold. The report cannot support a precision or recall claim.",
        "measured": true,
        "numbers": [
            {
                "label": "Labelled suggestions (TP / FP / related / cant_tell)",
                "value": "20 (1 / 0 / 1 / 18)",
                "source": "reports/week45_report_small.json"
            },
            {
                "label": "Labels produced by 'bootstrap-auto'",
                "value": "20 of 20",
                "source": "reports/week45_label_samples_small.csv (labeled_by column)"
            },
            {
                "label": "Precision / recall reported",
                "value": "100.0% (1/1) / 66.67% (2/3 known duplicates)",
                "source": "reports/week45_report_small.json"
            },
            {
                "label": "PR curve recall and F1 at thresholds 0.50 to 0.95",
                "value": "0.0 / 0.0 at all 10 thresholds",
                "source": "reports/week45_report_small.json"
            },
            {
                "label": "Rows where final_score == label_score",
                "value": "19 of 20",
                "source": "Python comparison over the CSV"
            },
            {
                "label": "Rows where final_score == 0.5*sem+0.2*kw+0.2*st+0.1*label",
                "value": "1 of 20 (id 940, the only row with source signal strength 0.0)",
                "source": "Same comparison"
            },
            {
                "label": "TP row 2966: stored vs formula final score",
                "value": "1.0 stored; 0.3992 by formula",
                "source": "Same comparison"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "commit",
                "label": "8eda41b",
                "href": "https://github.com/Ujjwaljain16/GitIssue/commit/8eda41b",
                "note": "Adds the evaluation scripts and the 'small' report and label sample."
            },
            {
                "type": "commit",
                "label": "34031e1",
                "href": "https://github.com/Ujjwaljain16/GitIssue/commit/34031e1",
                "note": "Introduces `final_score = $7` in the ON CONFLICT clause of log_suggestion (git blame of line 91 at 8eda41b); the line is still present on main."
            },
            {
                "type": "file",
                "label": "logger.py@8eda41b",
                "href": "https://github.com/Ujjwaljain16/GitIssue/blob/8eda41b/app/feedback/logger.py",
                "note": "INSERT parameter order: $7 label_score, $8 final_score; UPDATE uses $7 for final_score."
            },
            {
                "type": "file",
                "label": "week45_label_samples_small.csv@8eda41b",
                "href": "https://github.com/Ujjwaljain16/GitIssue/blob/8eda41b/reports/week45_label_samples_small.csv",
                "note": "labeled_by = bootstrap-auto on every row."
            },
            {
                "type": "file",
                "label": "week4.5md@8eda41b",
                "href": "https://github.com/Ujjwaljain16/GitIssue/blob/8eda41b/week4.5md",
                "note": "The plan lists 'Precision (manually verified)' as a goal; the sampled labels in the report were all produced by 'bootstrap-auto'."
            }
        ],
        "verification": "Read the script, JSON report and CSV; ran a python comparison of stored final_score, label_score and the formula for all 20 rows (19 equal label_score, 1 equals the formula). The evaluation itself could not be re-run: it needs Postgres with the collected tables. Attribution: The planning documents (week1.md, v1.md, week2.md, week4.5md) are pasted AI-assistant replies; the code and evaluation scripts are committed by Ujjwaljain16 with no Co-Authored-By trailer."
    },
    {
        "id": "sse-ticket-design-pivot",
        "kind": "decision",
        "project": "SSE-Observatory",
        "projectId": "sse-observatory",
        "title": "Proxy tickets for auth tokens were added, then abandoned by the client about 50 minutes later",
        "date": "2026-03-07",
        "dateSource": "commit c343a28 (19:13), following 3b6deed (18:22), 7578190 (19:04), 522838d (19:09)",
        "provenance": "recorded",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "Authorization tokens for the upstream SSE endpoint were passed as an ?auth= query parameter in the proxy URL (already the case in the February vite.config.ts proxy). The first Mar 7 proxy commit (3b6deed) introduced 'tickets': a client POSTs {url, token} to /api/sse/ticket and then opens /api/sse?ticket=... . The repository does not say why; the likely motive is keeping tokens out of URLs and logs, which is an inference. The app is deployed on Vercel, where an in-memory Map is not shared between function instances.",
        "decision": "3b6deed added two ticket implementations in the same commit. server.js (Express) keeps tickets in a Map with a 30 s expiry and one-time use. api/sse/_ticket.js (Vercel) encrypts {url, token, exp} with AES-256-GCM so any function instance can decrypt it. 522838d replaced the random fallback secret with VERCEL_GIT_COMMIT_SHA and then a fixed string, with the comment 'to ensure consistency across Lambdas'. 7578190 added an origin check to the ticket endpoint. At 19:13, c343a28 changed obtainSSEProxyTicket() to stop calling /api/sse/ticket and return `/api/sse?url=...&auth=...` again, with the message 'switch to direct origin-locked proxy for better production stability'. Access control moved to an Origin/Referer check, and ticket decoding was kept as 'Legacy support'.",
        "alternatives": [
            {
                "option": "Keep tokens in the query string (the February design)",
                "whyNot": "Replaced by tickets in 3b6deed and restored in c343a28. The only reason given is 'better production stability'; the repository does not say what failed."
            },
            {
                "option": "In-memory ticket Map on every deployment",
                "whyNot": "Used only in server.js. The Vercel functions use encrypted stateless tickets instead; the 522838d comment cites consistency across Lambdas, from which the lack of shared memory between instances is inferred."
            }
        ],
        "consequences": "At HEAD no client code calls the ticket endpoint: obtainSSEProxyTicket() builds a direct proxy URL, so auth tokens are again sent in the URL query string. The ticket code is still in the repository but is unused, and it was not hardened after being retired; it should be treated as dead code. Proxy access control now rests on the Origin/Referer header, which limits browsers but not non-browser clients. This is a known limitation of the design and is not fixed.",
        "status": "reverted",
        "evidence": [
            {
                "type": "commit",
                "label": "3b6deed",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/3b6deed",
                "note": "Adds tickets: a Map in server.js and AES-256-GCM in api/sse/_ticket.js (secret from PROXY_SECRET, random per-process fallback)."
            },
            {
                "type": "commit",
                "label": "522838d",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/522838d",
                "note": "Secret changed to PROXY_SECRET || VERCEL_GIT_COMMIT_SHA || fixed string, comment 'ensure consistency across Lambdas'."
            },
            {
                "type": "commit",
                "label": "c343a28",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/c343a28",
                "note": "Removes the POST /api/sse/ticket call from src/utils/sseProxyUrl.ts, adds an Origin/Referer check to api/sse/index.js and keeps ticket decoding as 'Legacy support'."
            },
            {
                "type": "file",
                "label": "server.js@0e8c14b",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/blob/0e8c14b/server.js",
                "note": "Express ticket Map and /api/sse/ticket handler still present at HEAD."
            }
        ],
        "verification": "Read the diffs of 3b6deed, 522838d, 7578190 and c343a28 and the files at HEAD; searched src/, README.md and docs/ for uses of the ticket endpoint. Reasons: the c343a28 reason is stated; the token-leak motive for introducing tickets is inferred."
    },
    {
        "id": "vitest-mergetests-from-extend-chain-to-flat-map",
        "kind": "decision",
        "project": "Vitest",
        "title": "mergeTests: from a short extend() wrapper to merging fixture registrations directly (PR still open)",
        "date": "2026-02-18",
        "dateSource": "Commit ddf97bf (2026-02-18) and the author's PR comment of 2026-02-18 announcing direct registration merging, after the maintainer's review of 2026-02-15; reworked in 60bb43a (2026-03-09); head 30ddf39 (2026-03-10). PR #9662 is still open.",
        "provenance": "reconstructed",
        "rationaleSource": "stated",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "Issue #9483 asked for a Playwright-style mergeTests to combine fixtures from several extended tests. In Vitest 4.1.0 a test built with test.extend() holds a TestFixtures object: a Map of registrations (each with scope, auto, deps and a `parent` link to the base implementation of the same-named fixture), a WeakMap of per-suite overrides used by test.override, and WeakMaps of file and worker contexts. Lookup for a suite walks up the suite chain to the nearest override. STATUS: PR #9662 is OPEN and unmerged. Maintainer sheremet-va posted seven CHANGES_REQUESTED reviews from 2026-02-15 to 2026-02-22; the contributor's last push is 2026-03-10 and no maintainer response follows.",
        "decision": "Stage 1 (d189936, 2026-02-14; also the design pitched in the issue and still in the PR body): mergeTests(a, b) = a.extend(b's resolved fixtures), about 4 statements. Stage 2 (fa60ae8, 02-16): a loop calling currentTest.extend(next.getFixtures().toUserFixtures()), with a comment that overrides on the current test are dropped. Stage 3 (ddf97bf, 02-18, after the maintainer asked for a merge on TestFixtures): the loop passes the TestFixtures itself, and TestFixtures.extend gains an `instanceof TestFixtures` branch that copies registrations. Stage 4 (60bb43a, 03-09; head 30ddf39): mergeTests builds one Map itself with last-writer-wins, throws FixtureDependencyError for a different scope or auto option, keeps built-in fixture names from the first test, runs validateFixtures on the merged Map and wraps it in new TestFixtures(map); it no longer calls extend(). Types: six fixed overloads (1 to 6 arguments) instead of a variadic signature.",
        "alternatives": [
            {
                "option": "Serialise the already-parsed registrations back to user fixtures (toUserFixtures) and replay them through .extend()",
                "whyNot": "Maintainer sheremet-va (2026-02-15): 'why do we need to convert already converted fixtures into user definitions and then convert them back again?' He proposed a merge function on TestFixtures that accepts another Fixtures and iterates the registrations, overriding them."
            },
            {
                "option": "Variadic generic signature constrained to readonly unknown[] with a structural context-extraction type via beforeEach",
                "whyNot": "The author adopted it because TestAPI<any> rejected valid inputs (TestAPI is invariant in its context parameter); the maintainer accepted internal casts if the public API is strict and suggested writing many overloads, which the head implements."
            },
            {
                "option": "Contributor's stated worry that a low-level merge would 'bypass the .extend() validation pipeline'",
                "whyNot": "The maintainer asked why, since the original extend() calls already validated each test. The head adds its own scope, auto and validateFixtures checks in mergeTests instead."
            }
        ],
        "consequences": "Not merged, so nothing shipped; the record is about how the design moved. At the head: (1) The PR description, the issue comment, the docs (\"equivalent to calling .extend() repeatedly\"), the doc comment (\"No new validation logic is introduced\") and the contributor's blog post still describe the extend() chain, but mergeTests no longer calls extend() and adds its own validation; the `instanceof TestFixtures` branch in TestFixtures.extend is unused by the rest of the diff. (2) The head copies each item with its own `parent`; extend() would link a same-named override to the earlier registration, so a fixture that calls its own base could resolve differently (read from the code, not executed). (3) The diff also adds validateFixtures calls to extend() and override(). (4) On 02-18 the maintainer called the earlier version hard to review; on 02-21 he asked why chain.ts was touched (no longer in the diff). (5) Circular dependencies are documented as not detected at merge time.",
        "status": "partial",
        "evidence": [
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662",
                "href": "https://github.com/vitest-dev/vitest/pull/9662",
                "note": "Open PR: +1869 / -15 across 10 files and 29 commits; 7 CHANGES_REQUESTED reviews by maintainer sheremet-va (2026-02-15 to 2026-02-22), none dismissed; last contributor commit 2026-03-10."
            },
            {
                "type": "issue",
                "label": "vitest-dev/vitest/issues/9483",
                "href": "https://github.com/vitest-dev/vitest/issues/9483",
                "note": "Feature request; still open; contains the contributor's 2026-02-14 description of the extend-based approach."
            },
            {
                "type": "commit",
                "label": "d189936",
                "href": "https://github.com/vitest-dev/vitest/commit/d189936",
                "note": "Stage 1: mergeTests as test.extend(testB.getFixtures().resolveFixtures()), 2026-02-14."
            },
            {
                "type": "commit",
                "label": "fa60ae8",
                "href": "https://github.com/vitest-dev/vitest/commit/fa60ae8",
                "note": "Stage 2: 'simplify mergeTests to use linear extension chain', 2026-02-16."
            },
            {
                "type": "commit",
                "label": "30ddf39",
                "href": "https://github.com/vitest-dev/vitest/commit/30ddf39",
                "note": "Head of the PR on 2026-03-10; mergeTests builds a merged Map and does not call extend()."
            },
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662#discussion_r2809025114",
                "href": "https://github.com/vitest-dev/vitest/pull/9662#discussion_r2809025114",
                "note": "Maintainer objection to the serialise-and-replay approach."
            },
            {
                "type": "file",
                "label": "fixture.ts@v4.1.0",
                "href": "https://github.com/vitest-dev/vitest/blob/v4.1.0/packages/runner/src/fixture.ts",
                "note": "TestFixtures holds a flat registrations Map (copied on extend()), an _overrides WeakMap looked up along the suite chain, and per-item `parent` links to a fixture's base implementation."
            },
            {
                "type": "commit",
                "label": "ddf97bf",
                "href": "https://github.com/vitest-dev/vitest/commit/ddf97bf",
                "note": "Stage 3, 2026-02-18: extend loop over TestFixtures objects, `instanceof TestFixtures` branch added to TestFixtures.extend."
            },
            {
                "type": "commit",
                "label": "60bb43a",
                "href": "https://github.com/vitest-dev/vitest/commit/60bb43a64c5dd67ec05b7e4f1f16d7aee4b70358",
                "note": "Stage 4, 2026-03-09: mergeTests builds the merged Map itself and adds scope/auto conflict errors."
            },
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662#pullrequestreview-3821150260",
                "href": "https://github.com/vitest-dev/vitest/pull/9662#pullrequestreview-3821150260",
                "note": "Maintainer review of 2026-02-18: the rewritten implementation is hard to review and adds parent/ancestor tracking that registrations already cover."
            }
        ],
        "verification": "Read PR 9662 metadata, all 29 commit headlines, the full current diff, issue 9483, the PR issue comments and all 23 inline review comments; fetched suite.ts at commits d189936 and fa60ae8 and read the mergeTests bodies; fetched fixture.ts at v4.1.0 and read TestFixtures, get(), override() and parseUserFixtures(); read the contributor's blog post in src/data/blogPosts.ts (slug integration-complexity). Confirmed the PR is still OPEN via gh api on 2026-09-28. Did not build the PR branch or run its tests. Attribution: On 2026-02-22 the maintainer wrote that the tests looked AI-generated (\"this AI instead just documents the wrong behaviour in the test\")."
    },
    {
        "id": "ab-zod-yaml-config-then-fail-open-fallback",
        "kind": "decision",
        "project": "AgentBrake",
        "projectId": "agentbrake",
        "title": "Zod-validated YAML policy file, then a same-day catch-all fallback that disables every policy",
        "date": "2026-02-07",
        "dateSource": "commit c8a3ea8 (20:58, the pivot); original design f98ec86 (17:32) and SUBMISSION.md in 6fee097",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "SUBMISSION.md states the reason for a config file: 'No more hardcoded env vars; policies are versionable artifacts.' The YAML plus Zod design is in the second commit of the repository (f98ec86); no environment-variable configuration for policies exists anywhere in the history, so a 'migration from env vars' is not shown by git. Before c8a3ea8 the no-file path was AgentBrakeConfigSchema.parse({}), which the schema of that moment (agent and policies required) would reject.",
        "decision": "ConfigLoader.load() reads AGENT_BRAKE_CONFIG, then agent-brake.yml/.yaml/.json in the working directory, and validates with AgentBrakeConfigSchema.parse(). c8a3ea8 wraps each attempt in try/catch that logs 'trying next...', and at the end returns a hand-written object literal (agent 'safe-fallback-agent', empty limits and security) that is not passed through the schema. The same commit makes agent, policies, limits and security optional with defaults.",
        "alternatives": [
            {
                "option": "Environment variables (the approach SUBMISSION.md says it moved away from)",
                "whyNot": "Rejected in the pitch text: not versionable. No code for it exists in the history."
            },
            {
                "option": "Before c8a3ea8: throw on invalid config and use AgentBrakeConfigSchema.parse({}) when no file exists",
                "whyNot": "The commit's own comment says the hard-coded default is 'to avoid Zod initialization errors'."
            }
        ],
        "consequences": "Fail-fast became fail-open. If the configuration file fails validation for any reason, the loader logs 'Failed to load config ... using safe defaults' and the proxy starts with no configured policies (BrakeProxy then applies only a default MaxToolCallsPolicy(10)), so calls that a valid configuration would block are forwarded. This was fixed in 373adcd (Sep 2026): an invalid or missing config now makes the proxy exit with an error unless AGENT_BRAKE_ALLOW_INVALID_CONFIG=1 is set, unknown keys are rejected, and denied_tools is enforced. Once the schema defaults were added, the catch-all was no longer needed to avoid the initialization error. The schema also accepts keys that nothing reads: denied_tools, global.on_violation, global.max_retries, budget.warn_threshold (the README sample sets 0.8, BudgetPolicy hard-codes 80 %), budget.currency, and agent.trust_level (logged only).",
        "status": "partial",
        "evidence": [
            {
                "type": "commit",
                "label": "f98ec86",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/f98ec86",
                "note": "Zod schema with YAML loader announced in the second commit (loader.ts blob is empty in this commit; content arrives in 933ba0e)."
            },
            {
                "type": "commit",
                "label": "c8a3ea8",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/c8a3ea8",
                "note": "Adds try/catch, 'trying next...' and the hard-coded fallback returned without schema.parse."
            },
            {
                "type": "commit",
                "label": "6fee097",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/6fee097",
                "note": "SUBMISSION.md: 'No more hardcoded env vars'."
            },
            {
                "type": "file",
                "label": "loader.ts@0fc99c8",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/blob/0fc99c8/src/config/loader.ts",
                "note": "Fallback literal after the loop."
            }
        ],
        "verification": "Read schema.ts and loader.ts across f98ec86, 933ba0e, f8835db, c8a3ea8 and HEAD; ran the proxy with a config containing one wrong type and checked the startup log and behaviour; grep for uses of the unused keys."
    },
    {
        "id": "ab-circuit-breaker-and-approval-not-driveable",
        "kind": "decision",
        "project": "AgentBrake",
        "projectId": "agentbrake",
        "title": "Circuit breaker and human approval shipped as policies with no signal path to drive them",
        "date": "2026-02-07",
        "dateSource": "commit ada809d (18:30); notifier in f98705f; intended flow in 8136b6f",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "ROADMAP_V3.md (removed from the repository later the same day in 03de458) describes 'Interactive Sudo Mode': the policy 'pauses the request', returns an approval signal, and 'Human approves -> Request resumes'. The README lists 'Circuit Breaker: auto-cut connection if tools fail repeatedly' and 'Human-in-the-Loop: pause execution for approval via Slack/Webhook'. ada809d added both policies in one commit, together with tests/policies.test.ts (17 tests; the circuit-breaker tests call recordFailure() directly).",
        "decision": "CircuitBreakerPolicy exposes recordFailure/recordSuccess and blocks a tool while its circuit is open. ApprovalPolicy stores a pending key (tool name + JSON arguments), returns action request_approval the first time, block ('Awaiting approval') on repeats, and exposes approve()/deny(). The proxy answers request_approval with an immediate JSON-RPC error -32001 (status 'pending') instead of holding the request. f98705f adds a WebhookNotifier with Slack buttons linking to `${approvalUrl}?action=approve|deny`. Both policies are constructed in src/proxy/index.ts.",
        "alternatives": [
            {
                "option": "Hold the request open until a human answers (the roadmap flow)",
                "whyNot": "Not implemented; the code returns an error at once. No document says why."
            }
        ],
        "consequences": "Running the built proxy: six consecutive calls to a tool that always fails all reached the server (error -32603) with a breaker threshold of 3; none was short-circuited, because recordFailure() is called only from tests/policies.test.ts. For approval, a require_approval tool got -32001 on the first call and -32000 'Awaiting approval' on every retry. Nothing calls approve() or deny(), WebhookNotifier is never imported, and no server handles the approvalUrl links, so such tools stay blocked (fail-closed) and the advertised approval workflow does not exist. The README still lists both features. Later change (373adcd, Sep 2026): the proxy now parses server responses and reports real tool errors to the breaker, so it can trip. Approvals were not built; the README and code now say they are not implemented.",
        "status": "partial",
        "evidence": [
            {
                "type": "commit",
                "label": "ada809d",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/ada809d",
                "note": "Adds both policies, the -32001 response and tests that call recordFailure() directly."
            },
            {
                "type": "commit",
                "label": "f98705f",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/f98705f",
                "note": "Adds src/notifications/webhook.ts (174 lines), never imported."
            },
            {
                "type": "commit",
                "label": "8136b6f",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/8136b6f",
                "note": "Roadmap flow 'Human approves -> Request resumes'."
            },
            {
                "type": "file",
                "label": "CircuitBreakerPolicy.ts@0fc99c8",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/blob/0fc99c8/src/policy/policies/CircuitBreakerPolicy.ts",
                "note": "recordFailure has no caller under src/ or examples/."
            }
        ],
        "verification": "grep for recordFailure, recordSuccess, .approve(, .deny(, WebhookNotifier across src, examples and tests; ran harness4.mjs against the built proxy."
    },
    {
        "id": "campus-ocr-tesseract-to-gemini-vision",
        "kind": "decision",
        "project": "CampusSync",
        "projectId": "campussync",
        "title": "Certificate OCR moved from Tesseract plus regex to one Gemini Vision call, no fallback",
        "date": "2025-10-15",
        "dateSource": "commits 9f5427a (2025-10-14, browser stops running Tesseract) and 980ef09 (2025-10-15, server Tesseract route deleted, ocr-gemini route first tracked)",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "The first API route (fa6484b, 2025-09-11) ran Tesseract.js on the uploaded file and returned the raw text; a comment says 'Naive extraction heuristics' but the code applies none. On 2025-09-23 (3c573ae) the author added Gemini 2.0 Flash to structure the OCR text, with a rule-based extractor (ocrExtract.ts) as the fallback, and also ran Tesseract in the browser on the upload page. The same commit adds a workaround comment for Tesseract worker paths breaking under the Next.js bundler.",
        "decision": "The upload page now posts the file to /api/certificates/ocr-gemini. That route stores the file in Supabase Storage, sends the raw bytes as base64 inline data to gemini-2.0-flash-exp with a JSON-only prompt, and throws if no JSON object can be parsed. The old ocr/route.ts (Tesseract, PDF-to-image conversion, regex merge) is deleted in 980ef09. The page change is in 9f5427a, whose message covers only a delete-confirmation modal; that commit points at a route that is not yet in its tree, and the route is first committed in 980ef09. No commit message gives a reason for the switch. The nearest statement is SIMPLE-CERTIFICATE-GUIDE.md (added in 980ef09): the system was simplified 'to avoid all the complex OCR dependencies that were causing errors' (Jimp, Tesseract.js). That guide describes a different, text-only design that the shipped route does not implement, so the reason is inferred.",
        "alternatives": [
            {
                "option": "Tesseract text (browser and server) then Gemini text structuring with regex fallback (the 3c573ae design)",
                "whyNot": "Removed in 9f5427a and 980ef09. The only reason in the repo is the dependency-error sentence in SIMPLE-CERTIFICATE-GUIDE.md; no accuracy comparison between the two approaches was found in the history."
            },
            {
                "option": "pdf-parse text extraction plus a text-only LLM (described in SIMPLE-CERTIFICATE-GUIDE.md)",
                "whyNot": "Documented but not implemented: the 980ef09 tree has no page for it, and the ocr-gemini route sends the image or PDF bytes straight to Gemini."
            }
        ],
        "consequences": "One external dependency is now on the critical path: a missing Gemini key or an unparseable reply gives a 500 with no fallback. The fallback code (src/lib/ocr/llmExtractor.ts with fallbackExtraction, and src/lib/ocrExtract.ts, 615 lines) is used by nothing else at HEAD: only llmExtractor imports ocrExtract, and no file imports llmExtractor. A missing GEMINI_API_KEY is a critical failure in runtimeEnvCheck.ts, so in production the middleware returns 503 for every non-API page. tesseract.js ^6.0.1 is still in package.json and the README still advertises a 'Dual OCR Pipeline: Tesseract.js (local) + Google Gemini'. The route hardcodes gemini-2.0-flash-exp and ignores GEMINI_MODEL; a comment in envValidator.ts says that variable defaults to gemini-2.5-flash, but its getter defaults to gemini-2.0-flash-exp.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "9f5427a",
                "href": "https://github.com/Ujjwaljain16/CampusSync/commit/9f5427a",
                "note": "removes 'import Tesseract' and the browser OCR block from student/upload/page.tsx; page now calls /api/certificates/ocr-gemini, which does not exist in this commit's tree (commit message is about a delete modal)"
            },
            {
                "type": "commit",
                "label": "980ef09",
                "href": "https://github.com/Ujjwaljain16/CampusSync/commit/980ef09",
                "note": "deletes my-app/src/app/api/certificates/ocr/route.ts (Tesseract) and adds ocr-gemini/route.ts and SIMPLE-CERTIFICATE-GUIDE.md"
            },
            {
                "type": "commit",
                "label": "3c573ae",
                "href": "https://github.com/Ujjwaljain16/CampusSync/commit/3c573ae",
                "note": "the earlier design: Gemini structuring with rule-based fallback plus client-side Tesseract"
            },
            {
                "type": "file",
                "label": "route.ts",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/HEAD/my-app/src/app/api/certificates/ocr-gemini/route.ts",
                "note": "no fallback path; throws on unparseable response"
            },
            {
                "type": "file",
                "label": "README.md",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/HEAD/README.md",
                "note": "still claims Tesseract.js in the pipeline"
            },
            {
                "type": "file",
                "label": "SIMPLE-CERTIFICATE-GUIDE.md@980ef09",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/980ef09/my-app/SIMPLE-CERTIFICATE-GUIDE.md",
                "note": "source of the 'complex OCR dependencies that were causing errors' sentence; describes a text-only design that was not built"
            }
        ],
        "verification": "git log -S'tesseract' and git show per commit filtered for tesseract lines; read ocr-gemini/route.ts and llmExtractor.ts in full; git grep for importers of LLMExtractor and ocrExtract at HEAD (none outside each other); git show 980ef09:my-app/SIMPLE-CERTIFICATE-GUIDE.md. Attribution: All cited commits are authored by Ujjwaljain16 and carry no Co-Authored-By trailer. The 980ef09 message ('Quality: 5.75/10 -> 9.8/10') and the guide read as AI-assisted output; this cannot be proven from the repo, so disclose generally rather than per commit."
    },
    {
        "id": "campus-rls-user-roles-recursion",
        "kind": "decision",
        "project": "CampusSync",
        "projectId": "campussync",
        "title": "user_roles row-level security: self-referencing policies replaced by a SECURITY DEFINER function",
        "date": "2025-09-23",
        "dateSource": "commit 3c573ae (adds 002_fix_user_roles_policies_v2.sql and 003_fix_recursion_completely.sql); earlier steps in d15304d and d0175ff, both 2025-09-12",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": true,
        "context": "The role table (user_roles) needed two rules: a user reads their own row, and admins read and write every row. The first committed version of 001_create_user_roles.sql (1591252, 2025-09-12 01:43) checked admin status with a subquery on user_roles inside each policy on user_roles. POLICY-RECURSION-FIX.md (added in 3c573ae) describes the resulting Postgres error, 'infinite recursion detected in policy', and its cause: the policy queries the table that the policy protects. The next commit, 19 minutes later (d15304d), is titled as a fix for RLS policy recursion.",
        "decision": "Final approach in the committed SQL (002_fix_user_roles_policies_v2.sql and 003_fix_recursion_completely.sql, both added in 3c573ae): an is_admin() function declared LANGUAGE plpgsql SECURITY DEFINER, so it reads user_roles without re-entering the policies, used by four admin policies (select, insert, update, delete) plus a 'users read own role' policy. POLICY-RECURSION-FIX.md states the reason: the function bypasses the policies and so breaks the recursion. Before that the table went through four other states: subquery policies (001 as first committed), JWT-claim policies (001 rewritten in d15304d), a second subquery form (002 v1), and RLS switched off (003_disable_rls_temporarily and 007_disable_user_roles_rls). The 007 file states its reasons for switching RLS off: the admin client must read roles without RLS, the policies caused infinite recursion, and role management is handled at the application level.",
        "alternatives": [
            {
                "option": "Subquery on user_roles inside each admin policy (EXISTS in 001 as first committed in 1591252; IN subquery in 002_fix_user_roles_policies.sql, d15304d)",
                "whyNot": "Both select from user_roles inside a user_roles policy, the pattern POLICY-RECURSION-FIX.md names as the cause of the recursion error. The IN form was replaced eleven days later by the is_admin() version; the repo does not record whether it was run or how it failed."
            },
            {
                "option": "Admin check via the JWT role claim: auth.jwt() ->> 'role' = 'admin' (001 rewritten in place in d15304d)",
                "whyNot": "The comment says it was used 'to avoid recursion', but 002 v1 in the same commit went back to a subquery. The repo does not say why the claim approach was dropped; it is not stated that the claim never matched."
            },
            {
                "option": "Disable RLS on user_roles and enforce roles in application code with the service-role client (003_disable_rls_temporarily, 007_disable_user_roles_rls)",
                "whyNot": "Labelled temporary in 003_disable ('In production, you should re-enable RLS'). 007 (d0175ff, 2025-09-12) turns it off again with an application-level rationale; 002 v2 and 003_fix (3c573ae, 2025-09-23) re-enable it. The d0175ff commit message says role reads and writes go through the admin client."
            }
        ],
        "consequences": "Five policy names recur in every version; only the admin check changed. The setup docs tell the reader to paste the migration files into the Supabase SQL editor and the repo has no migration runner, so it cannot say which state was live: 007 (disable) sorts after 002 and 003_fix (enable) by filename. None of this SQL remains at HEAD: 003 and 007 were deleted on 2025-10-24 (3e030b5) and 001, 002, 002 v2 and 008 on 2025-11-07 (4561505), so the recursion history exists only in git. 28 API route files at HEAD still create the service-role client, which bypasses RLS.",
        "status": "partial",
        "evidence": [
            {
                "type": "commit",
                "label": "d0175ff",
                "href": "https://github.com/Ujjwaljain16/CampusSync/commit/d0175ff",
                "note": "2025-09-12: adds 007_disable_user_roles_rls.sql with the three-reason comment, and 008_create_get_user_role_function.sql (SECURITY DEFINER)"
            },
            {
                "type": "commit",
                "label": "3c573ae",
                "href": "https://github.com/Ujjwaljain16/CampusSync/commit/3c573ae",
                "note": "2025-09-23: adds 002_fix_user_roles_policies_v2.sql and 003_fix_recursion_completely.sql which re-enable RLS behind is_admin() SECURITY DEFINER (commit message is about OCR; the SQL is bundled into it)"
            },
            {
                "type": "file",
                "label": "001_create_user_roles.sql@1591252",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/1591252/my-app/supabase-migrations/001_create_user_roles.sql",
                "note": "first version: one own-row policy and four admin policies that each run an EXISTS subquery on user_roles itself"
            },
            {
                "type": "file",
                "label": "003_disable_rls_temporarily.sql@d15304d",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/d15304d/my-app/supabase-migrations/003_disable_rls_temporarily.sql",
                "note": "'Temporarily disable RLS to fix the recursion issue'"
            },
            {
                "type": "commit",
                "label": "3e030b5",
                "href": "https://github.com/Ujjwaljain16/CampusSync/commit/3e030b5",
                "note": "2025-10-24: removes 003, 007, 013, 020, 029 from the repo as 'unnecessary mitigation/fix scripts'"
            },
            {
                "type": "file",
                "label": "001_create_user_roles.sql@d15304d",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/d15304d/my-app/supabase-migrations/001_create_user_roles.sql",
                "note": "001 rewritten 19 minutes later to use auth.jwt() ->> 'role', with the comment 'to avoid recursion'"
            },
            {
                "type": "file",
                "label": "POLICY-RECURSION-FIX.md@3c573ae",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/3c573ae/my-app/POLICY-RECURSION-FIX.md",
                "note": "author's own explanation of the recursion and of the SECURITY DEFINER fix"
            },
            {
                "type": "file",
                "label": "002_fix_user_roles_policies_v2.sql@3c573ae",
                "href": "https://github.com/Ujjwaljain16/CampusSync/blob/3c573ae/my-app/supabase-migrations/002_fix_user_roles_policies_v2.sql",
                "note": "is_admin() as LANGUAGE plpgsql SECURITY DEFINER used by four admin policies"
            },
            {
                "type": "commit",
                "label": "4561505",
                "href": "https://github.com/Ujjwaljain16/CampusSync/commit/4561505",
                "note": "2025-11-07: removes 001, 002 v1, 002 v2 and 008 ('old migrations'); no user_roles SQL remains at HEAD"
            }
        ],
        "verification": "Ran git log --all --diff-filter=A per file to date each migration; git show <sha>:path to read 001, 002 v1, 002 v2, 003 (both), 007, 008; counted CREATE POLICY per file with grep -ic; git grep -l createSupabaseAdminClient HEAD -- src/app/api gives 28 files. Attribution: All cited commits are authored by Ujjwaljain16 with no Co-Authored-By trailer. POLICY-RECURSION-FIX.md and the d15304d message read as AI-assisted; this cannot be proven from the repo."
    },
    {
        "id": "bhttp-truncation-must-not-look-complete",
        "kind": "decision",
        "project": "BHTTP-1",
        "projectId": "bhttp-1",
        "title": "A file that shrinks mid-transfer ends in ERROR(3), never a clean END_STREAM",
        "date": "2026-09-22",
        "dateSource": "commit 6218eda (fault-injection test); 362fc0a (server)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The RESPONSE announces content-length before the body streams. If the file changes size afterwards, the client has already been told a length. All 41 commits in the public repository are timestamped within 74 minutes (2026-09-22 00:10 to 01:24 +05:30); the server is in 362fc0a (00:10) and the test in 6218eda (00:26), so the history does not show the design evolving over time.",
        "decision": "The server opens the file, takes the size from the open handle, and announces that in content-length. If the read comes up short after the RESPONSE is out, the server sends ERROR(3) on stream 0 and closes instead of ending the stream. An empty body ends on the RESPONSE frame itself, and a body that is an exact multiple of 16384 ends on its last full DATA frame; a trailing empty DATA frame is never sent.",
        "alternatives": [
            {
                "option": "Stat the file by name, then read it later",
                "whyNot": "docs/ARCHITECTURE.md: the announced length and the bytes sent could then come from different files if the file is replaced in between."
            },
            {
                "option": "End an empty body with an empty DATA frame carrying END_STREAM",
                "whyNot": "docs/ARCHITECTURE.md: one rule with no exceptions is easier to implement correctly than 'send an empty frame unless...'. SPEC 5.7 therefore ends an empty body on the RESPONSE and forbids a trailing empty DATA frame. This concerns framing rather than truncation and could be dropped."
            }
        ],
        "consequences": "TestFileThatShrinksMidTransferEndsWithAnErrorNotASilentTruncation creates a 48 MiB file, holds the client back so the server blocks mid-file, truncates it to zero, and asserts an ERROR frame with code PROTOCOL_ERROR (3) on stream 0, no END_STREAM on any DATA frame, and a closed connection. TestFileSizesAreFramedCorrectly covers sizes including 0, 1, 16383, 16384, 16385, 32768 and 1 MiB. The conformance fixture includes edge-16383, edge-16384 and edge-16385 files.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "6218eda",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/commit/6218eda",
                "note": "Adds fault_test.go with the shrink-mid-transfer test and the 500 (cannot open) test."
            },
            {
                "type": "commit",
                "label": "362fc0a",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/commit/362fc0a",
                "note": "Server streams DATA frames from the open file handle."
            },
            {
                "type": "test",
                "label": "fault_test.go::TestFileThatShrinksMidTransferEndsWithAnErrorNotASilentTruncation",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/blob/HEAD/internal/server/fault_test.go",
                "note": "Real fault injection with a 48 MiB file."
            },
            {
                "type": "file",
                "label": "SPEC.md@fe7c745",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/blob/fe7c745/protocol/SPEC.md",
                "note": "Section 5.7 (empty vs non-empty body) and 11.4 (ERROR(3) after RESPONSE)."
            },
            {
                "type": "file",
                "label": "ARCHITECTURE.md@fe7c745",
                "href": "https://github.com/Ujjwaljain16/BHTTP-1-HTTP-in-Binary/blob/fe7c745/docs/ARCHITECTURE.md",
                "note": "Lines 68 and 90: ERROR rather than a clean end of stream after the RESPONSE; size taken from the open file."
            }
        ],
        "verification": "Read fault_test.go, SPEC.md 5.7 and 11.4, docs/ARCHITECTURE.md; go test -count=1 ./internal/server passes. Attribution: All 41 commits are authored by Ujjwaljain16 and none carries a Co-Authored-By trailer. Whether the specification and docs were AI-assisted cannot be determined from the repository; the owner should confirm before publishing."
    },
    {
        "id": "superset-async-cache-key-hash-normalisation-closed",
        "kind": "investigation",
        "project": "Apache Superset",
        "title": "Why a cache-key normalisation PR was closed: the mismatch came from an in-place mutation",
        "date": "2026-09-12",
        "dateSource": "PR #38227 closed by its author (the fix had landed in PR #40993, merged 2026-06-16)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "Can hashing ad-hoc SQL in `QueryObject.cache_key()` after normalising line endings and whitespace make the web-server and Celery keys agree, and is that where the mismatch arises?",
        "method": "The author (Ujjwaljain16) made `cache_key()` deep-copy `to_dict()`, convert CRLF to LF and strip whitespace in ad-hoc SQL for metrics, columns and orderby, with 9 unit tests; `series_limit_metric` was added after a Copilot review comment. A user, kwilt, then tried it on a real deployment, logged the sqlExpression from the web process and from Celery for one chart and diffed them: they differed by a transpilation (cast(...) vs ::numeric, `not x is null` vs `x is not null`), not only whitespace. Separately, bobjo-daangn traced the write/read asymmetry in PR #40993: `get_sqla_query()` wrote the processed (Jinja-rendered, sqlglot-normalised) ORDER BY expression back into a dict shared with `QueryObject.orderby` and the cached QueryContext, so the worker computed the key from the raw expression but cached a mutated context, and the later GET recomputed a different key.",
        "result": "The hashing-layer PR fixed only part of the cases: kwilt reported it fixed some of the 422 errors but not all, and #40993 states that a hashing-layer normalisation such as #38227 cannot fix the Jinja-rendering divergence because the rendered SQL is already baked into the cached context. #40993 changed `col = cast(AdhocMetric, col)` to `col = cast(AdhocMetric, dict(col))` in superset/models/helpers.py so a copy is processed; it was merged on 2026-06-16 and closes #37114. On 2026-09-12 the author closed #38227 with the comment that the issue was resolved by #40993. The author had earlier (2026-06-08) called the transpilation divergence a different cause and asked maintainer villebro whether to extend the PR; the thread records no maintainer answer and the PR received no human approval.",
        "measured": true,
        "numbers": [
            {
                "label": "Tests in the closed PR",
                "value": "9 new unit test functions in tests/unit_tests/queries/query_object_test.py at the final head (Copilot's 2026-03-04 summary of an earlier commit counted 8)",
                "source": "gh pr diff 38227 --repo apache/superset"
            },
            {
                "label": "Size of the closed PR",
                "value": "+166/-2 lines, 2 files",
                "source": "gh pr view 38227 --json additions,deletions,changedFiles"
            },
            {
                "label": "Production change in the fixing PR #40993",
                "value": "one statement replaced in superset/models/helpers.py (a dict(col) copy; +4/-1 lines with a comment), plus 114 added test lines",
                "source": "gh pr view 40993 --json files"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "pr",
                "label": "apache/superset/pull/38227",
                "href": "https://github.com/apache/superset/pull/38227",
                "note": "Closed PR, kwilt's divergence diff of 2026-06-08 and the author's closing comment of 2026-09-12."
            },
            {
                "type": "pr",
                "label": "apache/superset/pull/40993",
                "href": "https://github.com/apache/superset/pull/40993",
                "note": "Root-cause fix by bobjo-daangn; merged 2026-06-16, merge commit 257dafeec51a62c6bac9d648b7c284020b1fe718 (`fix(query): don't mutate ad-hoc ORDER BY expressions when building queries`)."
            },
            {
                "type": "issue",
                "label": "apache/superset/issues/37114",
                "href": "https://github.com/apache/superset/issues/37114",
                "note": "Reports with cache-key dumps showing `\\r\\n` vs `\\n` and Jinja-rendered vs raw expressions; the author's proposal comment of 2026-02-24."
            },
            {
                "type": "test",
                "label": "helpers_test.py (PR #40993)",
                "href": "https://github.com/apache/superset/pull/40993/files",
                "note": "#40993 adds `test_get_sqla_query_does_not_mutate_adhoc_orderby`, a Jinja variant, and `test_cache_key_stable_across_query_build`, which asserts QueryObject.cache_key() is unchanged by building the query."
            }
        ],
        "verification": "Read PR #38227 body, comments, reviews and inline comments; issue #37114; PR #40993 body, diff and merge metadata via gh. Did not clone the repository or run tests. The record describes what the author's PR attempted and the project's later root-cause fix; it does not claim the author found the mutation. Attribution: #40993 (the fix) was written and merged by others (bobjo-daangn; approved by rusackas and betodealmeida, merged by betodealmeida, merge commit 257dafe on 2026-06-16)."
    },
    {
        "id": "retract-overclaims-in-place-with-claim-ledger",
        "kind": "decision",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "Correct overstated research claims in place, citing the result files that contradict them",
        "date": "2026-09-07",
        "dateSource": "commit bbaecb1 (flagship claim); related fixes b2d9d30, d31d7c9, f367ca8, b90c1d4",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "After Stage 16 the README, the Stage 16 write-up and the landing page summarized the research. An audit of the earlier stages found statements that the committed result files did not support. The commit messages call it an independent audit; a related commit (9e24add) describes it as 12 parallel agents, so it was an AI-agent review, and the author made the corrections.",
        "decision": "Fix each claim where it appeared and narrow it to what the data supports. For the two ledger-tracked claims (C20, C24) also record the correction in Stage16-ClaimLedger.md, citing the result file, rather than deleting the row. Documents that already scoped the claim correctly were left untouched.",
        "alternatives": [
            {
                "option": "Leave the summary wording as published",
                "whyNot": "016-flagship-results.json contradicts 'Adaptive worst P99 in every seed': in seed 16000 EWMA (4399.88 ms) is worse than Adaptive (4072.11 ms). This is the status quo rather than an option the repo discusses."
            },
            {
                "option": "Rename 'predictor' throughout Stage 15 and 16 documents",
                "whyNot": "b2d9d30 judged this disproportionate: there the word is used in a rank-agreement sense; only the summary claims implying live use were changed."
            }
        ],
        "consequences": "(1) Per-seed P99 in 016-flagship-results.json: seed 16000 EWMA 4399.88 ms > Adaptive 4072.11; 16001 Adaptive 4732.39 vs EWMA 4717.98; 16002 Adaptive 4853.07 vs EWMA 4725.03, so Adaptive was worst of six in 2 of 3 seeds (recomputed from the JSON). (2) FindPeakEpisodeCongestionOnset needs the run's whole future, so committed backlog is a post hoc statistic, not a live predictor; a code comment now says so. (3) Stage 11's 'Adaptive wins 0/27' counted only sole wins, and round-robin's credit in tied configs came from an unstable sort.Slice; 'EWMA 85-99% in every heterogeneous config' was 57-99% (4 of 18 configs at 57-58%). (4) A claim that Stage 8's sampling rarely produces the severe, no-failure corner was measured at about 6.9%; a test with a 2-15% band guards it. (5) Stage 14's 'FALSIFIER FOUND' pre-dated its dedicated test, since 014A already held the reversal. Ledger claim C24 ('Adaptive is safe') is marked RETIRED.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "bbaecb1",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/bbaecb1",
                "note": "Corrects the flagship P99 claim with per-seed numbers from the JSON."
            },
            {
                "type": "commit",
                "label": "b2d9d30",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/b2d9d30",
                "note": "Adds the retrospective-statistic caveat to the code and docs."
            },
            {
                "type": "commit",
                "label": "d31d7c9",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/d31d7c9",
                "note": "Discloses that the Stage 14 falsifier data pre-existed its dedicated experiment."
            },
            {
                "type": "commit",
                "label": "f367ca8",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/f367ca8",
                "note": "Corrects two Stage 11 statistics and persists Stage 14 CIs."
            },
            {
                "type": "commit",
                "label": "b90c1d4",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/b90c1d4",
                "note": "Measures the scenario-rarity claim and adds a guarding test."
            },
            {
                "type": "file",
                "label": "016-flagship-results.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/016-final-synthesis/results/016-flagship-results.json",
                "note": "Source data for the per-seed P99 comparison."
            },
            {
                "type": "doc",
                "label": "Stage16-ClaimLedger.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage16-ClaimLedger.md",
                "note": "C20 and C24 rows record the corrections."
            },
            {
                "type": "file",
                "label": "backlog.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/backlog/backlog.go",
                "note": "Doc comment on FindPeakEpisodeCongestionOnset stating it is retrospective."
            }
        ],
        "verification": "Recomputed the per-seed P99 ranking from the flagship result JSON and compared it with the commit message. Read the README as it stood before bbaecb1 (line 199 holds the false sentence), the other four commit messages and the C20/C24 ledger rows, and confirmed the rarity test exists and the package tests pass. The 57-99% range and the 6.9% rate were not recomputed. The cited commits are authored by Ujjwaljain16 and respond to an AI-agent audit; the original overclaims were also the author's."
    },
    {
        "id": "committed-backlog-threshold-and-hindsight",
        "kind": "investigation",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "Committed backlog out-ranked peak load on severity, but its value moved about tenfold with one threshold",
        "date": "2026-09-07",
        "dateSource": "commit 5cea6ef (threshold finding); generalization test in 2edd061; caveat in b2d9d30",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "Stage 15 proposed 'committed backlog' as the measure that explains collapse severity. Does it rank scenarios better than peak rho, and how sensitive is it to its own settings and to when it can be computed?",
        "method": "(1) cmd/experiment-015e ranks 4 topologies (N=3/5/8 graduated and an N=8 bimodal) and 3 workloads (constant, burst, flash crowd), with EWMA as the policy throughout, by mean latency and compares that ranking with rankings by peak rho and by committed backlog. (2) While building the multi-seed flagship, a fixed diversion-share threshold of 0.5 was found to fit 3-target topologies (fair share 1/3) but not 5 targets (fair share 1/5), and was scaled to 1.5/N (commit 5cea6ef). (3) For this record the flagship was re-run in a clone with the threshold forced back to 0.5. (4) A code audit (b2d9d30) found that the onset detector anchors to the episode holding the peak depth, which requires that episode's future.",
        "result": "Across topology size, committed backlog matched the severity ranking exactly (rank distance 0, n=4) while peak rho was misordered (distance 4; rho fell from 0.915 to 0.716 as N grew while EWMA mean latency rose from 93.78 to 307.32 ms). Across workload shape it was better but imperfect (distance 2 vs 4, n=3). Stage15.md notes these are small deterministic tests, not seeded replications. The value depends strongly on the diversion-share threshold: at 0.5 Adaptive's committed backlog in the three flagship seeds is 10/9/10, at 1.5/N = 0.30 it is 107/127/93, while EWMA's is unchanged (98/104/95). Stage 15's Adaptive figure of 86 used 0.5 with no arrival jitter, while the jittered flagship at the same threshold gives about 10. Stage15.md states that no full threshold-sensitivity sweep was run. The measure is also retrospective: it cannot be computed live, and README and the ledger were corrected to say so. An earlier first-episode-only version reported EWMA's backlog as 1 instead of 97 (commit dc74b6c).",
        "measured": true,
        "numbers": [
            {
                "label": "Cross-topology rank distance from severity: committed backlog vs peak rho",
                "value": "0 vs 4 (n=4, EWMA only)",
                "source": "go run ./cmd/experiment-015e; identical to committed 015E JSON"
            },
            {
                "label": "Cross-workload rank distance: committed backlog vs peak rho",
                "value": "2 vs 4 (n=3, EWMA only)",
                "source": "go run ./cmd/experiment-015e"
            },
            {
                "label": "Peak rho for N=3/5/8 graduated",
                "value": "0.915 / 0.833 / 0.716",
                "source": "same"
            },
            {
                "label": "EWMA mean latency for N=3/5/8 graduated (ms)",
                "value": "93.78 / 201.81 / 307.32",
                "source": "same"
            },
            {
                "label": "Adaptive committed backlog, flagship seeds, threshold 0.30 (recorded)",
                "value": "107 / 127 / 93",
                "source": "go run ./cmd/experiment-016-flagship, identical to committed file"
            },
            {
                "label": "Adaptive committed backlog, flagship seeds, threshold forced to 0.5",
                "value": "10 / 9 / 10",
                "source": "re-run in a clone with 'var diversionShareThreshold = 0.5' in cmd/experiment-016-flagship/main.go (edit reverted afterwards)"
            },
            {
                "label": "EWMA committed backlog at 0.5 and at 0.30",
                "value": "98 / 104 / 95 at both",
                "source": "same two runs"
            },
            {
                "label": "Adaptive backlog in 015a (threshold 0.5, no jitter)",
                "value": "86",
                "source": "go run ./cmd/experiment-015a"
            }
        ],
        "verdict": "inconclusive",
        "evidence": [
            {
                "type": "commit",
                "label": "2edd061",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/2edd061",
                "note": "Adds the cross-topology and cross-workload rank test (distance 0 vs 4, and 2 vs 4)."
            },
            {
                "type": "commit",
                "label": "5cea6ef",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/5cea6ef",
                "note": "Commit message documents the 0.5 threshold problem (Adaptive backlog 9-10 vs 93-127) and the fix to 1.5/N."
            },
            {
                "type": "commit",
                "label": "b2d9d30",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/b2d9d30",
                "note": "Adds the retrospective-only caveat to FindPeakEpisodeCongestionOnset, README and the ledger."
            },
            {
                "type": "commit",
                "label": "dc74b6c",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/dc74b6c",
                "note": "First-episode onset gave EWMA backlog 1 vs 97; fixed and covered by a two-episode test."
            },
            {
                "type": "test",
                "label": "TestFindPeakEpisodeCongestionOnset_MultipleEpisodes (backlog_test.go@14da821)",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/backlog/backlog_test.go#L235",
                "note": "Hand-computed two-episode case showing the first-episode and peak-episode onset finders disagree; passes in a clone (go test ./internal/backlog)."
            },
            {
                "type": "file",
                "label": "main.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/cmd/experiment-016-flagship/main.go",
                "note": "Header comment explains the threshold scaling and the 9-10 vs 93-127 observation."
            },
            {
                "type": "file",
                "label": "Stage15.md@14da821 (Limitations 1 and 5)",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage15.md",
                "note": "States that no full threshold-sensitivity sweep was run and that the severity-ranking claim rests on a 4-point deterministic test."
            }
        ],
        "verification": "Re-ran experiments 015e, 015a and the flagship in a clone at HEAD (results identical to the committed files apart from timestamps). Set the flagship threshold constant to 0.5 in the clone, ran it and discarded the change. Ran the internal/backlog tests (all pass) and read the b2d9d30 diff. The retrospective-only caveat comes from a commit whose message credits an independent from-scratch audit, which was an AI-agent pass, not a human review."
    },
    {
        "id": "load-blind-vs-load-aware-falsified",
        "kind": "investigation",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "'Load-aware beats load-blind' was falsified at 8 targets: EWMA lost to round-robin in 10 of 10 seeds",
        "date": "2026-09-07",
        "dateSource": "commit e497b79 (falsifier), 121b60a (rho test), 99031e2 (10-seed test), d31d7c9 (disclosure)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "Stage 13 concluded that the deepest regime boundary was load-blind vs load-aware routing, and that a rho of about 0.89-0.97 marks the collapse transition. Do both claims hold as the number of targets grows from 3 to 8?",
        "method": "cmd/experiment-014c scaled requests at N=3/5/8 to aim at EWMA's max-target rho of about 0.9. cmd/experiment-014f ran all six policies at N=8 below, near and above the capacity boundary (150/381/600 requests), labelled by signal source rather than name. cmd/experiment-014i repeated the near-boundary point over 10 seeds (14700-14709, jitter 0.3) with Cliff's Delta and bootstrap CIs.",
        "result": "The rho claim was narrowed and the load-aware claim was falsified as general statements. EWMA's achieved rho fell as N grew (0.915, 0.833, 0.716) while its mean latency rose (93.78, 201.81, 307.32 ms), so rho became necessary but insufficient. At N=8 EWMA, a policy with a live latency signal, was worse than load-blind round-robin near the boundary (307.32 vs 170.48 ms) and above it (589.39 vs 376.80 ms), but better below it (39.43 vs 66.69 ms). Least-connections and Adaptive stayed at 27.98 and 29.88 ms near the boundary, so the failure is specific to EWMA rather than to load-aware policies as a class. Over 10 seeds round-robin beat EWMA every time (Cliff's Delta 1.000, CI on the difference [119.49, 134.11] ms). A later audit found the discovery was less blind than described: experiment 014a, run about 20 minutes earlier (JSON timestamps 19:13:13Z and 19:34:45Z), already showed round-robin at 88.81 ms vs EWMA at 137.03 ms at N=8 (about 290 requests), so 014f may have been shaped by that data; Stage14.md now says so. Ledger rows C17 and C19 are RETIRED.",
        "measured": true,
        "numbers": [
            {
                "label": "EWMA achieved rho, N=3/5/8",
                "value": "0.915 / 0.833 / 0.716",
                "source": "go run ./cmd/experiment-014c"
            },
            {
                "label": "EWMA mean latency, N=3/5/8 (ms)",
                "value": "93.78 / 201.81 / 307.32",
                "source": "go run ./cmd/experiment-014c"
            },
            {
                "label": "N=8 near boundary: RR / EWMA / LC / Adaptive (ms)",
                "value": "170.48 / 307.32 / 27.98 / 29.88",
                "source": "go run ./cmd/experiment-014f"
            },
            {
                "label": "N=8 above boundary: RR / EWMA (ms)",
                "value": "376.80 / 589.39",
                "source": "go run ./cmd/experiment-014f"
            },
            {
                "label": "N=8 below boundary: EWMA / RR (ms)",
                "value": "39.43 / 66.69 (EWMA better)",
                "source": "go run ./cmd/experiment-014f"
            },
            {
                "label": "10-seed test, RR faster than EWMA",
                "value": "10/10; Cliff's Delta 1.000; 95% CI [119.49, 134.11] ms",
                "source": "go run ./cmd/experiment-014i (identical on re-run)"
            },
            {
                "label": "10-seed test, Adaptive faster than EWMA",
                "value": "10/10; Delta 1.000; 95% CI [260.21, 274.88] ms",
                "source": "go run ./cmd/experiment-014i (identical on re-run)"
            },
            {
                "label": "Earlier data point in 014A (N=8, Capacity=1, about 290 requests)",
                "value": "RR 88.80867 ms, EWMA 137.02514 ms",
                "source": "experiments/014-scale-topology/results/014A-multi-target-capacity-boundary.json (timestamp 2026-09-06T19:13:13Z; 014F 19:34:45Z)"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "commit",
                "label": "e497b79",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/e497b79",
                "note": "Full six-policy sweep; message labels the EWMA-worse-than-RR result a first-class negative result."
            },
            {
                "type": "commit",
                "label": "121b60a",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/121b60a",
                "note": "Cross-scale rho test: rho falls while severity rises."
            },
            {
                "type": "commit",
                "label": "99031e2",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/99031e2",
                "note": "10-seed confirmation with CIs."
            },
            {
                "type": "commit",
                "label": "d31d7c9",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/d31d7c9",
                "note": "Discloses that 014a already held the round-robin vs EWMA reversal 20 minutes earlier."
            },
            {
                "type": "file",
                "label": "014I-statistical-confirmation.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/014-scale-topology/results/014I-statistical-confirmation.json",
                "note": "Persisted per-seed values and CIs (persisted in commit f367ca8)."
            },
            {
                "type": "file",
                "label": "Stage16-ClaimLedger.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage16-ClaimLedger.md",
                "note": "C17 and C19 marked RETIRED with their replacing evidence."
            }
        ],
        "verification": "Read the four commit messages and the Stage14.md 014f section. Re-ran experiments 014c, 014f and 014i in a clone at HEAD; every quoted value matched the committed JSON and docs (one unquoted P2C wait-share field in 014F differed slightly between runs). Loaded the 014A JSON and found the two cited means. The disclosure commit d31d7c9 credits an independent audit, which was an AI-agent pass; the disclosure text in Stage14.md is audit-generated, though committed by the author."
    },
    {
        "id": "contention-model-reverses-ewma-win",
        "kind": "decision",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "Add a minimal FIFO capacity model to the simulator after its flat model rewarded overload",
        "date": "2026-09-06",
        "dateSource": "commit bfec932 (model); finding in commit 9175a3f; robustness in 81a2817",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "Stage 11's policy map showed EWMA beating Adaptive on mean latency under heterogeneity (15.90 ms vs 27.38 ms). Stage 11's own analysis said this was an artifact: RunWorld gave each target a fixed service time with no queueing, so sending 97.3% of requests to one target (utilization 1.09) cost nothing. The real engine was used as a cross-check because it has genuine concurrency.",
        "decision": "Add TargetProfile.Capacity, where 0 or less means infinite (the old behavior, byte-for-byte), and otherwise per-target busy/queue state with deterministic FIFO waiting so CompletionRecord.Latency includes wait time. Add time-varying service time in the same commit. Then re-run the flagship comparison across Capacity 0/1/2/3.",
        "alternatives": [
            {
                "option": "Accept the flat-model ranking as evidence that EWMA routes better",
                "whyNot": "Stage11.md says taking it at face value would be an overclaim the model cannot support."
            },
            {
                "option": "Build a general stochastic queueing or network simulator",
                "whyNot": "Stage12.md: the stage 'was never a license to build a general-purpose network simulator'; the commit says it is deterministic discrete-event queueing, not an M/M/c simulation."
            },
            {
                "option": "Use the real HTTP engine to study contention instead",
                "whyNot": "No reason is stated in the repo for not doing so. Related facts: Stage12.md section 12 notes RealEngine never reads Capacity, so real and modelled contention are not like-for-like, and cmd/experiment-011f describes a real run as about 4 s of wall-clock."
            }
        ],
        "consequences": "The ranking flips only at one capacity: Capacity 0 EWMA 15.90 vs Adaptive 27.38 ms (EWMA wins); Capacity 1 EWMA 131.06 vs 27.93 ms (Adaptive wins); Capacity 2 16.36 vs 27.38 and Capacity 3 16.04 vs 27.38 (EWMA wins). 012-E: Adaptive faster in 12 of 12 traffic seeds, Cliff's delta 1.000, bootstrap CI on the mean gap [88.67, 107.58] ms. A re-run of 012-A and 012-E reproduced all of these (012-E point estimate 98.13 ms). The repo therefore reports that Adaptive's advantage exists only near the stability boundary, not across realistic capacities; a later commit (97285cd) also narrowed a related rho=1 claim to one scenario. Seven hand-computed contention tests were added, and the existing tests passed unchanged.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "bfec932",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/bfec932",
                "note": "Adds Capacity and ServiceTimeSchedule with backward-compatible zero values and the 7+5 tests."
            },
            {
                "type": "commit",
                "label": "9175a3f",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/9175a3f",
                "note": "Re-runs Program A under contention (012-A)."
            },
            {
                "type": "commit",
                "label": "81a2817",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/81a2817",
                "note": "12-seed robustness check (012-E)."
            },
            {
                "type": "doc",
                "label": "Stage11.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage11.md",
                "note": "Section 7 explains why the flat-model win is an artifact and states the falsifier."
            },
            {
                "type": "doc",
                "label": "Stage12.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage12.md",
                "note": "Model changes and before/after table."
            },
            {
                "type": "test",
                "label": "contention_test.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/replay/contention_test.go",
                "note": "Hand-derived 1-slot and 2-slot latency tests and scale-invariance test."
            },
            {
                "type": "file",
                "label": "012A-program-a-under-contention.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/012-model-fidelity/results/012A-program-a-under-contention.json",
                "note": "Recorded capacity sweep numbers."
            },
            {
                "type": "file",
                "label": "012E-contention-reversal-robustness.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/012-model-fidelity/results/012E-contention-reversal-robustness.json",
                "note": "Recorded 12-seed result."
            }
        ],
        "verification": "Read the queue logic in world.go and the Capacity documentation in scenario.go, and compared the 012A JSON with the Stage12.md table. Re-ran experiments 012a and 012e in a clone (identical means; CI [88.67, 107.58]) and ran the internal/replay tests, which pass. The cited commits (bfec932, 9175a3f, 81a2817) are authored by Ujjwaljain16 and were not the product of an audit agent."
    },
    {
        "id": "real-engine-shares-proxy-trackers",
        "kind": "decision",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "Feed real-engine policies from the proxy's own load and latency trackers",
        "date": "2026-09-06",
        "dateSource": "commit b51eac0 (final fix); defect found in 052b894",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "Stage 11 compared virtual and real engines on the same policies. In the real engine, EWMA and Adaptive sent 100% of 300 requests to one target, and the target changed between fresh processes. The repo's stated goal was that the same policy code runs correctly in both engines.",
        "decision": "Construct the ReverseProxy first with a nil selector, build the selector using the proxy's own LoadTracker() and LatencyTracker() through a new Trackers parameter on PolicySpec.New (zero value means build fresh, so the virtual engine is untouched), then attach it with SetSelector. Remove the earlier post-hoc bridge.",
        "alternatives": [
            {
                "option": "Read the X-Selected-Edge response header after each request and feed latency back to the selector's own tracker (the Stage 11 fix in 052b894)",
                "whyNot": "Fixed latency only; calling OnDispatch/OnComplete back-to-back after the response would net to zero and never show real in-flight load. It was removed because it would double-count."
            },
            {
                "option": "Treat the disagreement as a modeling-fidelity gap and document it",
                "whyNot": "Stage 11 shows it was a wiring bug: policy.New's Instrumentation return value was discarded, so the selector read trackers nothing updated."
            }
        ],
        "consequences": "The defect was diagnosed from run-to-run variation in which target was locked and from an ablation: giving every request a unique key (removing cache affinity) still produced max_share 1.000. After the fix, the recorded 011-F shows max_share EWMA 0.973 real vs 0.973 virtual and Adaptive 0.500 vs 0.503. A re-run reproduced EWMA (0.973 in both engines, lowest p50 in both) and Adaptive's max_share (0.503), but real Adaptive's p50 was 30.2 ms against 15 ms virtual (the recorded file has 16.5 ms), so p50 agreement for Adaptive depends on timing. Stage11.md states that every earlier RealEngine result for load- or latency-aware policies reflected cold-start tie-breaking, not the intended logic. Two regression tests were added (EWMA prefers the fast real target; least-connections avoids the busy target) and pass.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "052b894",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/052b894",
                "note": "Finds the discarded-Instrumentation bug, runs the unique-key ablation, applies the partial header-based fix."
            },
            {
                "type": "commit",
                "label": "b51eac0",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/b51eac0",
                "note": "Replaces the bridge with shared trackers and removes it."
            },
            {
                "type": "file",
                "label": "real.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/engine/real.go",
                "note": "HEAD builds the proxy first and passes pxy.LoadTracker()/LatencyTracker() into policy.New, then calls SetSelector."
            },
            {
                "type": "test",
                "label": "real_test.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/engine/real_test.go",
                "note": "TestRealEngine_Run_EWMAPrefersFastRealTarget and TestRealEngine_Run_LeastConnectionsAvoidsBusyRealTarget."
            },
            {
                "type": "file",
                "label": "011F-virtual-vs-real.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/011-research-validation/results/011F-virtual-vs-real.json",
                "note": "Recorded post-fix agreement numbers."
            },
            {
                "type": "doc",
                "label": "Stage11.md@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/docs/StageArtifacts/Stage11.md",
                "note": "Section 10 root cause and ablation."
            }
        ],
        "verification": "Read both commit messages, internal/engine/real.go lines 121-154 and Stage11.md section 10. Re-ran experiment 011f: maximum share and policy ranking agree between the engines, and p50 differs (a re-run gave 30.2 ms for the real engine against 15 ms virtual). Confirmed both regression tests exist and pass. The commits (052b894, b51eac0) are authored by Ujjwaljain16, and the defect was found by the author's own Program F rather than by an audit agent."
    },
    {
        "id": "virtual-time-engine-over-real-clock",
        "kind": "decision",
        "project": "FlashFlow",
        "projectId": "flashflow",
        "title": "Run policy experiments on a single-threaded virtual-time event loop, not wall-clock time",
        "date": "2026-09-05",
        "dateSource": "commit 6b0fe78 (engine); rationale in docs/learning/005-virtual-time.md first committed in 504f271",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "Through Stage 4 every experiment ran on real time and real HTTP. Stage 3's EWMA lock-in experiment gave a different traffic split on each of three real runs of identical targets, and Stage 4 needed a mock clock, a pre-reserved port and an artificial delay just to make timing repeatable. The question for Stage 5 was whether the same configuration and seed could yield the same execution history, cheaply.",
        "decision": "Add internal/vtime: a heap-ordered EventQueue keyed on (virtual timestamp, insertion sequence) and an Engine that pops the earliest event, advances a MockClock to exactly that time, runs the callback and repeats, all on one goroutine. Domain code (cache, health registry, selectors) reads time only through the injected clock.Clock, so it ran under the engine unchanged.",
        "alternatives": [
            {
                "option": "Keep using real wall-clock time and real HTTP, adding more controls (MockClock, fixed ports, widened race windows) per experiment",
                "whyNot": "Stage 5 notes call the Stage 4 concessions 'the concrete, measured cost' of staying on real time; Experiment 003-D showed goroutine scheduling alone changed the outcome between runs."
            },
            {
                "option": "Migrate all domain logic to virtual time",
                "whyNot": "An audit of every time.Now/Sleep/After/Ticker call in internal/ found the state machines were already clock-injected; only the I/O scheduling layer was wall-clock bound, so only a driving engine was needed."
            },
            {
                "option": "Model simulated concurrency with real goroutines and channels",
                "whyNot": "internal/vtime/queue.go's package comment says this would reintroduce Go scheduler nondeterminism; overlapping requests are instead overlapping start/complete event pairs."
            }
        ],
        "consequences": "Determinism was tested by repetition: Experiment 005-B ran an identical 9-event scenario 50 times with identical traces, and a re-run gave 50 of 50 identical. An engine test shows that a single event scheduled 10 virtual minutes out is processed in under 100 ms of real time. The cost was a deliberately flat service model: 005-H shows upstream request counts matching the real engine (10/30/100) while virtual p99 stays at 100.0 ms and real p99 rises from 102.9 to 115.4 ms; the real-side figures are read from stored 004-C results, not re-run by 005-H. The missing contention later made Stage 11's flat-model ranking of EWMA over Adaptive an artifact (see contention-model-reverses-ewma-win).",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "6b0fe78",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/6b0fe78",
                "note": "Adds the Engine that owns the clock and queue privately so only one loop can advance time; commit message states the determinism argument."
            },
            {
                "type": "commit",
                "label": "0e3b1a9",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/0e3b1a9",
                "note": "Adds the (timestamp, sequence) ordered EventQueue with its own test suite before the Engine used it."
            },
            {
                "type": "commit",
                "label": "6db3c89",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/commit/6db3c89",
                "note": "Adds Experiment 003-D whose three real runs are the motivating nondeterminism."
            },
            {
                "type": "file",
                "label": "003D-pure-homogeneous-lock-in-check-run1.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/003-routing-policies/results/003D-pure-homogeneous-lock-in-check-run1.json",
                "note": "Real run 1 of identical targets: edge-a share 94%."
            },
            {
                "type": "file",
                "label": "003D-pure-homogeneous-lock-in-check-run2.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/003-routing-policies/results/003D-pure-homogeneous-lock-in-check-run2.json",
                "note": "Real run 2: edge-a share 68.33%."
            },
            {
                "type": "file",
                "label": "003D-pure-homogeneous-lock-in-check-run3.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/003-routing-policies/results/003D-pure-homogeneous-lock-in-check-run3.json",
                "note": "Real run 3: edge-a share 18.17%."
            },
            {
                "type": "doc",
                "label": "005-virtual-time.md@504f271",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/504f271/docs/learning/005-virtual-time.md",
                "note": "States the reasons, the clock-injection audit, and the flat-model limitation."
            },
            {
                "type": "file",
                "label": "queue.go@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/internal/vtime/queue.go",
                "note": "Package comment explains why no real goroutines are used."
            },
            {
                "type": "file",
                "label": "005H-virtual-vs-real.json@14da821",
                "href": "https://github.com/Ujjwaljain16/FlashFlow/blob/14da821/experiments/005-virtual-time/results/005H-virtual-vs-real.json",
                "note": "Virtual vs real comparison numbers; the 'real' side is loaded from earlier 004-C result files, not re-run by 005-H."
            }
        ],
        "verification": "Read internal/vtime/queue.go, the engine commit message and docs/learning/005-virtual-time.md, and opened the three 003-D result JSONs (edge-a shares 94, 68.33 and 18.17 percent). Ran experiment 005b in a clone (all 50 runs identical) and 005h (numbers matched the recorded file, but 005-H reads the real-engine figures from stored 004-C JSON, so only the virtual half was re-executed). Package tests pass. Authored under Ujjwaljain16; the project was built with an AI coding assistant, so this early code should be treated as possibly AI-assisted (see the project page)."
    },
    {
        "id": "golden-gate-measures-what",
        "kind": "investigation",
        "project": "Fuze",
        "projectId": "fuze",
        "title": "What the CI regression gate for two-stage retrieval actually measures",
        "date": "2026-07-25",
        "dateSource": "gate committed in 1f4deb2; re-run on 2026-09-28",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "Does ADR-006 Gate 1 (test_two_stage_baseline_regression.py against golden_baseline_v1.json) show that the two-stage retrieval path is equivalent in quality to the legacy orchestrator?",
        "method": "Read the ADR, the test, the baseline generator and the baseline JSON. Ran test_golden_dataset_regression.py, test_two_stage_baseline_regression.py and test_shadow_evaluator.py (Python 3.11.9, Windows, pytest 8.4.2). Instantiated RecommendationPipeline() as the orchestrator does and called run() with a request.",
        "result": "The gate passes with a delta of exactly 0.0000 because both sides run the same class. golden_baseline_v1.json was generated by generate_golden_baseline.py, which runs SmartEngine; ADR-006 calls it the baseline of the 'validated legacy orchestrator', but SmartEngine was added in the same commit and is not one of the orchestrator's engines. The regression test replaces the data layer with a mock returning a fixed pool (the expected candidates plus 10 noise items), so CandidateRetriever, HNSW and the RPC functions are never called. The set has 4 queries; query_frontend_01 has MRR 0.5, so the average of 0.875 clears the separate 0.85 floor in test_golden_dataset_regression.py by only 0.025. The shadow pipeline built in the orchestrator has no Unit of Work and returns no candidates, so shadow overlap would be 0. The gate therefore catches changes to the scoring code, not to retrieval.",
        "measured": true,
        "numbers": [
            {
                "label": "avg MRR, baseline and pipeline",
                "value": "0.8750 and 0.8750 (delta 0.0000)",
                "source": "pytest -s tests/test_two_stage_baseline_regression.py, run 2026-09-28"
            },
            {
                "label": "avg NDCG@10, baseline and pipeline",
                "value": "0.9537 and 0.9537 (delta 0.0000)",
                "source": "same run; golden_baseline_v1.json aggregate avg_ndcg10 0.953737"
            },
            {
                "label": "per-query MRR",
                "value": "0.5, 1.0, 1.0, 1.0",
                "source": "backend/tests/golden/golden_baseline_v1.json"
            },
            {
                "label": "queries in the golden set",
                "value": "4",
                "source": "golden_baseline_v1.json aggregate.query_count"
            },
            {
                "label": "orchestrator shadow pipeline output",
                "value": "uow None, results []",
                "source": "RecommendationPipeline().run(RecommendationRequest(user_id=1, title='React hooks', technologies='React'))"
            },
            {
                "label": "tests run",
                "value": "4 passed in 50.42 s",
                "source": "pytest golden and shadow tests, 2026-09-28"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "commit",
                "label": "1f4deb2",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/1f4deb2",
                "note": "Adds the test, the baseline, the generator and the mocked data layer."
            },
            {
                "type": "test",
                "label": "test_two_stage_baseline_regression.py@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/backend/tests/test_two_stage_baseline_regression.py",
                "note": "pipeline.data_layer = mock_data_layer; asserts delta >= -0.03."
            },
            {
                "type": "file",
                "label": "generate_golden_baseline.py@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/backend/scripts/generate_golden_baseline.py",
                "note": "run_legacy_pipeline() builds SmartEngine()."
            },
            {
                "type": "doc",
                "label": "ADR-006-two-stage-retrieval-rollout-gates.md@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/docs/adr/ADR-006-two-stage-retrieval-rollout-gates.md",
                "note": "Claims the baseline comes from the legacy orchestrator."
            },
            {
                "type": "file",
                "label": "smart_engine.py@1f4deb2",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/1f4deb2/backend/ml/engines/smart_engine.py",
                "note": "New file in the same commit as the gate; the engine the baseline was generated from."
            }
        ],
        "verification": "Ran the tests and the pipeline snippet listed above on this machine (no database needed); the Redis connection error printed during the run is the test environment falling back to no Redis. Attribution: Authored by Ujjwaljain16; cited commit 1f4deb2 has no Claude co-author trailer. This record is an after-the-fact analysis written for the portfolio (provenance: reconstructed), not a decision documented in the repository."
    },
    {
        "id": "superset-native-filter-options-own-cache-timeout",
        "kind": "decision",
        "project": "Apache Superset",
        "title": "Give dynamic native-filter option queries their own opt-in cache TTL setting",
        "date": "2026-07-24",
        "dateSource": "PR #38910 merged (merge commit 3ff5dbf)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "With 'dynamically search all filter values', a native filter's option queries go through /api/v1/chart/data and therefore use the data cache timeout (issue #38219). With row-level security the dropdown kept old values until DATA_CACHE_CONFIG expired; force-refresh showed the right ones. The reporter wanted the shorter FILTER_STATE_CACHE_CONFIG timeout.",
        "decision": "The merged change adds `NATIVE_FILTER_OPTIONS_CACHE_TIMEOUT` (default None) to superset/config.py and rewrites `QueryContextProcessor.get_cache_timeout()` with an explicit priority: custom_cache_timeout, then the new setting when the request is a native filter option query, then slice/dataset/database timeout, then DATA_CACHE_CONFIG, then CACHE_DEFAULT_TIMEOUT. The request is recognised by `native_filter_id` being set and `viz_type` starting with `filter_`. Values are compared with `is not None` so a configured 0 is honoured, and the config comment says to use -1, not 0, to disable caching.",
        "alternatives": [
            {
                "option": "Use FILTER_STATE_CACHE_CONFIG['CACHE_DEFAULT_TIMEOUT'] for these queries (the PR's first version, still reflected in the PR title)",
                "whyNot": "The author's 2026-06-14 comment: these are still chart-data queries on the existing data cache, so a separate cache backend was the wrong abstraction; what is needed is an independent freshness policy."
            },
            {
                "option": "Make the new behaviour the default",
                "whyNot": "sadpandajoe asked to keep the current behaviour as default behind a config option because other code might override timeouts; the author agreed. rusackas twice noted that with default None the stale dropdown is not fixed until an operator sets it, and the author kept None for backward compatibility."
            },
            {
                "option": "Detect filter queries with `not form_data.get('metrics')`",
                "whyNot": "rusackas pointed out that nativeFilters/utils.ts sets `metrics: ['count']` for every native filter request, so the branch could never fire in production; the tests had used a synthetic payload. Detection was changed to native_filter_id plus the `filter_` viz_type prefix, and tests now use realistic payloads."
            }
        ],
        "consequences": "Operators can set a shorter TTL for filter options than for chart data, and a dataset-level timeout of, say, 24 hours no longer masks it because the new setting is checked before dataset/database timeouts. Nothing changes for existing installs until the setting is configured. The change also fixes the falsy-zero handling in the timeout chain. The author reports an end-to-end check on a real dynamic filter with the setting at 180 seconds: first search a cache miss, an immediate repeat a cache hit, and after deleting the row and waiting out the TTL a miss and rowcount 0 (PR comment of 2026-07-13; not independently re-run). Size +246/-4 lines in 3 files; opened 2026-03-27, merged 2026-07-24.",
        "status": "adopted",
        "evidence": [
            {
                "type": "pr",
                "label": "apache/superset/pull/38910",
                "href": "https://github.com/apache/superset/pull/38910",
                "note": "Thread with sadpandajoe's backward-compatibility request, rusackas's finding about `metrics: ['count']`, and the author's redesign comment; merged by rusackas; merge commit 3ff5dbfe81e68662974ac4d15f5eb2de60ad40e1."
            },
            {
                "type": "issue",
                "label": "apache/superset/issues/38219",
                "href": "https://github.com/apache/superset/issues/38219",
                "note": "'Dynamic query filters use data cache instead of filter state cache'; the author's reproduction and root-cause comment of 2026-03-27."
            },
            {
                "type": "commit",
                "label": "3ff5dbf",
                "href": "https://github.com/apache/superset/commit/3ff5dbf",
                "note": "Squash merge `fix(native-filters): use FILTER_STATE_CACHE_CONFIG timeout for dynamic filter option queries (#38910)`, 2026-07-24 (GitHub API); the subject still names the abandoned mechanism."
            },
            {
                "type": "file",
                "label": "query_context_processor.py (PR #38910)",
                "href": "https://github.com/apache/superset/pull/38910/files",
                "note": "`get_cache_timeout` docstring with the five-step precedence chain and `_is_native_filter_options_query` docstring explaining why `metrics` is not used."
            }
        ],
        "verification": "Read the PR body, all human comments, reviews and the final diff (gh pr diff 38910), the linked issue, and the merge commit metadata. The 180-second observation is the author's own comment and was not reproduced."
    },
    {
        "id": "minidb-aries-lite-no-clrs-lsn-as-wal-offset",
        "kind": "decision",
        "project": "MiniDB",
        "projectId": "minidb",
        "title": "ARIES-style recovery without CLRs, with LSN equal to the byte offset in the WAL",
        "date": "2026-06-16",
        "dateSource": "commit 7b7c4ce (first non-stub CrashRecovery.ts, LogManager.ts, CheckpointManager.ts)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The project (a course capstone) includes crash recovery for a from-scratch engine. Full ARIES writes compensation log records (CLRs) while undoing; this project uses a simpler variant.",
        "decision": "Recovery runs analysis, redo, undo. Analysis reads the last checkpoint LSN from checkpoint.meta (a fuzzy checkpoint of the active-transaction and dirty page tables, written via temp file and rename) and rebuilds both tables. Redo starts at the smallest recLSN and applies a record only if page.pageLsn < record.lsn. Undo follows each loser's prevLsn chain backwards, deleting inserted rows and restoring the before-image of deleted or updated ones, then appends an ABORT record. No CLRs are written; a code comment says they are 'intentionally' skipped and the README says 'for educational simplicity'. The LSN is the byte offset of the record in wal.log (LogManager.append), so undo can read any record by seeking to its LSN.",
        "alternatives": [
            {
                "option": "Full ARIES with compensation log records",
                "whyNot": "README section 8: not implemented 'for educational simplicity'."
            },
            {
                "option": "Scan the log from the start to collect each loser's records (mentioned in a comment in CrashRecovery.ts)",
                "whyNot": "The same comment drops the scan: because the LSN is the physical byte offset, records can be read directly by position."
            }
        ],
        "consequences": "benchmarks/crash_recovery.ts (10,000 committed inserts, 500 uncommitted deletes, crash, recover twice) ends with 10,000 rows, and three crash-matrix tests plus two CrashRecovery unit tests pass. Undo progress is not logged: pages touched by undo get pageLsn = the current log tail, and only an ABORT record marks a loser as finished. Two gaps found in the audit: (1) recovery ends by writing a checkpoint that lists no active transactions; when a copy of the benchmark crashed again right after the first recovery, before pages were flushed, the second recovery found no loser, redid the 500 deletes and ended with 9,500 rows. (2) TxnManager.abort() (commit 8622bae) has a TODO for undo and only writes ABORT and releases locks, so a runtime abort rolls nothing back: an aborted insert and delete both stayed applied, before and after restart.",
        "status": "partial",
        "evidence": [
            {
                "type": "commit",
                "label": "7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/commit/7b7c4ce",
                "note": "Adds CrashRecovery.ts (analysis/redo/undo, 'We intentionally SKIP Compensation Log Records'), LogManager.ts (LSN = byte offset), CheckpointManager.ts, and the crash tests and benchmark."
            },
            {
                "type": "commit",
                "label": "8622bae",
                "href": "https://github.com/Ujjwaljain16/MiniDB/commit/8622bae",
                "note": "TxnManager.abort contains 'TODO (Phase 6): Undo all changes' and never got the implementation; the contract in 93f9d9b says abort should undo."
            },
            {
                "type": "test",
                "label": "crash_matrix.test.ts@7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/7b7c4ce/MiniDB_Projects/Team_ARIES_Recovery/tests/integration/crash_matrix.test.ts",
                "note": "Three tests: insert after WAL flush before page flush, delete before commit, commit record flushed but no clean commit."
            },
            {
                "type": "file",
                "label": "CrashRecovery.ts@7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/7b7c4ce/MiniDB_Projects/Team_ARIES_Recovery/src/recovery/CrashRecovery.ts",
                "note": "Analysis, redo and undo passes; comment \"We intentionally SKIP Compensation Log Records (CLRs)\"; ABORT appended after undo."
            }
        ],
        "verification": "Read CrashRecovery.ts, LogManager.ts, CheckpointManager.ts, TxnManager.ts and the crash tests; ran benchmarks/crash_recovery.ts and the full suite; wrote a script (decisions/minidb_experiments/zz_exp_abort.ts) that inserts and deletes inside a transaction, calls abort(), and selects: the aborted insert stayed and the aborted delete stayed applied, before and after a restart. Attribution: All cited commits are authored by Ujjwaljain16 (git shortlog: 21 commits, one author). The README lists a two-person team, and git history cannot show which parts each person wrote, so the record should say \"commits by Ujjwaljain16; two-person course project\". No Co-Authored-By trailers exist in the history; whether AI tools were used cannot be determined from the repository. Comments in CrashRecovery.ts are written as running first-person reasoning, which is consistent with, but not proof of, AI-assisted coding."
    },
    {
        "id": "minidb-crash-recovery-benchmark-and-matrix",
        "kind": "investigation",
        "project": "MiniDB",
        "projectId": "minidb",
        "title": "Crash with 10,000 committed inserts and 500 uncommitted deletes recovers to exactly 10,000 rows",
        "date": "2026-06-16",
        "dateSource": "commit 7b7c4ce (benchmarks/crash_recovery.ts, tests/integration/crash_matrix.test.ts, CrashRecovery tests)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "After a simulated crash, does recovery keep committed data, roll back an uncommitted delete, and stay correct when run again?",
        "method": "benchmarks/crash_recovery.ts: T1 inserts 10,000 rows through HeapFile with WAL context and commits; T2 deletes 500 of them and is never committed; the WAL is flushed but the buffer pool is not, then file handles are closed (pool size 100 frames). The database is reopened (recovery runs in open()), closed, reopened again, and a sequential scan counts rows. Separately, tests/integration/crash_matrix.test.ts has three cases (insert after WAL flush before page flush, delete before commit, COMMIT record flushed before the clean commit finished) and tests/unit/recovery/CrashRecovery.test.ts has an end-to-end case and a double-recovery case. The whole jest suite was run once.",
        "result": "The benchmark printed 'Expected Rows: 10000 | Actual Rows: 10000' after two recoveries, as documented. The full suite passed: 26 suites, 133 tests. Limits: the crash is simulated by closing file handles, not by killing a process; the WAL is flushed first, so torn log writes are not tested; the table (about 50 pages) fits in the 100-frame pool, so no data page was written before the crash (0 page writes in an instrumented copy) and eviction of dirty pages is not exercised; no crash scenario has an index; a second crash right after recovery is not tested (a copy that did this ended with 9,500 rows); 'Scenario D: Recover() three times' in Architecture.md is not a test in crash_matrix.test.ts; runtime aborts are not covered.",
        "measured": true,
        "numbers": [
            {
                "label": "Rows after two recoveries (expected / actual)",
                "value": "10000 / 10000",
                "source": "npx tsx benchmarks/crash_recovery.ts"
            },
            {
                "label": "Full test suite",
                "value": "26 suites, 133 tests passed",
                "source": "npx jest --config jest.config.cjs"
            },
            {
                "label": "Data page writes before the simulated crash",
                "value": "0 (heap file about 50 pages, pool 100 frames)",
                "source": "instrumented copy of crash_recovery.ts counting DiskManager.writePage calls"
            },
            {
                "label": "Rows when the database crashes again right after the first recovery",
                "value": "9500 (expected 10000)",
                "source": "modified copy of the benchmark (crash instead of clean close after the first recovery)"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/commit/7b7c4ce",
                "note": "Adds crash_recovery.ts, crash_matrix.test.ts, full_system_recovery.test.ts, CrashRecovery.test.ts and the recovery code."
            },
            {
                "type": "test",
                "label": "crash_matrix.test.ts@7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/7b7c4ce/MiniDB_Projects/Team_ARIES_Recovery/tests/integration/crash_matrix.test.ts",
                "note": "Three crash scenarios with reopen and SELECT verification."
            },
            {
                "type": "benchmark",
                "label": "crash_recovery.ts@7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/7b7c4ce/MiniDB_Projects/Team_ARIES_Recovery/benchmarks/crash_recovery.ts",
                "note": "Scenario definition and the row-count assertion."
            }
        ],
        "verification": "Ran the benchmark and the complete jest suite; read crash_matrix.test.ts, fuzz_sql.test.ts and the benchmark source. Attribution: All cited commits are authored by Ujjwaljain16 (git shortlog: 21 commits, one author). The README lists a two-person team, and git history cannot show which parts each person wrote, so the record should say \"commits by Ujjwaljain16; two-person course project\". No Co-Authored-By trailers exist in the history; whether AI tools were used cannot be determined from the repository."
    },
    {
        "id": "minidb-wal-rule-in-buffer-pool-steal-no-force",
        "kind": "decision",
        "project": "MiniDB",
        "projectId": "minidb",
        "title": "BufferPool flushes the log up to a page's pageLSN before writing that dirty page (steal / no-force)",
        "date": "2026-06-15",
        "dateSource": "commit 8601d59 (implementation); the contract was written in commit 93f9d9b; test in commit d075f71",
        "provenance": "recorded",
        "rationaleSource": "inferred",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The interface contracts written in the first commits (93f9d9b) specify a steal / no-force buffer policy: dirty pages may be written before their transaction commits, and data pages need not be written at commit. That is only safe if the log record for a change reaches disk before the changed page does.",
        "decision": "In BufferPool, every path that writes a dirty frame (eviction in fetchPage and newPage, flushPage, flushAll) first calls logManager.flush(frame.pageLsn) and only then diskManager.writePage. The frame's pageLsn and recLsn are set through setPageLsn(), which also writes the LSN into the page header; recLsn feeds getDirtyPageTable() for checkpoints (added in 7b7c4ce). COMMIT flushes only the log, not data pages (TxnManager.commit).",
        "alternatives": [
            {
                "option": "Force data pages at commit / no-steal (the opposite policy)",
                "whyNot": "Not discussed anywhere in the repository. The IBufferPool and ILogManager contracts written in commit 93f9d9b specify the opposite: 'Undo rule (steal): log record flushed BEFORE dirty page written' and 'Redo rule (no-force): COMMIT log record flushed; data pages need not be'. No reason for choosing that policy is written down."
            }
        ],
        "consequences": "A test ('enforces WAL rule on eviction') sets pageLsn 42 on a dirty page, evicts it, and asserts the log manager was flushed to 42. The guarantee is only as good as its callers: fetchPage resets frame.pageLsn to INVALID_LSN when it loads a page, and no log flush happens for a frame whose pageLsn was never set. HeapFile logs and calls setPageLsn only when given an ExecContext. By code inspection, the B+ tree code (src/index) has no log manager or setPageLsn calls and recovery replays only INSERT/UPDATE/DELETE records with a heap RID, so index pages are outside this protocol. The crash tests never write a data page before the crash, so they do not exercise this rule.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "8601d59",
                "href": "https://github.com/Ujjwaljain16/MiniDB/commit/8601d59",
                "note": "BufferPool eviction path contains the 'WAL Rule: flush log up to victim's page LSN before evicting' comment and code."
            },
            {
                "type": "commit",
                "label": "93f9d9b",
                "href": "https://github.com/Ujjwaljain16/MiniDB/commit/93f9d9b",
                "note": "src/common/interfaces.ts states the steal / no-force WAL rules and the IBufferPool contract."
            },
            {
                "type": "test",
                "label": "BufferPool.test.ts@d075f71",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/d075f71/tests/unit/storage/BufferPool.test.ts",
                "note": "'enforces WAL rule on eviction' asserts lm.flushedLsn === 42 after a dirty page with LSN 42 is evicted."
            }
        ],
        "verification": "Read BufferPool.ts, HeapFile.ts (insertTuple/deleteTuple with ctx) and TxnManager.ts at HEAD; grep of src/index for log/setPageLsn found nothing; ran the jest suite (BufferPool tests pass). Attribution: All cited commits are authored by Ujjwaljain16 (git shortlog: 21 commits, one author). The README lists a two-person team, and git history cannot show which parts each person wrote, so the record should say \"commits by Ujjwaljain16; two-person course project\". No Co-Authored-By trailers exist in the history; whether AI tools were used cannot be determined from the repository."
    },
    {
        "id": "minidb-strict-2pl-wait-for-graph-youngest-victim",
        "kind": "decision",
        "project": "MiniDB",
        "projectId": "minidb",
        "title": "Row-level strict 2PL with a wait-for-graph detector that aborts the youngest transaction",
        "date": "2026-06-15",
        "dateSource": "commit 8622bae",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The engine needed serializable isolation between concurrent transactions and had to cope with lock cycles. Locks are taken per RID.",
        "decision": "LockManager keeps a queue per RID with S/X modes and FIFO waiters; all locks are released only in TxnManager.commit/abort (strict 2PL). An S-to-X upgrade is queued at the front, and a second concurrent upgrader on the same RID is rejected immediately with 'Deadlock avoided'. DeadlockDetector runs every 100 ms (DEADLOCK_CHECK_INTERVAL_MS), builds a wait-for graph from the lock table, finds a cycle with a colored DFS, and aborts the transaction with the highest TxnId in the cycle (the youngest).",
        "alternatives": [
            {
                "option": "MVCC",
                "whyNot": "README 'Known Limitations' says the system uses strict 2PL instead of MVCC, accepting that readers block writers; Architecture.md gives the benefit as 'simple, deterministic serializability'."
            },
            {
                "option": "Let a second S-to-X upgrader wait like any other request",
                "whyNot": "Two upgraders on the same RID each hold S and wait for the other's S, an immediate deadlock; the code and the test 'rejects concurrent upgrades to prevent deadlock' fail fast instead."
            }
        ],
        "consequences": "Unit tests cover 2- and 3-transaction cycles and assert the youngest is aborted; an integration test asserts t2 (the younger) is the victim. Costs found on inspection and re-run: (1) every scanned row takes a row lock in both Volcano and vectorized scans, which the ablation in the record 'Vectorized engine missed a 5-10x goal' shows to be a large share of scan time; (2) the abort path does not undo the victim's writes (TxnManager.abort is a TODO); (3) benchmarks/strict_2pl_concurrency.ts, run directly with npx tsx, exits without printing the deadlock result because the detector's interval is unref()'d and nothing else keeps the event loop alive; with a keep-alive timer added it prints 'Cycle detected: 4 -> 3. Aborting TxnId=4' and 'Deadlock resolved!'.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "8622bae",
                "href": "https://github.com/Ujjwaljain16/MiniDB/commit/8622bae",
                "note": "Adds LockManager, TxnManager, DeadlockDetector and their unit tests (2-txn and 3-txn deadlock, FIFO fairness, upgrade rejection)."
            },
            {
                "type": "test",
                "label": "deadlocks.test.ts@7b7c4ce",
                "href": "https://github.com/Ujjwaljain16/MiniDB/blob/7b7c4ce/MiniDB_Projects/Team_ARIES_Recovery/tests/integration/deadlocks.test.ts",
                "note": "Asserts exactly one of two deadlocked transactions is aborted and that it is the younger; second test asserts the 'Deadlock avoided' error for concurrent upgrades."
            }
        ],
        "verification": "Read LockManager.ts, DeadlockDetector.ts, TxnManager.ts and the tests; ran the jest suite (all concurrency tests pass); ran strict_2pl_concurrency.ts twice as documented (silent exit, exit code 0) and once under a keep-alive wrapper (deadlock resolved, victim TxnId 4). Attribution: All cited commits are authored by Ujjwaljain16 (git shortlog: 21 commits, one author). The README lists a two-person team, and git history cannot show which parts each person wrote, so the record should say \"commits by Ujjwaljain16; two-person course project\". No Co-Authored-By trailers exist in the history; whether AI tools were used cannot be determined from the repository."
    },
    {
        "id": "typeaheadx-rebalance-rerun",
        "kind": "investigation",
        "project": "TypeAheadX",
        "title": "Modulo vs consistent hashing when a 4th node is added: re-run of rebalance_experiment.py",
        "date": "2026-06-10",
        "dateSource": "script added in commit 66845c0; my re-run 2026-09-28",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "course",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "How many of 100,000 cache keys change owner when a 4th node is added under hash(key) % N and under the 500-vnode ring?",
        "method": "scripts/rebalance_experiment.py generates 100,000 unique random keys 'suggestion:<4-10 random lowercase letters>' (unseeded), maps them with MD5 modulo over 3 then 4 nodes, then with ConsistentHashRing(virtual_nodes=500) over 3 nodes then after add_node('redis-d'), and counts changes. It was run three times. The arc ownership of redis-d in the 4-node ring was computed separately (deterministic). This is a course project.",
        "result": "The repo reports 74.88% (modulo) and 26.44% (ring) in README.md and Project_Report.md. Three re-runs gave modulo 74,963 / 74,741 / 74,800 keys moved (74.96%, 74.74%, 74.80%) and ring 26,391 / 26,626 / 26,200 (26.39%, 26.63%, 26.20%). The values differ per run because the keys are unseeded; the repo figures are within that spread. Ring movement is about the new node's share of the ring: redis-d owns 26.27% of the 128-bit space with 500 vnodes (versus the ideal 25%), and the 4-node ownership is 24.54 / 25.18 / 24.01 / 26.27. Earlier doc versions: 75.00% and 24.64% at 1000 vnodes (66845c0), 74.97% and 26.18% at 500 (b116d06). Caveat: uniformly random keys, no traffic skew, and no runtime code path adds a node.",
        "measured": true,
        "numbers": [
            {
                "label": "Modulo keys moved, 3 re-runs",
                "value": "74.96%, 74.74%, 74.80%",
                "source": "python scripts/rebalance_experiment.py"
            },
            {
                "label": "Ring (500 vnodes) keys moved, 3 re-runs",
                "value": "26.39%, 26.63%, 26.20%",
                "source": "python scripts/rebalance_experiment.py"
            },
            {
                "label": "Repo-stated values",
                "value": "74.88% modulo, 26.44% ring",
                "source": "README.md lines 46-47; Project_Report.md lines 323 (ring only) and 382-383"
            },
            {
                "label": "redis-d ring ownership, 4 nodes, 500 vnodes",
                "value": "26.27%",
                "source": "arc-ownership script over ConsistentHashRing (deterministic; script not in the repo)"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "66845c0",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/66845c0",
                "note": "Adds scripts/rebalance_experiment.py."
            },
            {
                "type": "commit",
                "label": "b116d06",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/commit/b116d06",
                "note": "Docs updated from 1000 to 500 vnodes: 26.18% and 74.97%."
            },
            {
                "type": "benchmark",
                "label": "rebalance_experiment.py",
                "href": "https://github.com/Ujjwaljain16/TypeAheadX/blob/HEAD/scripts/rebalance_experiment.py",
                "note": "Re-runnable without Redis or Postgres."
            }
        ],
        "verification": "Ran the script three times (Python 3.11.9) and my own ownership script; compared with README.md, Project_Report.md and the docs at 66845c0 and b116d06. Attribution: Course project: the README does not say so, but docs/phase4-completion.md@66845c0 contains 'Viva Talking Points' and the phase briefs 3.md, 4.md and 5.md (committed, then deleted in the next phase) are written as instructions to a student ('most students will completely mess up'), so the work followed a written brief. All 15 commits are by Ujjwaljain16, none has a Co-Authored-By trailer, and 14 of 15 fall on one day (2026-06-10, 00:23 to 21:22 +05:30; the last is 2026-06-22)."
    },
    {
        "id": "lexis-checkpointed-ingestion",
        "kind": "decision",
        "project": "Lexis AI",
        "projectId": "lexis-ai",
        "title": "Make book ingestion resumable with per-stage checkpoint tables and job retry",
        "date": "2026-06-07",
        "dateSource": "commit e6d4198",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "team (4 contributors: Ujjwaljain16 100 of 133 commits incl. 3 as 'Ujjwal Jain', abdurrahmaan11265 27, veekshitha Nelluru 5, Lavya 1; git blame gives ingestion_orchestrator.py 725 lines to Ujjwaljain16 and 12 to abdurrahmaan11265)",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "Ingestion turns an uploaded PDF into a concept graph with one Gemini call per chunk and one per concept pair, on a free tier of about 15 requests per minute (PROJECT_STATUS.md). The first version ran everything in one transaction with commits only at the end (e6d4198^), so any crash or rate-limit failure discarded all work.",
        "decision": "Rewrite the orchestrator as stages that persist progress: chunks in batches of 20 (idempotent on conflict), raw_concepts per source chunk (commit every 20 chunk extractions; already-extracted chunks are skipped on resume), canonical concepts written once, relationship_candidates generated once and processed PENDING-first (commit every 50) with an evaluated_pairs table, and graph_build_jobs columns (current_stage, current_offset, retry_count, last_error, next_retry_at). The worker claims jobs with FOR UPDATE SKIP LOCKED and retries a failed job with exponential backoff up to 3 failures.",
        "alternatives": [
            {
                "option": "Single transaction over the whole pipeline (e6d4198^)",
                "whyNot": "PROJECT_STATUS.md: 'no recovery on crash'; one failure loses every LLM call already paid for."
            }
        ],
        "consequences": "A crash now loses at most one uncommitted batch (up to 19 chunk extractions or 49 pair evaluations, plus chunks that produced no concepts, which leave no checkpoint row), not the whole run; canonicalisation still commits once at the end, and PROJECT_STATUS.md's 'zero LLM re-calls' is slightly generous. Retry delays are 60 s and 120 s (the code computes 30*2^n with n starting at 1), not the '30s -> 60s -> 120s' in the docs, and the third failure is permanent. The expensive part was not reduced: generate_pairs still returns every ordered pair (n(n-1) LLM calls; its docstring mentions heuristic filtering, the body is a 'mock heuristic'), so at the documented ~15 requests/min 100 concepts would take about 11 hours of relationship calls (arithmetic, not measured). Resumability has no automated test: tests/test_golden_book.py is a skeleton with its assertions commented out.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "e6d4198",
                "href": "https://github.com/Ujjwaljain16/GenAI-34/commit/e6d4198",
                "note": "Rewrites ingestion_orchestrator.py (770 lines changed) and ingestion_worker.py; adds Alembic migration de54f380a89e_ingestion_batching.py."
            },
            {
                "type": "commit",
                "label": "09244cb",
                "href": "https://github.com/Ujjwaljain16/GenAI-34/commit/09244cb",
                "note": "Parent-side version: generate_pairs over all ordered pairs, commits only at the end of process_job."
            },
            {
                "type": "file",
                "label": "PROJECT_STATUS.md@bade772",
                "href": "https://github.com/Ujjwaljain16/GenAI-34/blob/bade772/PROJECT_STATUS.md",
                "note": "Describes the checkpoint tables, retry policy and the before/after."
            },
            {
                "type": "file",
                "label": "graph_builder.py@bade772",
                "href": "https://github.com/Ujjwaljain16/GenAI-34/blob/bade772/backend/app/services/graph_builder.py",
                "note": "generate_pairs adds (a,b) and (b,a) for every pair of concepts."
            }
        ],
        "verification": "git show e6d4198^:backend/app/services/ingestion_orchestrator.py; read the HEAD orchestrator stages, ingestion_worker.py (_backoff_seconds, mark_for_retry, FOR UPDATE SKIP LOCKED), graph_builder.py and tests/test_golden_book.py; git blame line counts; ran backend tests with a dummy GEMINI_API_KEY: 39 passed."
    },
    {
        "id": "nevupai-k6-write-load-test",
        "kind": "investigation",
        "project": "NevUpAI",
        "title": "k6 write test: first run used 1 VU (p95 5.38 ms); rerun with 100 VUs gave p95 27.84 ms",
        "date": "2026-04-27",
        "dateSource": "commit 9d73342 (script change and new results.json / docs/k6_report.html)",
        "provenance": "recorded",
        "rationaleSource": "inferred",
        "origin": "hackathon (single author)",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "Does POST /trades meet the p95 < 150 ms target under load, and what does the reported 27.84 ms represent?",
        "method": "nevup-backend/k6/trade-write-smoke.js against the local docker-compose stack. Run 1 (report at 9c441bb): constant-arrival-rate 200/s for 60 s, one fixed user, preAllocatedVUs 100, maxVUs 500. Run 2 (9d73342): constant-vus 100 for 60 s, each VU a distinct user/session with its own JWT, sleep(0.5) per iteration (target 200 req/s). Each request writes a new random tradeId, half open and half closed. Thresholds p(95)<150 and failure rate <1%. Not re-run: k6 is not installed and the Docker daemon was not running on the reviewing machine.",
        "result": "Run 1 hit the target only nominally: k6 needed at most 1 VU because responses were fast, so it did not exercise concurrency (p95 5.38 ms). The script was changed to 100 real concurrent users and the second run gave p95 27.84 ms, avg 18.16 ms, median 6.41 ms, 0% failed and 11,787/11,787 checks passing. Achieved rate was 188.86 req/s, not the '~200 requests/sec' the README states. Both runs contain one ~16.3 s maximum latency that neither the README nor DECISIONS.md explains. Caveats: write path only, one machine, a closed-loop model with 0.5 s think time, and 11,787 requests over 62.4 s.",
        "measured": true,
        "numbers": [
            {
                "label": "Run 2 http_req_duration p(95)",
                "value": "27.84221919999998 ms",
                "source": "nevup-backend/results.json"
            },
            {
                "label": "Run 2 avg / median / p90 / max",
                "value": "18.156 / 6.415 / 15.462 / 16308.302 ms",
                "source": "nevup-backend/results.json"
            },
            {
                "label": "Run 2 requests, rate, failures",
                "value": "11787 requests, 188.86/s, http_req_failed 0 of 11787",
                "source": "nevup-backend/results.json"
            },
            {
                "label": "Run 2 duration / VUs",
                "value": "62,411 ms test run; vus_max 100",
                "source": "nevup-backend/results.json (state.testRunDurationMs)"
            },
            {
                "label": "Run 1 p95 / avg / max, VUs",
                "value": "5.38 / 6.82 / 16266.52 ms; VUs min 0 max 1; 12,001 requests at 194.66/s",
                "source": "docs/k6_report.html@9c441bb"
            },
            {
                "label": "README claim",
                "value": "'Sustained ~200 requests/sec', p95 27.84 ms",
                "source": "nevup-backend/README.md@7d225fa"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "9d73342",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/commit/9d73342",
                "note": "Switches executor from constant-arrival-rate (one user) to 100 constant VUs with per-VU users and a 0.5 s sleep; adds the second report."
            },
            {
                "type": "commit",
                "label": "7d225fa",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/commit/7d225fa",
                "note": "README updated to 27ms p95 / ~200 req/s."
            },
            {
                "type": "benchmark",
                "label": "results.json@3d3b274",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/blob/3d3b274/nevup-backend/results.json",
                "note": "k6 handleSummary output for run 2."
            },
            {
                "type": "benchmark",
                "label": "k6_report.html@9c441bb",
                "href": "https://github.com/Ujjwaljain16/NevUpAI/blob/9c441bb/docs/k6_report.html",
                "note": "HTML report for run 1 (Virtual Users min 0 max 1)."
            }
        ],
        "verification": "Parsed results.json with python (values above); extracted the text of both HTML reports from git; diffed the k6 script across 9c441bb and 9d73342. Not re-run (no k6, Docker daemon down)."
    },
    {
        "id": "gitissue-streams-reclaim-dlq",
        "kind": "decision",
        "project": "GitIssue",
        "projectId": "gitissue",
        "title": "Redis Streams with XAUTOCLAIM redelivery, a dead-letter stream and a stale-update guard",
        "date": "2026-03-17",
        "dateSource": "commit 9b1a20b (queue, worker and db modules); tests in 751352a",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal (a multi-week plan; single author)",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "GitHub webhooks are retried, arrive out of order, and a worker can die mid-event. The planning documents (week1.md, v1.md) set the requirements: a secure, lossless, idempotent ingestion pipeline with at-least-once delivery, no duplicated or corrupted rows, and newer updates winning over older ones.",
        "decision": "The webhook (HMAC SHA-256, constant-time compare, empty secret rejects everything) does XADD to a stream. The worker uses a consumer group, ACKs only after process_event succeeds (in 9b1a20b the upsert; by 8eda41b also graph mapping), and each loop iteration first calls XAUTOCLAIM for entries idle over 30 s (WORKER_RECLAIM_IDLE_MS). On failure it does not ACK; when XPENDING's times_delivered reaches 5 it XADDs the message to github_events_dlq with a reason and then ACKs. The issue upsert has WHERE issues.updated_at <= EXCLUDED.updated_at, so an older redelivery cannot overwrite newer state.",
        "alternatives": [
            {
                "option": "'Do not ACK -> retry' with a plain XREADGROUP '>' loop (the sketch in week1.md)",
                "whyNot": "Inferred, not stated in the repo: reading with '>' only returns entries never delivered to the group, so an un-ACKed entry is not redelivered to a live consumer. The implementation adds XAUTOCLAIM and a delivery-count cutoff; TESTING_WEEK1.md (same commit as week1.md) already expects reclaim and dead-lettering."
            }
        ],
        "consequences": "Poison messages stop after 5 deliveries and are kept for inspection. In the current code the embedding job and the comment bot run as asyncio.create_task inside process_event, so a failure there is logged but not retried. When reclaimed messages exist the loop skips read_group for that iteration. Every worker test stubs reclaim_stale_messages to return nothing, so XAUTOCLAIM redelivery is never exercised, and the dead-letter test stubs the delivery count; no test runs against a real stream. The updated_at guard has Postgres integration tests that skip when no database is reachable. The 50 worker, webhook-signature and scoring tests pass.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "9b1a20b",
                "href": "https://github.com/Ujjwaljain16/GitIssue/commit/9b1a20b",
                "note": "Adds redis_stream.py (xautoclaim, pending_delivery_count, push_dead_letter) and worker.py loop; store.py has the updated_at guard."
            },
            {
                "type": "commit",
                "label": "f252e57",
                "href": "https://github.com/Ujjwaljain16/GitIssue/commit/f252e57",
                "note": "week1.md / v1.md plan for the queue and TESTING_WEEK1.md expectations."
            },
            {
                "type": "file",
                "label": "worker.py@8eda41b",
                "href": "https://github.com/Ujjwaljain16/GitIssue/blob/8eda41b/app/worker/worker.py",
                "note": "Reclaim before read, ACK after success, DLQ at worker_retry_max_attempts."
            },
            {
                "type": "test",
                "label": "test_worker_processing.py@8eda41b",
                "href": "https://github.com/Ujjwaljain16/GitIssue/blob/8eda41b/tests/test_worker_processing.py",
                "note": "test_run_worker_does_not_ack_on_failure and test_run_worker_dead_letters_after_retry_threshold (mocked Redis)."
            }
        ],
        "verification": "Read redis_stream.py, worker.py, webhook.py, store.py, config.py; ran `python -m pytest tests/test_worker_processing.py tests/test_webhook_signature.py tests/test_scoring_hybrid.py tests/test_scoring_signal.py` -> 50 passed in 27.95 s. Not run against Redis. Attribution: The design documents (week1.md, v1.md, week2.md, week4.5md) are pasted AI-assistant replies, so the design was planned with an AI assistant. The code commits are by Ujjwaljain16 with no Co-Authored-By trailer."
    },
    {
        "id": "sse-sharedworker-multiplexing",
        "kind": "decision",
        "project": "SSE-Observatory",
        "projectId": "sse-observatory",
        "title": "Multiplex one EventSource per (url, token) across tabs in a SharedWorker, with a per-tab fallback",
        "date": "2026-03-07",
        "dateSource": "commit f899859 (06:47, one of many per-file commits made within two minutes on 2026-03-07, so the true writing date is unknown but between 2026-02-10 and 2026-03-07); the earlier per-tab hook is 7ddaced (2026-02-10)",
        "provenance": "reconstructed",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The first version (7ddaced, 2026-02-10) opened one EventSource per browser tab inside useEventStream, so watching the same endpoint in several tabs opened several upstream connections. README.md section 9 (added in 76046c7, a few hours after the worker) states the concern as 'establishing 5 separate SSE connections drains server resources'.",
        "decision": "src/workers/sharedSSEWorker.ts owns the EventSource. Connections are keyed by `${url}::${token}`. Each tab is a MessagePort; the worker broadcasts events to all ports, keeps the last 50 events (MAX_BUFFER) and sends them as a 'catchup' message to late joiners, and closes a connection 60 s after its last port leaves (zombie timer). One lastPing time per connection is refreshed by pings from any tab, and a 30 s sweep closes connections whose tabs stopped pinging. useSharedStream.ts is documented as a 'drop-in replacement' for useEventStream and falls back to the per-tab hook if SharedWorker is unavailable or the worker fails.",
        "alternatives": [
            {
                "option": "One EventSource per tab (useEventStream, the original design)",
                "whyNot": "Kept only as the fallback path. It multiplies upstream connections by the number of tabs; README section 9 gives this as the reason for the change."
            }
        ],
        "consequences": "Measured end to end (see investigation sse-sharedworker-one-upstream-connection): three tabs on the same url and token produce one upstream request; a different token produces a second. The catch-up buffer is only 50 events, and the connection key includes the token in clear text. Reconnect logic still lives in the React hook (3 attempts, delay 2000 ms x attempt number), not in the worker, contrary to docs/technical/architecture.md, which says the worker handles 'Exponential Backoff reconnects'. The existing e2e test e2e/multiStream.spec.ts checks filter isolation between tabs but does not count upstream connections.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "7ddaced",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/7ddaced",
                "note": "Original per-tab useEventStream with its own EventSource (2026-02-10)."
            },
            {
                "type": "commit",
                "label": "f899859",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/f899859",
                "note": "Adds src/workers/sharedSSEWorker.ts (connections Map, MAX_BUFFER=50, ZOMBIE_TIMEOUT_MS=60000, catchup message)."
            },
            {
                "type": "file",
                "label": "useSharedStream.ts@0e8c14b",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/blob/0e8c14b/src/hooks/useSharedStream.ts",
                "note": "Header comment: drop-in replacement, falls back to useEventStream when SharedWorker is unsupported."
            },
            {
                "type": "doc",
                "label": "README.md@0e8c14b",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/blob/0e8c14b/README.md",
                "note": "States the motivation."
            },
            {
                "type": "test",
                "label": "sharedSSEWorker.test.ts@0e8c14b",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/blob/0e8c14b/src/workers/__tests__/sharedSSEWorker.test.ts",
                "note": "Six tests including zombie cleanup and 'should not duplicate events during reconnect storm'; all pass when run."
            }
        ],
        "verification": "Read sharedSSEWorker.ts, useSharedStream.ts and README section 9; checked the git history of both files; ran vitest (22 files, 103 passed, 1 skipped); ran the multi-tab measurement described in sse-sharedworker-one-upstream-connection. Attribution: The README wording ('exceedingly rare SharedWorker singleton') reads as AI-assisted; no Co-Authored-By trailers exist in the repository, so this cannot be proven."
    },
    {
        "id": "sse-vite-middleware-to-express-proxy",
        "kind": "decision",
        "project": "SSE-Observatory",
        "projectId": "sse-observatory",
        "title": "Replace the Vite dev-server SSE middleware with an Express server and Vercel functions",
        "date": "2026-03-07",
        "dateSource": "commits c503d1a (removes the Vite plugin, adds proxy '/api' to :3000) and 3b6deed (adds Express server.js), 18:21-18:22",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "To connect to third-party SSE endpoints the browser needs a CORS-free relay. On 2026-02-10 (a0c9c33 / 0c9d824) the relay existed twice: as a plugin inside vite.config.ts and as a plain-http server.js on port 3001 (the latter removed in 4a47828 on 2026-03-07). b9abae6 (06:46, 2026-03-07) still grew the Vite middleware to also serve the mock-session endpoints. The project had a vercel.json from its first commit, and the same evening's commits (a43c2a7, 25d610d, a25fbda) were Vercel deployment work; a dev-server plugin does not exist on Vercel.",
        "decision": "c503d1a deletes the plugin from vite.config.ts and configures a Vite proxy of '/api' to the backend. 3b6deed adds a new Express server.js (helmet, cors, compression, express-rate-limit 100 requests / 15 min on /api, DNS-based private-IP check, mock session endpoints, static serving of dist/) and api/sse/*.js Vercel functions with the same proxy logic. Vite now only forwards /api/* to the backend.",
        "alternatives": [
            {
                "option": "Keep the Vite middleware plugin (the state up to b9abae6)",
                "whyNot": "Not stated. Inferred from the same-day commits a43c2a7 ('persistent mock server via vercel kv'), 25d610d ('vercel config') and a25fbda ('optimize for vercel streaming'): a dev-server plugin cannot serve a deployed site."
            },
            {
                "option": "Standalone plain-http server.js from the February version (removed in 4a47828)",
                "whyNot": "Replaced by the Express version; no reason recorded."
            }
        ],
        "consequences": "The proxy now exists in two implementations, server.js and api/sse/index.js, which differ (ticket scheme; server.js applies its origin and private-address checks only in production mode). Local development broke first: c4810f4 and bb1b61d ('solve ECONNREFUSED') changed the Vite target to http://127.0.0.1:3000 and bound Express to 127.0.0.1. The Vite proxy target is hard-coded to port 3000, and every EventSource, including URLs on localhost:4000, is routed through /api/sse (obtainSSEProxyTicket has no local-port exemption, unlike buildSSEProxyUrl). In one run where an unrelated process held port 3000, all 16 runnable e2e tests failed at 'Connected'; with server.js on the target port they passed. src/tests/proxy.test.ts is titled 'Vite Proxy & Architecture Simulation' but exercises a mock http server, not the proxy, and comments in sseProxyUrl.ts still call it the Vite proxy.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "b9abae6",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/b9abae6",
                "note": "Vite plugin still implements /api/sse and /api/mock/* (06:46, 2026-03-07)."
            },
            {
                "type": "commit",
                "label": "c503d1a",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/c503d1a",
                "note": "Removes sseProxyPlugin from vite.config.ts; adds proxy '/api' -> :3000."
            },
            {
                "type": "commit",
                "label": "3b6deed",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/3b6deed",
                "note": "Adds Express server.js and api/sse/{index,ticket,_ticket}.js."
            },
            {
                "type": "commit",
                "label": "c4810f4",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/c4810f4",
                "note": "Vite target localhost:3000 -> 127.0.0.1:3000 (ECONNREFUSED fix); bb1b61d does the same for the Express bind."
            },
            {
                "type": "commit",
                "label": "0c9d824",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/0c9d824",
                "note": "February version: server.js and Vite plugin both present (a0c9c33 has the plugin in vite.config.ts)."
            }
        ],
        "verification": "Read vite.config.ts at 45f7a64, b9abae6, c503d1a and HEAD; read server.js and api/sse/index.js at HEAD; ran playwright with Vite + server.js on :3055 (16 passed) and with the proxy pointing at a foreign process on :3000 (16 failed)."
    },
    {
        "id": "sse-sharedworker-one-upstream-connection",
        "kind": "investigation",
        "project": "SSE-Observatory",
        "projectId": "sse-observatory",
        "title": "Does the SharedWorker really hold one upstream connection for several tabs?",
        "date": "2026-03-07",
        "dateSource": "commit f899859 (code under test); measurement re-run 2026-09-28 on HEAD 0e8c14b",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "When several tabs of the same browser context connect to the same URL, does the application open one upstream SSE request, and does a different token open a separate one?",
        "method": "A counting SSE server on 127.0.0.1:4100 recorded total and currently open requests. The app was driven in Chromium 145.0.7632.6 through Playwright 1.58.2, with Vite serving the UI on :3001 and the repository's server.js as the /api backend, and all tabs in one browser context. Tabs were opened one at a time; each filled the URL input and pressed connect, and the server counters were read 1.5 s later. The repository's e2e suite does not perform this measurement. The measurement was made on 2026-09-28 against commit 0e8c14b; the code under test dates from f899859.",
        "result": "1 tab: 1 total / 1 open upstream request. 2 tabs on the same URL: still 1 / 1. 3 tabs: still 1 / 1; each of the three tabs showed 9 event rows. A fourth tab with the same URL and a different token: 2 total / 2 open. After the browser closed: 2 total / 0 open (the counting server saw both connections close). So multiplexing works through the full path browser -> Vite -> Express -> upstream, and the key includes the token.",
        "measured": true,
        "numbers": [
            {
                "label": "upstream requests with 1, 2 and 3 tabs on the same url+token",
                "value": "1, 1, 1 (open connections 1, 1, 1)",
                "source": "Measurement run, 2026-09-28 (probe script not published)"
            },
            {
                "label": "upstream requests after a 4th tab with a different token",
                "value": "2 total, 2 open",
                "source": "Same run"
            },
            {
                "label": "open upstream connections after browser closed",
                "value": "0",
                "source": "Same run"
            }
        ],
        "verdict": "confirmed",
        "evidence": [
            {
                "type": "commit",
                "label": "f899859",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/f899859",
                "note": "sharedSSEWorker.ts keyed by makeKey(url, token)."
            },
            {
                "type": "test",
                "label": "multiStream.spec.ts@0e8c14b",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/blob/0e8c14b/e2e/multiStream.spec.ts",
                "note": "Existing test asserts only per-tab filter isolation."
            }
        ],
        "verification": "Ran the script against HEAD with the servers started from this session; stopped only those PIDs afterwards."
    },
    {
        "id": "sse-interceptor-sandbox-timeout-vs-isolation",
        "kind": "investigation",
        "project": "SSE-Observatory",
        "projectId": "sse-observatory",
        "title": "Interceptor sandbox: the 100 ms kill works, but shadowing globals is not a security boundary",
        "date": "2026-03-07",
        "dateSource": "commit 61d2488 (code under test); measurement run 2026-09-28",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "Does terminating a worker really stop a synchronous infinite loop within the 100 ms budget, and does the shadowed-globals wrapper prevent network access?",
        "method": "The repository's tests cannot answer this: setup.ts replaces Worker with a MockWorker whose terminate() does nothing, the loop test is it.skip and the e2e test is test.skip. The wrapper from interceptorWorker.ts (same list of shadowed names) was therefore copied into a Blob Worker run inside the app page in Chromium 145.0.7632.6, mirroring the pool's setTimeout + terminate() logic, and six interceptor bodies were run. The loop cases were repeated in Node 22.19 worker_threads, together with a main-thread Promise.race control. This is a replica of the wrapper, not the built app bundle.",
        "result": "Chromium: `while(true){}` was killed at about 105-107 ms; a normal interceptor returned in about 3.5-4 ms including worker creation; a direct call to fetch failed because the name is shadowed. Other ways of reaching the same global APIs from inside the wrapper still worked, so shadowing by name is not an isolation boundary. Node: the loop was killed in 103-115 ms across runs and a memory-abuse loop in 109-115 ms; a main-thread Promise.race against a 1500 ms synchronous loop resolved 'done' after 1500 ms, which confirms the header comment that Promise.race cannot interrupt synchronous code. The termination path works; the wrapper guards against accidents rather than acting as a security boundary, and untrusted interceptor code should not be treated as contained.",
        "measured": true,
        "numbers": [
            {
                "label": "sync infinite loop, Chromium 145, 100 ms timer + terminate()",
                "value": "killed at about 105-107 ms",
                "source": "Measurement runs, 2026-09-28 (replica of the wrapper; probe script not published)"
            },
            {
                "label": "normal interceptor round trip incl. worker creation, Chromium",
                "value": "about 3.5-4 ms",
                "source": "Same runs"
            },
            {
                "label": "sync loop / memory-abuse loop killed, Node 22.19 worker_threads",
                "value": "103-115 ms / 109-115 ms across runs",
                "source": "Same runs"
            },
            {
                "label": "main-thread Promise.race against 1500 ms sync loop",
                "value": "resolved 'done' after 1500 ms",
                "source": "Same runs"
            }
        ],
        "verdict": "partial",
        "evidence": [
            {
                "type": "commit",
                "label": "61d2488",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/commit/61d2488",
                "note": "Design and header comment claiming fetch is shadowed and terminate() kills loops."
            },
            {
                "type": "file",
                "label": "setup.ts@0e8c14b",
                "href": "https://github.com/Ujjwaljain16/SSE-Observatory/blob/0e8c14b/src/test/setup.ts",
                "note": "MockWorker with empty terminate()."
            }
        ],
        "verification": "Ran the replica in Chromium and in Node on 2026-09-28; the shadow list matches interceptorWorker.ts, but the built app bundle was not tested."
    },
    {
        "id": "vitest-mergetests-breadth-tests-rejected",
        "kind": "decision",
        "project": "Vitest",
        "title": "mergeTests: a large test suite the maintainer judged did not test what differs from extend()",
        "date": "2026-02-22",
        "dateSource": "PR #9662 (open): maintainer review comments of 2026-02-21 and 2026-02-22 on commits 1ad69af, bd0261a and f3a083c; last maintainer review 2026-02-22T15:31Z.",
        "provenance": "recorded",
        "rationaleSource": "inferred",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "After the first review (2026-02-15) the contributor pushed 25 more commits over about three weeks, growing the PR to +1869 lines: 1,260 in test/cli/test/merge-tests.test.ts, 318 in test/core/test/merge-tests.test.ts and 57 in a type test, against 166 added lines of runtime source. At the version the maintainer last reviewed (f3a083c) the two runtime test files held about 1,327 lines; both were rewritten on 2026-03-09 and 03-10 and have had no maintainer response. STATUS: OPEN and unmerged; seven CHANGES_REQUESTED reviews stand.",
        "decision": "Per the review record, the contributor tested the feature mainly by volume and variety of scenarios (the 2026-03-10 PR comment lists merge semantics, nested merges, overrides, dependency graphs, diamond inheritance, type inference, validation errors, scaling, lifecycle ordering, worker/file/test scopes, circular dependency detection, self-merge and 50+ fixture stress tests) rather than starting from the cases where mergeTests could differ from repeated extend(). This is the maintainer's characterisation; the contributor did not state the choice.",
        "alternatives": [
            {
                "option": "Targeted cases the maintainer listed on 2026-02-21",
                "whyNot": "Partly adopted after the maintainer's last review: the head adds a scope and auto conflict check in mergeTests and tests for a conflicting scope, same-name fixtures with different types, and cross-merge dependencies. The maintainer has not reviewed them. He had asked what happens when both tests define the same fixture, when fixtures depend on merged ones, when the same fixture has different types, and when it has a different scope or other settings."
            },
            {
                "option": "Assert with toMatchInlineSnapshot instead of toContain",
                "whyNot": "Maintainer: AGENTS.md forbids toContain for these tests because it hides stack traces and full output; tests is an array and the whole array should be asserted. The head converted many assertions but still has 15 toContain lines in the CLI test file."
            }
        ],
        "consequences": "Findings in the review thread (2026-02-21 and 02-22): (a) tests used toContain against output, which AGENTS.md forbids (15 toContain lines remain in the CLI test file at the head, next to 71 inline-snapshot assertions in the PR); (b) three comments on suite.ts say \"This is not tested\" about implementation branches; (c) \"most of the current tests are basically the same test with different values\" and only one used dependencies; (d) a test that \"will always pass\"; (e) a scope-mismatch test failed inside it.extend, not in mergeTests, which had no validation of its own; (f) a suspected `never` type to be checked with expectTypeOf. The final review says the tests document wrong behaviour and calls them AI-generated. On 2026-03-10 the contributor apologised, added scope and auto conflict checks and rewrote both test files; no maintainer reply follows. The thread supports one takeaway: the tests mostly exercised paths extend() already covers, while same-name fixtures across two tests went untested until the maintainer named them.",
        "status": "partial",
        "evidence": [
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662#discussion_r2836501661",
                "href": "https://github.com/vitest-dev/vitest/pull/9662#discussion_r2836501661",
                "note": "Maintainer: tests are the same test with different values, no dependency coverage; lists the cases that would catch bugs."
            },
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662#discussion_r2838110285",
                "href": "https://github.com/vitest-dev/vitest/pull/9662#discussion_r2838110285",
                "note": "Maintainer: a test that always passes."
            },
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662#discussion_r2838119482",
                "href": "https://github.com/vitest-dev/vitest/pull/9662#discussion_r2838119482",
                "note": "Maintainer: a scope test that fails in extend, not in mergeTests."
            },
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662#discussion_r2836452177",
                "href": "https://github.com/vitest-dev/vitest/pull/9662#discussion_r2836452177",
                "note": "Maintainer: AGENTS.md forbids toContain in test files."
            },
            {
                "type": "commit",
                "label": "30ddf39",
                "href": "https://github.com/vitest-dev/vitest/commit/30ddf39",
                "note": "Last commit of the PR, 2026-03-10, 'test(merge-tests): finalize structural and integration test suites with purity guards'."
            },
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9662#pullrequestreview-3838102156",
                "href": "https://github.com/vitest-dev/vitest/pull/9662#pullrequestreview-3838102156",
                "note": "Maintainer review of 2026-02-22 on f3a083c: says the tests document wrong behaviour and that he is tired of reviewing."
            }
        ],
        "verification": "Read all 23 inline review comments (author, path, line, commit) and the review states through gh api; read the diff to compute per-file line counts (gh pr view 9662 --json files); counted the source additions in fixture.ts, index.ts, suite.ts and public/index.ts (68 + 1 + 96 + 1 = 166). Did not run the tests. Attribution: The maintainer attributes the tests to AI in the 2026-02-22 review; the contributor's replies do not respond and the commits carry no AI trailer."
    },
    {
        "id": "spentsmart-apk-size-across-releases",
        "kind": "investigation",
        "project": "SpentSmart",
        "projectId": "spentsmart",
        "title": "The documented 45MB-to-15MB size cut is not visible: release APKs grew 9.3%",
        "date": "2026-02-08",
        "dateSource": "GitHub release v2.01 published 2026-02-08T00:39:38Z (v2.0.0 2026-02-07T23:04:59Z, v1.0.0 2026-01-03T12:57:12Z)",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "docs/CODEBASE_ANALYSIS.md claims a bundle went from 45MB to about 15MB (called a 60% reduction) after victory-native/Skia and react-native-chart-kit were replaced by a custom SVG chart. Do the shipped release APKs show any reduction?",
        "method": "Read the asset sizes of the three GitHub releases with `gh api repos/Ujjwaljain16/SpentSmart/releases`; fetched the release tags (they point at the pre-rewrite commit lineage) and diffed package.json at v1.0.0, v2.0.0 and v2.01; searched every commit's package.json and the lockfiles for victory-native and react-native-skia. APKs were not downloaded or unpacked.",
        "result": "No reduction is visible: the v2.0.0 and v2.01 APKs are about 9.3% larger than v1.0.0. The comparison is rough: the docs say 'bundle', the assets are APKs, v2 adds expo-notifications and expo-updates, and the v1 asset name is an EAS-style file name while v2 names differ. victory-native and Skia are never in package.json; they appear only in pnpm-lock.yaml (added in cc86919, removed in be95873, both 2026-01-03, and still in the lockfile at the v1.0.0 tag). react-native-chart-kit stays in package.json at every tag; only the pie chart component that used it was deleted. Nothing in the repository measures 45MB or 15MB, and 45 to 15 is a 67% reduction, not the 60% stated.",
        "measured": true,
        "numbers": [
            {
                "label": "v1.0.0 APK (application-58841ca1-3e46-4f4f-a829-e8d81073b361.apk)",
                "value": "115,963,061 bytes",
                "source": "gh api repos/Ujjwaljain16/SpentSmart/releases (asset size)"
            },
            {
                "label": "v2.0.0 APK (SpentSmartV2.apk)",
                "value": "126,787,065 bytes (+9.33% vs v1.0.0)",
                "source": "same"
            },
            {
                "label": "v2.01 APK (SpentSmartV2.01Release.apk)",
                "value": "126,765,689 bytes (+9.32% vs v1.0.0)",
                "source": "same"
            },
            {
                "label": "Documented before/after",
                "value": "45MB -> ~15MB, '60% bundle size reduction'",
                "source": "docs/CODEBASE_ANALYSIS.md@e3c438b and HEAD"
            },
            {
                "label": "Commits where victory-native or react-native-skia appear in package.json",
                "value": "0",
                "source": "git log --all -S<name> -- package.json"
            },
            {
                "label": "Commits that add / remove them in pnpm-lock.yaml",
                "value": "added in cc86919, removed in be95873 (both 2026-01-03); still present in the lockfile at the v1.0.0 tag",
                "source": "git log --all -S victory -- pnpm-lock.yaml"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "commit",
                "label": "e587e54",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/e587e54",
                "note": "The v1.0.0 tag commit: package.json has react-native-chart-kit, expo-dev-client and no victory/skia."
            },
            {
                "type": "commit",
                "label": "3c5546a",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/3c5546a",
                "note": "The v2.0.0 tag commit: package.json adds expo-notifications and expo-updates and still has react-native-chart-kit."
            },
            {
                "type": "commit",
                "label": "e3c438b",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/e3c438b",
                "note": "First commit containing the 45MB / 15MB / 60% text in docs/CODEBASE_ANALYSIS.md (the twin e587e54 on the tag lineage has the same text)."
            },
            {
                "type": "commit",
                "label": "cc86919",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/cc86919",
                "note": "Adds pnpm-lock.yaml entries for victory-native 41.20.2 and @shopify/react-native-skia 2.4.14 although package.json does not list them."
            },
            {
                "type": "commit",
                "label": "be95873",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/be95873",
                "note": "Removes the victory-native and react-native-skia entries from pnpm-lock.yaml."
            },
            {
                "type": "release",
                "label": "GitHub releases",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/releases",
                "note": "Asset names and sizes for v1.0.0, v2.0.0 and v2.01."
            }
        ],
        "verification": "Ran the gh api query (sizes above); ran `git fetch origin 'refs/tags/*:refs/tags/*'` and `git show <tag>:package.json`; python check that node_modules/react-native-chart-kit in package-lock.json has dependencies lodash, paths-js, point-in-polygon. Attribution: The 45MB to 15MB claim comes from docs/CODEBASE_ANALYSIS.md, which appears to be AI-generated documentation; no build measurement backs it."
    },
    {
        "id": "ab-argument-level-regex-dlp",
        "kind": "decision",
        "project": "AgentBrake",
        "projectId": "agentbrake",
        "title": "Add per-argument regex allow/deny rules because a tool-name allowlist is too coarse",
        "date": "2026-02-07",
        "dateSource": "commit ed26678 (GranularAccessPolicy); design text in commit 8136b6f (ROADMAP_V3.md)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "hackathon",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "ROADMAP_V3.md (8136b6f, 17:39; removed later the same day in 03de458) states the problem: 'AllowedTools: [\"read_file\"] is too broad. It allows reading /etc/passwd just as easily as /tmp/log.txt.' and calls the fix 'the showstopper feature' for the demo. Implementation followed about 12 minutes later (ed26678, 17:52).",
        "decision": "GranularRuleSchema (zod) and GranularAccessPolicy: per tool, a list of rules with deny_if.arguments and allow_if.arguments, each a map argument-name -> regular expression string. A deny_if match, or an allow_if miss, returns the rule's action (default block; the sample config uses kill for secrets). Matching is String(value) against `new RegExp(pattern)` with no flags, evaluated per call.",
        "alternatives": [
            {
                "option": "Tool-name allowlist only (AllowedToolsPolicy)",
                "whyNot": "Too broad, per the roadmap; kept alongside the new policy."
            }
        ],
        "consequences": "The policy matches case-sensitive regular expressions against the raw argument text, so it blocks the strings used in the demo but not equivalent variations (different letter case, spacing, path form or recipient domain). The bundled example configuration is illustrative, not a complete filter; this limitation is known and not fixed. The roadmap's example pattern '(?i)DROP TABLE' is not valid JavaScript regex syntax: an uncompilable pattern makes the policy throw, and the proxy forwarded a call when a policy throws (373adcd, Sep 2026, changed this: patterns are compiled and length-checked at startup, and a policy that throws blocks the call). A 'kill' action ends the whole proxy process on the first match.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "8136b6f",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/8136b6f",
                "note": "ROADMAP_V3.md (deleted later the same day in 03de458) with the problem statement and a '(?i)DROP TABLE' example."
            },
            {
                "type": "commit",
                "label": "ed26678",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/commit/ed26678",
                "note": "GranularAccessPolicy.ts and GranularRuleSchema."
            },
            {
                "type": "file",
                "label": "enterprise-config.yml@0fc99c8",
                "href": "https://github.com/Ujjwaljain16/AgentBrake/blob/0fc99c8/examples/enterprise-config.yml",
                "note": "Case-sensitive patterns such as '.*(DROP|DELETE|TRUNCATE|ALTER|UPDATE).*'."
            }
        ],
        "verification": "Ran the built proxy (node dist/src/proxy/index.js) against a mock tool server for the demo cases and read GranularAccessPolicy.ts and interceptor.ts. Attribution: ROADMAP_V3.md wording ('Why Unique?', 'showstopper feature') reads as AI-assisted; no Co-Authored-By trailers exist in the repository, so it cannot be proven."
    },
    {
        "id": "spentsmart-raw-qr-replay",
        "kind": "decision",
        "project": "SpentSmart",
        "projectId": "spentsmart",
        "title": "Replay a scanned merchant QR's original parameters instead of rebuilding the UPI URL",
        "date": "2026-01-03",
        "dateSource": "docs/UPI_FIXES_APPLIED.md first committed in 319b189; code in ced0a20 and cfb3c73 (2026-01-03)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal (prototype URL builder by Ayush, replaced by Ujjwaljain16)",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The prototype parsed a scanned QR and rebuilt a fresh upi://pay URL with URLSearchParams (pa, pn, am, cu, tn). Merchant QRs carry more parameters (mc, mid, tid, tr, sign, orgid, mode, purpose) and some are signed, so rebuilding drops or re-encodes fields. The docs of the time say some PSPs may reject such URLs.",
        "decision": "parseUPIQRCode stores the original query parameters, still percent-encoded, in rawParams. buildUPIUrl treats a QR as a true merchant if it has any of mid/tid/tr/orgid/sign and replays those parameters (joined key=value, with %20 replaced by +). A QR without those signals but with mc, mode=02 or purpose=00 is treated as a 'pseudo-merchant' and rebuilt as a plain P2P URL (pa, pn, am, cu, tn, fresh tr). A non-upi:// QR (EMV / Bharat) is not parsed; the parser comment says UPI apps should handle it raw, but the scanner screen currently shows 'Invalid QR Code' for it.",
        "alternatives": [
            {
                "option": "Rebuild every URL with URLSearchParams (constants/upi-config.ts@4057dde)",
                "whyNot": "docs/PRODUCTION_UPI_GUIDE.md: signed merchant QRs need exact replay 'byte-for-byte' to keep the sign field; docs/UPI_FIXES_APPLIED.md: mixing encoded and plain values causes double encoding. Both docs were deleted in e3c438b."
            },
            {
                "option": "Parse EMV/Bharat QR in the app",
                "whyNot": "docs/PRODUCTION_UPI_GUIDE.md: UPI apps already validate EMV TLV and CRC, so the app should pass the raw QR through. The pass-through itself is not implemented (the scanner rejects such codes)."
            }
        ],
        "consequences": "According to docs/UPI_FIXES_APPLIED.md, the first version never returned rawParams, so every scan fell back to a rebuilt URL. Limits in the code: the parser drops empty-valued parameters and truncates values containing '=', the exact original query string (rawQuery) is never populated, and the %20 to + replacement means the replay is not byte for byte. The Google Pay path builds its own URL without rawParams. docs/PHONEPE_SECURITY_ANALYSIS.md reports PhonePe still declining a payment started from this app with the original URL; its explanation (PhonePe blocks third-party callers) is the doc's conclusion from manual tests and is not tested in the repo.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "ced0a20",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/ced0a20",
                "note": "services/upi-parser.ts at this commit returns rawParams ('CRITICAL: Actually return rawParams!') and detects non-UPI (Bharat) QRs."
            },
            {
                "type": "commit",
                "label": "4057dde",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/4057dde",
                "note": "Original constants/upi-config.ts (Ayush) builds the URL with URLSearchParams from pa/pn/am/cu/tn only."
            },
            {
                "type": "commit",
                "label": "cfb3c73",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/cfb3c73",
                "note": "constants/upi-config.ts: adds the strongMerchantSignals, isTrueMerchant / isPseudoMerchant branches and the %20 to + replacement in buildUPIUrl (2026-01-03)."
            },
            {
                "type": "file",
                "label": "scanner.tsx@357d2df",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/blob/357d2df/app/scanner.tsx",
                "note": "A null result from parseUPIQRCode (including EMV / Bharat QR) shows the 'Invalid QR Code' alert."
            }
        ],
        "verification": "Read constants/upi-config.ts at 4057dde and HEAD, services/upi-parser.ts at ced0a20 and HEAD, and the two docs at 319b189. Attribution: The rationale docs (UPI_FIXES_APPLIED.md, PRODUCTION_UPI_GUIDE.md, PHONEPE_SECURITY_ANALYSIS.md, added in 319b189 and deleted in e3c438b) read as AI-assistant output addressed to the developer; the code changes are by Ujjwaljain16 with no Co-Authored-By trailer."
    },
    {
        "id": "spentsmart-native-upi-module",
        "kind": "decision",
        "project": "SpentSmart",
        "projectId": "spentsmart",
        "title": "Custom Kotlin Expo module with <queries> to find and launch UPI apps on Android 11+",
        "date": "2026-01-02",
        "dateSource": "commit 815e2a9 (main lineage; same change is 32b17d2 on the v1.0.0/v2.0.0/v2.01 tag lineage)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal (the first prototype, 12 commits on 2025-12-28/29 on the tag lineage, was written by a collaborator, Ayush; the native module and everything below is by Ujjwaljain16)",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The prototype opened UPI apps with expo-linking: Linking.canOpenURL on a gpay:// URL, then on upi://pay. On Android 11+ package-visibility rules make canOpenURL/app discovery unreliable unless the app declares <queries>, and Expo Go cannot load a custom native module or change the merged manifest.",
        "decision": "A local Expo module (modules/upi-intent, Kotlin) declares <queries> for the upi scheme plus 14 explicit UPI package names (815e2a9). The first Kotlin version (b89e812) exposes getUPIApps (a PackageManager query), launchAppByPackage and launchUPI (system chooser); launchUpiDirect, shareTo and shareBase64 (FileProvider, added through a config plugin) came on 2026-02-08 (f2f4e94). services/upi-app-launcher.ts uses the module in two chains: app discovery tries native getUPIApps and falls back to Linking.canOpenURL scheme probing; the chooser fallback tries native launchUPI, then expo-intent-launcher, then Linking. So the app still runs, with reduced behaviour, in Expo Go.",
        "alternatives": [
            {
                "option": "expo-linking canOpenURL + gpay:// then upi://pay (the original prototype, services/upi-launcher.ts@4057dde)",
                "whyNot": "The manifest comment says explicit package visibility is 'the most reliable way to fix \"App not installed\" errors on Android 11+', and a code comment in upi-app-launcher.ts says canOpenURL on Android 11+ 'often returns false OR true mistakenly' without <queries>. Scheme probing also cannot enumerate installed UPI apps or target a package. It is kept only as a fallback."
            },
            {
                "option": "expo-intent-launcher only (kept as a fallback tier)",
                "whyNot": "Not stated in the repo; inferred: it can start an intent but has no PackageManager query to list installed UPI apps, and the QR image sharing needs a FileProvider and native code."
            }
        ],
        "consequences": "Needs a development build (QRPaymentGenerator.tsx logs 'UpiIntent native module not available (Expo Go)'). The package list is hard-coded in the manifest, so a new UPI app needs an app update. The iOS side of the module is the unmodified Expo template (a 'hello' function), so this is Android-only. docs/CODEBASE_ANALYSIS.md claims a '100% success rate' for the native path; nothing in the repo measures that, and docs/PHONEPE_SECURITY_ANALYSIS.md (removed later in e3c438b) recorded PhonePe declining a payment started from this app even though the original QR URL was passed unchanged.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "815e2a9",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/815e2a9",
                "note": "Adds the <queries> manifest with the upi scheme and 14 package names, with the Android 11+ comment."
            },
            {
                "type": "commit",
                "label": "c5a0bcd",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/c5a0bcd",
                "note": "Adds services/upi-app-launcher.ts: native getUPIApps discovery with a Linking.canOpenURL fallback, and a chooser fallback of native launchUPI, then expo-intent-launcher, then Linking."
            },
            {
                "type": "commit",
                "label": "4057dde",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/4057dde",
                "note": "The Ayush-authored prototype (tag lineage) that used Linking.canOpenURL, i.e. the approach that was replaced."
            },
            {
                "type": "file",
                "label": "UpiIntentModule.kt@357d2df",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/blob/357d2df/modules/upi-intent/android/src/main/java/expo/modules/upiintent/UpiIntentModule.kt",
                "note": "AsyncFunctions launchAppByPackage, shareTo, shareBase64, launchUpiDirect, getUPIApps."
            },
            {
                "type": "file",
                "label": "QRPaymentGenerator.tsx@357d2df",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/blob/357d2df/components/payment/QRPaymentGenerator.tsx",
                "note": "Comments 'This will fail in Expo Go' / 'requires dev build' show why the fallbacks exist."
            },
            {
                "type": "commit",
                "label": "b89e812",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/b89e812",
                "note": "First version of UpiIntentModule.kt: launchAppByPackage, getUPIApps and launchUPI."
            },
            {
                "type": "commit",
                "label": "f2f4e94",
                "href": "https://github.com/Ujjwaljain16/SpentSmart/commit/f2f4e94",
                "note": "Adds launchUpiDirect, shareTo, shareBase64 and the FileProvider config plugin (app.plugin.js)."
            }
        ],
        "verification": "git show 815e2a9, c5a0bcd, 4057dde; read UpiIntentModule.kt, app.plugin.js, ios/UpiIntentModule.swift, services/upi-app-launcher.ts and QRPaymentGenerator.tsx at HEAD; git shortlog on the v2.01 tag lineage shows 59 Ujjwaljain16 / 12 Ayush commits. Attribution: docs/CODEBASE_ANALYSIS.md and docs/PHONEPE_SECURITY_ANALYSIS.md appear to be AI-assistant-written; the manifest comment and the code are the primary evidence. Code commits are by Ujjwaljain16 with no Co-Authored-By trailer; the prototype is by Ayush (author of 12 commits on 2025-12-28/29)."
    },
    {
        "id": "vitest-tsc-help-text-when-no-tsconfig",
        "kind": "investigation",
        "project": "Vitest",
        "title": "Why typecheck printed the whole tsc help text: tsc was run without -p and found no tsconfig",
        "date": "2025-12-23",
        "dateSource": "PR #9214 merged 2025-12-23T17:15:53Z (squash commit 7b10ab4)",
        "provenance": "recorded",
        "rationaleSource": "inferred",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "In issue #8981, running 'vitest run --typecheck' in a project with no tsconfig.json produced 'Typecheck Error' followed by the whole tsc help text. What causes tsc to print help, and how should Vitest report it?",
        "method": "Read Typechecker.spawn() in packages/vitest/src/typecheck/typechecker.ts: the argument list is --noEmit --pretty false --incremental --tsBuildInfoFile <path>, and '-p <tsconfig>' is appended only if typecheck.tsconfig is set (same code at v4.0.8 and v4.0.17). Vitest also captured only stdout. The PR adds a check in prepareResults() that throws a descriptive error if the tsc output contains 'The TypeScript Compiler - Version' or 'COMMON COMMANDS', and also captures stderr. For the review-required test, the author replaced a mocked unit test with runInlineTests and a fake checker executable that prints tsc's help header. The underlying question was then re-run with the real compiler (see result).",
        "result": "A re-run with typescript 5.9.3 (the version in the issue) in an empty directory with no tsconfig in any parent: the arguments Vitest uses, without -p, print \"tsc: The TypeScript Compiler - Version 5.9.3 ... COMMON COMMANDS\" (141 lines) and exit with code 1. With -p ./nope.json tsc prints TS5058; with -p to a tsconfig containing {} it prints TS18003. So help text appears when tsc runs without -p and finds no tsconfig in the directory or its parents. Two contributor statements do not match this: the issue comment says tsc \"exits with code 0\" (1 here), and the 2025-12-17 review reply says Vitest always calls tsc with -p (the source adds -p only if typecheck.tsconfig is set). The merged test therefore uses a stub checker that prints the help header, which the maintainer liked. Review took four CHANGES_REQUESTED rounds and 20 commits (a stray snapshot file, a fully mocked test rejected under AGENTS.md, then createFile and static imports). The issue proposed checking that the tsconfig exists; the PR instead detects two marker strings, a choice the PR text does not explain.",
        "measured": true,
        "numbers": [
            {
                "label": "tsc 5.9.3, Vitest arguments, no -p, no tsconfig",
                "value": "prints \"The TypeScript Compiler - Version 5.9.3\" and COMMON COMMANDS (141 lines); exit code 1",
                "source": "Re-run: node node_modules/typescript/bin/tsc --noEmit --pretty false --incremental --tsBuildInfoFile ./x.tsbuildinfo in an empty temp directory"
            },
            {
                "label": "tsc with -p ./nope.json",
                "value": "error TS5058: The specified path does not exist",
                "source": "Same re-run"
            },
            {
                "label": "tsc with -p tsconfig.json containing {}",
                "value": "error TS18003: No inputs were found in config file",
                "source": "Same re-run"
            },
            {
                "label": "PR size",
                "value": "+103 / -2 lines; 20 commits; 3 files",
                "source": "gh pr view 9214 --repo vitest-dev/vitest --json additions,deletions,commits,changedFiles"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "pr",
                "label": "vitest-dev/vitest/pull/9214",
                "href": "https://github.com/vitest-dev/vitest/pull/9214",
                "note": "Merged PR; review thread on the test strategy and the exchange about why an integration test is hard."
            },
            {
                "type": "issue",
                "label": "vitest-dev/vitest/issues/8981",
                "href": "https://github.com/vitest-dev/vitest/issues/8981",
                "note": "Original report with tsc 5.9.3 help output and the reporter's proposal."
            },
            {
                "type": "commit",
                "label": "7b10ab4",
                "href": "https://github.com/vitest-dev/vitest/commit/7b10ab4cd7d23d3c520fd1f6956ce99108f70a04",
                "note": "Squash commit 'fix(typecheck): improve error message when tsc outputs help text (#9214)', author date 2025-12-23; contained in v4.0.17 (published 2026-01-12)."
            },
            {
                "type": "file",
                "label": "typechecker.ts@v4.0.17",
                "href": "https://github.com/vitest-dev/vitest/blob/v4.0.17/packages/vitest/src/typecheck/typechecker.ts",
                "note": "Contains the help-text check (line 130 onward) and the conditional -p argument (lines 314-316)."
            },
            {
                "type": "test",
                "label": "typecheck-error.test.ts",
                "href": "https://github.com/vitest-dev/vitest/blob/HEAD/test/typescript/test/typecheck-error.test.ts",
                "note": "Stub-executable test added by the PR; exists on main."
            }
        ],
        "verification": "Read the PR, issue, all inline review comments and review states with gh; fetched typechecker.ts at v4.0.8 and v4.0.17 and read spawn(); installed typescript@5.9.3 into a temporary directory and ran the three tsc invocations listed above; checked that typecheck-error.test.ts and the help-text check exist on main. Did not run the Vitest test."
    },
    {
        "id": "appwrite-mfa-recovery-code-case-mismatch",
        "kind": "investigation",
        "project": "Appwrite",
        "title": "MFA recovery codes rejected in 1.8.0: a lower-cased type constant never matched",
        "date": "2025-12-11",
        "dateSource": "PR #10925 merged 2025-12-11T14:28:06Z (merge commit 35fe622)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "open-source",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "Why did PUT /v1/account/mfa/challenge answer 'Invalid token passed in the request' for valid recovery codes on self-hosted Appwrite 1.8.0 (issue #10740)?",
        "method": "The issue's server log named app/controllers/api/account.php line 4972 (the USER_INVALID_TOKEN throw in the reporter's build). The contributor read the handler and compared the value stored on the challenge with the value used in the comparison. POST /account/mfa/challenge stores 'type' => $factor, and the factor whitelist accepts Type::RECOVERY_CODE unmodified. Type::RECOVERY_CODE is 'recoveryCode' (src/Appwrite/Auth/MFA/Type.php at tag 1.8.0). The verification handler compared the stored type to \\strtolower(Type::RECOVERY_CODE), i.e. 'recoverycode', both in an inner === check and as a key of a PHP match() expression. match() compares strictly, so the recovery branch could never be taken and the request fell through to default => false. The fix removed both strtolower() calls, and a new E2E test testMFARecoveryCodeChallenge exercises the whole path.",
        "result": "Root cause confirmed by reading the 1.8.0 tag: the stored type and the compared value differed only in case. The E2E test creates recovery codes (201) and a 'recoveryCode' challenge (201), verifies a valid code (200, factors contains 'recoveryCode'), then checks that reuse of the code (401) and an invalid code (401) are rejected. The contributor pasted a run of an earlier test version; the merged test has 12 assertions. The PR does not show the test failing before the fix, so that half of the regression claim rests on the code reading. At the maintainer's request the PR also changed POST /account/mfa/recovery-codes and POST /account/mfa/challenge to return 201 instead of 200. Review needed four CHANGES_REQUESTED reviews by stnguyen90; the first said tests were failing (\"Did you test it yourself?\"), and a ~75-line session fallback in an earlier test version was criticised by CodeRabbit and replaced by reuse of the ordinary session. Release: not in 1.8.1 (2025-12-23), whose Challenges/Update.php still has \\strtolower(Type::RECOVERY_CODE); a user reported the failure on 1.8.1 on 2026-01-01. First tag with the fix: 1.9.0-rc.1 (2026-03-24); first stable: 1.9.0 (2026-04-01).",
        "measured": true,
        "numbers": [
            {
                "label": "Author-pasted test run (earlier revision of the test)",
                "value": "OK (1 test, 28 assertions), 2274 ms",
                "source": "PR #10925 comment by Ujjwaljain16, 2025-12-10 (not re-run)"
            },
            {
                "label": "Assertions in the merged test",
                "value": "12",
                "source": "gh pr diff 10925, testMFARecoveryCodeChallenge"
            },
            {
                "label": "Change size",
                "value": "+87 / -4 lines, 2 files",
                "source": "gh pr view 10925 --repo appwrite/appwrite --json additions,deletions"
            },
            {
                "label": "Fix contained in 1.8.1",
                "value": "no (compare status: diverged, 801 ahead / 29 behind; Challenges/Update.php at 1.8.1 still uses \\strtolower)",
                "source": "gh api repos/appwrite/appwrite/compare/35fe622...1.8.1 and file at tag 1.8.1"
            },
            {
                "label": "First tag containing the fix",
                "value": "1.9.0-rc.1 (2026-03-24); first stable release 1.9.0 (2026-04-01)",
                "source": "gh api repos/appwrite/appwrite/compare/35fe622...1.9.0-rc.1 (ahead) and .../1.9.0 (ahead)"
            }
        ],
        "verdict": "adopted",
        "evidence": [
            {
                "type": "pr",
                "label": "appwrite/appwrite/pull/10925",
                "href": "https://github.com/appwrite/appwrite/pull/10925",
                "note": "Merged PR: description states the root cause, review thread shows the maintainer's requests (reuse session, return 201, run formatter)."
            },
            {
                "type": "issue",
                "label": "appwrite/appwrite/issues/10740",
                "href": "https://github.com/appwrite/appwrite/issues/10740",
                "note": "Bug report with the log line, and the contributor's root-cause comment dated 2025-12-06 before any code was written."
            },
            {
                "type": "commit",
                "label": "35fe622",
                "href": "https://github.com/appwrite/appwrite/commit/35fe622548c1dfb0de02ae7847c3e14d5ea0f56c",
                "note": "Merge commit (two parents, committed by the maintainer) on 2025-12-11; subject 'Merge pull request #10925 from Ujjwaljain16/fix-10740-mfa-recovery-code-validation'."
            },
            {
                "type": "file",
                "label": "account.php@1.8.0",
                "href": "https://github.com/appwrite/appwrite/blob/1.8.0/app/controllers/api/account.php",
                "note": "Lines 4945 and 4967 hold the two \\strtolower(Type::RECOVERY_CODE) uses; line 4658 shows the factor whitelist uses the unmodified constant."
            },
            {
                "type": "test",
                "label": "AccountCustomClientTest.php::testMFARecoveryCodeChallenge",
                "href": "https://github.com/appwrite/appwrite/blob/HEAD/tests/e2e/Services/Account/AccountCustomClientTest.php",
                "note": "Regression test added by the PR."
            },
            {
                "type": "file",
                "label": "Challenges/Update.php@1.8.1",
                "href": "https://github.com/appwrite/appwrite/blob/1.8.1/src/Appwrite/Platform/Modules/Account/Http/Account/MFA/Challenges/Update.php",
                "note": "Lines 112 and 134 still use \\strtolower(Type::RECOVERY_CODE): the bug is present in 1.8.1 after the code moved out of account.php."
            },
            {
                "type": "file",
                "label": "Challenges/Update.php@1.9.0-rc.1",
                "href": "https://github.com/appwrite/appwrite/blob/1.9.0-rc.1/src/Appwrite/Platform/Modules/Account/Http/Account/MFA/Challenges/Update.php",
                "note": "Lines 113 and 135 compare against Type::RECOVERY_CODE directly: first tag with the fix (published 2026-03-24)."
            }
        ],
        "verification": "Ran gh pr view/diff/comments and gh api for PR 10925 and issue 10740; downloaded app/controllers/api/account.php and Type.php at tag 1.8.0 through the GitHub contents API and read the challenge-creation and verification handlers; ran gh api compare between 35fe622 and tags 1.8.1 and 1.9.0; read release dates for 1.8.1 and 1.9.0. Did not run the Appwrite E2E suite. Commit existence was checked through the GitHub API (repos/appwrite/appwrite/commits/<sha>), not with a local clone, because the repository is large."
    },
    {
        "id": "migratedb-stale-lock-after-kill",
        "kind": "investigation",
        "project": "migrateDB",
        "projectId": "migratedb",
        "title": "A migration process killed mid-run leaves the lock row and blocks every later run",
        "date": "2025-12-03",
        "dateSource": "version examined: 1.0.1 (npm publish 2025-12-03); the same lock code is in 1.0.0 (2025-11-22); reproduced 2026-09-28",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "question": "What happens to the single-row lock if a migrating process dies before it can release the lock?",
        "method": "Installed @ujjwaljain16/migratedb 1.0.1 and better-sqlite3 in an empty project (Node 22.19.0). A child process ran migrate() on a SQLite file with a migration that runs a long recursive query. The parent sent SIGKILL after 1.5 s, read migratedb_lock, then called migrate() twice on the same file. The run was repeated in a second fresh install with the same outcome. The 1.0.0 tarball contains a byte-identical MigrationLock.js.",
        "result": "The lock row remained after the kill. Both later attempts failed at once (about 1 to 2 ms, no waiting or retry) with LockError 'Failed to acquire migration lock: UNIQUE constraint failed: migratedb_lock.id'. A lock row dated 30 days earlier gave the same error, because the code never reads acquired_at. Recovery is to delete the row by hand or to run with enableLocking set to false, which skips locking (checked on SQLite). The text differs by engine: from reading the code, Postgres would report 'Migration is already running'; that path was not run.",
        "measured": true,
        "numbers": [
            {
                "label": "lock rows after SIGKILL",
                "value": "1 row: id=1, acquired_at set",
                "source": "reproduction script on SQLite, Node 22.19.0, package 1.0.1"
            },
            {
                "label": "time to fail on next run",
                "value": "about 1 to 2 ms per attempt (no wait, no retry)",
                "source": "same run, repeated in a second fresh install"
            },
            {
                "label": "lock age check",
                "value": "none (checkLockAge returns 0; the lockTimeout constructor argument is unused)",
                "source": "dist/cjs/core/MigrationLock.js in @ujjwaljain16/migratedb 1.0.1"
            }
        ],
        "verdict": "rejected",
        "evidence": [
            {
                "type": "file",
                "label": "dist/cjs/core/MigrationLock.js in @ujjwaljain16/migratedb 1.0.1",
                "href": "https://unpkg.com/@ujjwaljain16/migratedb@1.0.1/dist/cjs/core/MigrationLock.js",
                "note": "acquire() inserts one row with id=1; checkLockAge() returns 0, the lockTimeout argument is unused, and no code path removes a stale row"
            },
            {
                "type": "benchmark",
                "label": "Reproduction: SIGKILL during migrate(), then two more migrate() calls (Node 22.19.0, better-sqlite3)",
                "note": "Steps are in the method field; the script is not published. Attach it inline or as a gist if a link is wanted."
            },
            {
                "type": "doc",
                "label": "npm registry entry for @ujjwaljain16/migratedb",
                "href": "https://registry.npmjs.org/@ujjwaljain16%2fmigratedb",
                "note": "publish times: 1.0.0 on 2025-11-22, 1.0.1 on 2025-12-03"
            }
        ],
        "verification": "Ran crash.js myself (SQLite only). Postgres and MySQL not run; the lock SQL is identical for all engines, so the behaviour follows from the code. Attribution: The reproduction and write-up were produced during a 2026-09-28 audit (AI-assisted), not by the author at the time; the code examined is the author's published package."
    },
    {
        "id": "migratedb-dfs-depends-ordering",
        "kind": "decision",
        "project": "migrateDB",
        "projectId": "migratedb",
        "title": "Migration order comes from '-- DEPENDS:' comments, resolved by DFS with cycle detection",
        "date": "2025-11-22",
        "dateSource": "file in package v1.0.0 (npm publish 2025-11-22), byte-identical in v1.0.1; the decision itself predates the first release",
        "provenance": "reconstructed",
        "rationaleSource": "inferred",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "Files are normally applied in filename order. A migration that needs a table created by a later-named file needs an explicit way to say so.",
        "decision": "MigrationEngine.loadMigrationFiles sorts files by name (localeCompare), then DependencyResolver.resolveDependencies walks them in that order. It first throws a ValidationError if a listed dependency has no matching file. For each file it then places the names listed in '-- DEPENDS:' or '-- DEPENDS ON:' first, by recursion (post-order depth-first search), tracking a 'resolving' set to detect cycles and a 'resolved' set to skip repeats. A code comment labels this 'Topological sort'. The resolver is loaded with a lazy require inside the engine, marked with an eslint-disable comment. No commit or doc gives the reason for the design; the reason in the context is inferred.",
        "alternatives": [
            {
                "option": "Filename ordering only",
                "whyNot": "Needs no metadata but cannot place a migration after a later-named file without renaming. The repo does not record any other approach being weighed."
            }
        ],
        "consequences": "Reproduced on 1.0.1 with SQLite: files 01_c (DEPENDS: 03_a), 02_b and 03_a were applied as 03_a, 01_c, 02_b. A two-file cycle throws 'Circular dependency detected involving migration: 01_x.sql', naming only the first file reached, not the cycle path. The applied-history check compares database rows (read ORDER BY name) with the name-sorted file list, so DEPENDS reordering does not break later runs. That check does reject any new file that sorts before an applied one, with or without DEPENDS: adding 00_z.sql after the runs above fails with 'Migrations mismatch: found 01_c.sql in the DB but the next script in the filesystem is 00_z.sql.'",
        "status": "adopted",
        "evidence": [
            {
                "type": "file",
                "label": "dist/cjs/core/DependencyResolver.js in @ujjwaljain16/migratedb 1.0.1",
                "href": "https://unpkg.com/@ujjwaljain16/migratedb@1.0.1/dist/cjs/core/DependencyResolver.js",
                "note": "resolveMigration with resolving and resolved sets; validateDependencies throws on a missing file; comment 'Topological sort'; identical in 1.0.0"
            },
            {
                "type": "file",
                "label": "dist/cjs/core/MigrationEngine.js in @ujjwaljain16/migratedb 1.0.1 (loadMigrationFiles, validateMigrations)",
                "href": "https://unpkg.com/@ujjwaljain16/migratedb@1.0.1/dist/cjs/core/MigrationEngine.js",
                "note": "sorts by name, then resolveDependencies via lazy require; validateMigrations compares applied rows with the name-sorted list"
            },
            {
                "type": "doc",
                "label": "npm registry: @ujjwaljain16/migratedb 1.0.0 published 2025-11-22, 1.0.1 published 2025-12-03",
                "href": "https://registry.npmjs.org/@ujjwaljain16%2fmigratedb",
                "note": "earliest public dates; the date on this record is the first release, not the day the decision was made"
            }
        ],
        "verification": "Read the compiled resolver; installed the v1.0.1 tarball with better-sqlite3 in a temporary directory and ran migrate() on temporary directories (order, cycle); output pasted in the numbers of the investigation records. Attribution: Whether it was AI-assisted cannot be determined from the tarball. The reproduction was run during a 2026-09-28 audit."
    },
    {
        "id": "lazy-embedding-model-after-render-oom",
        "kind": "decision",
        "project": "Fuze",
        "projectId": "fuze",
        "title": "Load the embedding model on first use, not at import, after OOM on a 512 MB host",
        "date": "2025-11-15",
        "dateSource": "commit 2fe5988 (follow-ups 33419b4 and 7fb60ed the same morning)",
        "provenance": "recorded",
        "rationaleSource": "stated",
        "origin": "personal",
        "authors": [
            "Ujjwaljain16"
        ],
        "featured": false,
        "context": "The Flask backend was deployed on Render, whose free web service has a 512 MB memory limit (stated in 2fe5988). utils/embedding_utils.py built the SentenceTransformer at import time (embedding_model = get_embedding_model()), and UnifiedDataLayer and the recommendations blueprint loaded it again at start-up. The commit messages describe out-of-memory failures at start-up and, in the following commits, gunicorn not binding its port in time for Render's health check; no deploy logs are in the repository.",
        "decision": "Move model loading from import time to first use. get_embedding() calls get_embedding_model() on the first request that needs a vector (2fe5988). UnifiedDataLayer.embedding_model became a lazy property and the recommendations blueprint stopped loading it (33419b4). UniversalSemanticMatcher was made lazy and a bare root endpoint was added so gunicorn binds immediately (7fb60ed). Gunicorn workers went from 2 to 1 in Procfile and render.yaml (33419b4). Only the model weights are deferred: embedding_utils.py still imports sentence_transformers at module level. At HEAD the loader is a double-checked singleton behind a threading.RLock, with a DISABLE_EMBEDDINGS switch and a hash-based FallbackEmbeddingModel (384 dimensions, SHA-256 bag of words) when no real model loads.",
        "alternatives": [
            {
                "option": "Keep eager loading at import (the previous behaviour)",
                "whyNot": "2fe5988 says it exceeds the 512 MB limit at start-up."
            },
            {
                "option": "Put a smaller model first in the fallback list (paraphrase-MiniLM-L3-v2, about 60 MB, ahead of all-MiniLM-L6-v2)",
                "whyNot": "Tried in 2fe5988 and reverted within four minutes in 583c5c4, which restores all-MiniLM-L6-v2 first and says the embeddings are unchanged; lazy loading alone was kept."
            },
            {
                "option": "Keep two gunicorn workers",
                "whyNot": "33419b4 halves workers to save an estimated 200-300 MB (an estimate in the commit message, not a measurement)."
            }
        ],
        "consequences": "Start-up no longer loads the model weights, and the port can bind quickly. The first embedding request pays the load; a code comment in 2fe9f50 expects '~6-7 seconds the first time', an expectation rather than a measurement. HEAD's get_embedding_model() first tries utils.production_optimizations.get_cached_embedding_model, a module that exists in no commit of any branch, so that branch always falls through its try/except. One test (backend/tests/test_utils.py) checks that repeated calls return the same object; nothing checks that importing the module leaves the model unloaded. Hugging Face Spaces work with 16 GB RAM (docs/DEPLOYMENT.md) began about a week later (first commit 1befff3, 2025-11-23), which removed the memory limit behind this change; that it ended the OOM problem is an inference.",
        "status": "adopted",
        "evidence": [
            {
                "type": "commit",
                "label": "2fe5988",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/2fe5988",
                "note": "Message states the 512 MB limit and removes the import-time embedding_model = get_embedding_model()."
            },
            {
                "type": "commit",
                "label": "33419b4",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/33419b4",
                "note": "Lazy property on UnifiedDataLayer; Procfile and render.yaml workers 2 to 1."
            },
            {
                "type": "commit",
                "label": "583c5c4",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/583c5c4",
                "note": "Smaller-model-first ordering reverted within minutes; lazy loading kept."
            },
            {
                "type": "commit",
                "label": "7fb60ed",
                "href": "https://github.com/Ujjwaljain16/Fuze/commit/7fb60ed",
                "note": "UniversalSemanticMatcher made lazy so gunicorn can bind for Render health checks."
            },
            {
                "type": "file",
                "label": "embedding_utils.py@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/backend/utils/embedding_utils.py",
                "note": "RLock singleton, DISABLE_EMBEDDINGS, FallbackEmbeddingModel; import of utils.production_optimizations that does not exist."
            },
            {
                "type": "file",
                "label": "test_utils.py@491a221",
                "href": "https://github.com/Ujjwaljain16/Fuze/blob/491a221/backend/tests/test_utils.py",
                "note": "test_get_embedding_model_singleton: the only test of the singleton; does not check import-time behaviour."
            }
        ],
        "verification": "Read commit messages and diffs of 2fe5988, 583c5c4, 33419b4, 7fb60ed, f360bba; read embedding_utils.py at HEAD; ran git log --all --name-only and searched for production_optimizations (only two .md summary files match, no .py); ran tests/test_embedding_utils.py (passes, 3 tests, none about lazy loading). Attribution: Authored by Ujjwaljain16; none of the cited commits carries a Claude co-author trailer."
    }
];

export const decisions = records.filter((r) => r.kind === "decision");
export const investigations = records.filter((r) => r.kind === "investigation");

export function getRecord(id: string): EngineeringRecord | undefined {
    return records.find((r) => r.id === id);
}
