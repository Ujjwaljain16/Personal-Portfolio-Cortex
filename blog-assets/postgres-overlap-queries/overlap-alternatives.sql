-- Section 3 of the post: five index designs for "does this slot overlap a confirmed booking in this room?"
-- (and two for the day view), probed early, in the middle and late in 200,000 generated bookings, as a free slot
-- and as a conflict. Every plan is labelled with an "##PROBE <design> <position> <free|conflict> <run>" line;
-- the second run of each is the warm one. Buffer hits are stable between runs; milliseconds are not.
-- The last statement (a reversed range) is meant to fail with "range lower bound must be less than or equal to range upper bound".
-- Run ONLY against a throwaway PostgreSQL 17 database: it creates and drops a table named bookings.
--   docker exec -i pg-overlap psql -U postgres < overlap-alternatives.sql

\set QUIET on
CREATE EXTENSION IF NOT EXISTS btree_gist;
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (id bigserial PRIMARY KEY, room_id int NOT NULL, start_time timestamptz NOT NULL, end_time timestamptz NOT NULL, status text NOT NULL DEFAULT 'confirmed', CONSTRAINT ck_end_after_start CHECK (end_time > start_time));
ALTER TABLE bookings ADD CONSTRAINT ex_bookings_no_overlap EXCLUDE USING gist (room_id WITH =, tstzrange(start_time, end_time, '[)') WITH &&) WHERE (status = 'confirmed');
INSERT INTO bookings (room_id, start_time, end_time)
SELECT (g % 6) + 1, timestamptz '2020-01-01 08:00+00' + (g / 6) * interval '1 hour', timestamptz '2020-01-01 08:00+00' + (g / 6) * interval '1 hour' + interval '50 minutes' FROM generate_series(0, 199999) g;
\echo ##VARIANT V0
DROP INDEX IF EXISTS v1, v2, v3;

ANALYZE bookings;
\echo ##PROBE V0 early free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V0 early free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V0 early conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V0 early conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V0 middle free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V0 middle free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V0 middle conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V0 middle conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V0 late free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V0 late free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V0 late conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V0 late conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##VARIANT V1
DROP INDEX IF EXISTS v1, v2, v3;
CREATE INDEX v1 ON bookings (room_id, end_time);
ANALYZE bookings;
\echo ##PROBE V1 early free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V1 early free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V1 early conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V1 early conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V1 middle free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V1 middle free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V1 middle conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V1 middle conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V1 late free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V1 late free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V1 late conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V1 late conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##VARIANT V2
DROP INDEX IF EXISTS v1, v2, v3;
CREATE INDEX v2 ON bookings (room_id, start_time, end_time);
ANALYZE bookings;
\echo ##PROBE V2 early free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V2 early free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V2 early conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V2 early conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V2 middle free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V2 middle free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V2 middle conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V2 middle conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V2 late free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V2 late free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' LIMIT 1;
\echo ##PROBE V2 late conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##PROBE V2 late conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' LIMIT 1;
\echo ##VARIANT V3
DROP INDEX IF EXISTS v1, v2, v3;
CREATE INDEX v3 ON bookings (room_id, start_time);
ANALYZE bookings;
\echo ##PROBE V3 early free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 early free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 early conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 early conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 middle free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 middle free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 middle conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 middle conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 late free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 late free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 late conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' - interval '1 day' LIMIT 1;
\echo ##PROBE V3 late conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND start_time < timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' AND start_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes' - interval '1 day' LIMIT 1;
\echo ##VARIANT V4
DROP INDEX IF EXISTS v1, v2, v3;

ANALYZE bookings;
\echo ##PROBE V4 early free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes', timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 early free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '52 minutes', timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '58 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 early conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes', timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 early conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '30 minutes', timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour' + interval '90 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 middle free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes', timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 middle free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '52 minutes', timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '58 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 middle conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes', timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 middle conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '30 minutes', timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour' + interval '90 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 late free run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes', timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 late free run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '52 minutes', timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '58 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 late conflict run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes', timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes', '[)') LIMIT 1;
\echo ##PROBE V4 late conflict run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT * FROM bookings WHERE room_id = 3 AND status = 'confirmed' AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '30 minutes', timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour' + interval '90 minutes', '[)') LIMIT 1;
\echo ##VARIANT D1
DROP INDEX IF EXISTS v1, v2, v3; DROP INDEX IF EXISTS vg; CREATE INDEX d1 ON bookings (end_time);
ANALYZE bookings;
\echo ##PROBE D1 early day run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE start_time < timestamptz '2020-01-01 08:00+00' + 124 * interval '1 hour' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour';
\echo ##PROBE D1 early day run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE start_time < timestamptz '2020-01-01 08:00+00' + 124 * interval '1 hour' AND end_time > timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour';
\echo ##PROBE D1 middle day run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE start_time < timestamptz '2020-01-01 08:00+00' + 16024 * interval '1 hour' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour';
\echo ##PROBE D1 middle day run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE start_time < timestamptz '2020-01-01 08:00+00' + 16024 * interval '1 hour' AND end_time > timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour';
\echo ##PROBE D1 late day run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE start_time < timestamptz '2020-01-01 08:00+00' + 33024 * interval '1 hour' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour';
\echo ##PROBE D1 late day run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE start_time < timestamptz '2020-01-01 08:00+00' + 33024 * interval '1 hour' AND end_time > timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour';
\echo ##VARIANT D2
DROP INDEX IF EXISTS d1; CREATE INDEX vg ON bookings USING gist (tstzrange(start_time, end_time, '[)'));
ANALYZE bookings;
\echo ##PROBE D2 early day run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour', timestamptz '2020-01-01 08:00+00' + 124 * interval '1 hour', '[)');
\echo ##PROBE D2 early day run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 100 * interval '1 hour', timestamptz '2020-01-01 08:00+00' + 124 * interval '1 hour', '[)');
\echo ##PROBE D2 middle day run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour', timestamptz '2020-01-01 08:00+00' + 16024 * interval '1 hour', '[)');
\echo ##PROBE D2 middle day run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 16000 * interval '1 hour', timestamptz '2020-01-01 08:00+00' + 16024 * interval '1 hour', '[)');
\echo ##PROBE D2 late day run1
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour', timestamptz '2020-01-01 08:00+00' + 33024 * interval '1 hour', '[)');
\echo ##PROBE D2 late day run2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY ON) SELECT count(*) FROM bookings WHERE tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + 33000 * interval '1 hour', timestamptz '2020-01-01 08:00+00' + 33024 * interval '1 hour', '[)');
\echo ##EDGE
SELECT 'zero-length probe, two comparisons' AS case, count(*) FROM bookings WHERE room_id = 3 AND start_time < timestamptz '2020-01-01 08:00+00' + interval '20 minutes' AND end_time > timestamptz '2020-01-01 08:00+00' + interval '20 minutes';
SELECT 'zero-length probe, range &&' AS case, count(*) FROM bookings WHERE room_id = 3 AND tstzrange(start_time, end_time, '[)') && tstzrange(timestamptz '2020-01-01 08:00+00' + interval '20 minutes', timestamptz '2020-01-01 08:00+00' + interval '20 minutes', '[)');
\echo ##EDGE reversed
SELECT tstzrange(timestamptz '2020-01-01 08:00+00' + interval '2 hours', timestamptz '2020-01-01 08:00+00', '[)');
