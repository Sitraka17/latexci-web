-- Cookieless counter of latexci.com (2026-11-25), see lib/counter.ts.
-- One row = a daily total (Luxembourg day) per event type, page, short target
-- and referrer host. No cookie, IP, User-Agent or identifier is stored.
CREATE TABLE IF NOT EXISTS ev (
  day    TEXT    NOT NULL,
  type   TEXT    NOT NULL,
  page   TEXT    NOT NULL,
  target TEXT    NOT NULL DEFAULT '',
  ref    TEXT    NOT NULL DEFAULT '',
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, type, page, target, ref)
);
CREATE INDEX IF NOT EXISTS ev_type_day ON ev (type, day);
