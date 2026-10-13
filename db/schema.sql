-- Remember Word — PostgreSQL schema (รันซ้ำได้ ไม่ลบข้อมูลเดิม)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS words (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word          TEXT NOT NULL,
  meaning       TEXT NOT NULL,
  example       TEXT,
  box           SMALLINT NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  next_review   DATE,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- คำเดียวกัน (ไม่สนตัวพิมพ์เล็ก/ใหญ่) เพิ่มซ้ำไม่ได้
CREATE UNIQUE INDEX IF NOT EXISTS uq_words_user_word ON words (user_id, lower(word));
CREATE INDEX IF NOT EXISTS idx_words_review ON words (user_id, next_review);

CREATE TABLE IF NOT EXISTS daily_sets (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_date   DATE NOT NULL,
  word_ids    INT[] NOT NULL,
  score       SMALLINT,
  finished_at TIMESTAMPTZ,
  UNIQUE (user_id, quiz_date)
);

CREATE TABLE IF NOT EXISTS answers (
  id           SERIAL PRIMARY KEY,
  daily_set_id INT NOT NULL REFERENCES daily_sets(id) ON DELETE CASCADE,
  word_id      INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  user_answer  TEXT,
  is_correct   BOOLEAN NOT NULL,
  answered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (daily_set_id, word_id)
);
