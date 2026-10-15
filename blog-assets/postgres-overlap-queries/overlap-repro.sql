-- Reproduction for the post "My Postgres Overlap Query Scanned 200,000 Bookings".
-- Sections 2, 4 and 5: the two-comparison query, the range query, the GiST index, and the bind-parameter experiment.
-- Run ONLY against a throwaway PostgreSQL 17 database: it creates and drops a table named bookings.
--   docker run -d --name pg-overlap -e POSTGRES_PASSWORD=x -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17
--   docker exec -i pg-overlap psql -U postgres < overlap-repro.sql

\set QUIET on
CREATE EXTENSION IF NOT EXISTS btree_gist;
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
  id bigserial PRIMARY KEY,
  room_id int NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
);
ALTER TABLE bookings ADD CONSTRAINT ex_bookings_no_overlap
  EXCLUDE USING gist (room_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&) WHERE (status = 'confirmed');
-- 200,000 non-overlapping bookings over 6 rooms, 6 one-hour slots... starting 2020-01-01
INSERT INTO bookings (room_id, start_time, end_time)
SELECT (g % 6) + 1,
       timestamptz '2020-01-01 08:00+00' + (g / 6) * interval '1 hour',
       timestamptz '2020-01-01 08:00+00' + (g / 6) * interval '1 hour' + interval '50 minutes'
FROM generate_series(0, 199999) g;
ANALYZE bookings;
SELECT max(end_time) AS last_booking_ends FROM bookings;
\echo ---- A) two comparisons, a period AFTER all the data ("a free slot, recent")
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed'
  AND start_time < timestamptz '2092-03-01 08:30+00' AND end_time > timestamptz '2092-03-01 08:20+00' LIMIT 1;
\echo ---- B) range overlap, bounds written in the SQL text
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed'
  AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2092-03-01 08:20+00', timestamptz '2092-03-01 08:30+00', '[)') LIMIT 1;
\echo ---- C) day view, no room, two comparisons
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM bookings WHERE start_time < timestamptz '2092-03-02 00:00+00' AND end_time > timestamptz '2092-03-01 00:00+00';
\echo ---- D) day view, range overlap, no index on the range yet
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2092-03-01 00:00+00', timestamptz '2092-03-02 00:00+00', '[)');
CREATE INDEX ix_bookings_time_range ON bookings USING gist (tstzrange(start_time, end_time, '[)'));
ANALYZE bookings;
\echo ---- E) day view, range overlap, WITH the GiST index
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2092-03-01 00:00+00', timestamptz '2092-03-02 00:00+00', '[)');
\echo ---- F) a period inside the data, two comparisons (matches half the table)
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT * FROM bookings WHERE start_time < timestamptz '2030-03-02 00:00+00' AND end_time > timestamptz '2030-03-01 00:00+00';
\echo ---- G) bounds as a bind parameter, generic plan forced
SET plan_cache_mode = force_generic_plan;
PREPARE q(timestamptz, timestamptz, text) AS
  SELECT * FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange($1, $2, $3);
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) EXECUTE q('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
DEALLOCATE q;
\echo ---- H) same, but bounds typed in the SQL text, generic plan forced
PREPARE q2(timestamptz, timestamptz) AS
  SELECT * FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange($1, $2, '[)');
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) EXECUTE q2('2092-03-01 00:00+00', '2092-03-02 00:00+00');
\set QUIET on
\echo ---- I) STORED-side bounds as a bind parameter, generic plan forced
SET plan_cache_mode = force_generic_plan;
PREPARE qi(timestamptz, timestamptz, text) AS
  SELECT * FROM bookings WHERE tstzrange(start_time, end_time, $3) && tstzrange($1, $2, '[)');
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) EXECUTE qi('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
DEALLOCATE qi;
\echo ---- J) same statement, default plan_cache_mode, executed 8 times (plan of the 8th)
RESET plan_cache_mode;
PREPARE qj(timestamptz, timestamptz, text) AS
  SELECT * FROM bookings WHERE tstzrange(start_time, end_time, $3) && tstzrange($1, $2, '[)');
EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF, SUMMARY OFF) EXECUTE qj('2092-03-01 00:00+00', '2092-03-02 00:00+00', '[)');
