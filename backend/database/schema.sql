-- ============================================================================
-- schema.sql
--
-- Reference SQL schema for the LearnTwin AI Professor database.
-- This file is for DOCUMENTATION purposes — the actual tables are created
-- automatically by SQLAlchemy (see database/db.py -> init_db()) when the
-- FastAPI app starts up. This file simply shows what those tables look
-- like in plain SQL, and is handy if you want to inspect/recreate the
-- schema manually with the `sqlite3` CLI.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: students
-- Stores registered student accounts.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id        VARCHAR UNIQUE NOT NULL,   -- public UUID, used in JWT + API
    full_name         VARCHAR NOT NULL,
    email             VARCHAR UNIQUE NOT NULL,
    hashed_password   VARCHAR NOT NULL,          -- bcrypt hash, never plain text
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_students_student_id ON students (student_id);
CREATE INDEX IF NOT EXISTS ix_students_email ON students (email);


-- ----------------------------------------------------------------------------
-- Table: lectures
-- Stores metadata + processing status for every uploaded file.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lectures (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    lecture_id             VARCHAR UNIQUE NOT NULL,   -- public UUID
    student_id             VARCHAR NOT NULL,          -- FK -> students.student_id

    filename               VARCHAR NOT NULL,
    file_type              VARCHAR NOT NULL,          -- 'pdf' | 'docx' | 'pptx'
    file_size_kb           INTEGER,
    page_count             INTEGER,                   -- NULL when not applicable (e.g. some DOCX)

    upload_time            DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status      VARCHAR DEFAULT 'Uploading',  -- Uploading | Extracting | Completed | Failed
    extracted_text_path    VARCHAR,                   -- path to /extracted_text/{lecture_id}.txt
    error_message          TEXT,                       -- populated only if processing_status = 'Failed'

    FOREIGN KEY (student_id) REFERENCES students (student_id)
);

CREATE INDEX IF NOT EXISTS ix_lectures_lecture_id ON lectures (lecture_id);
CREATE INDEX IF NOT EXISTS ix_lectures_student_id ON lectures (student_id);

-- ============================================================================
-- Entity Relationship Summary
-- ============================================================================
--   students (1) ────────< (many) lectures
--
--   One student can upload many lectures.
--   Each lecture belongs to exactly one student (student_id FK).
-- ============================================================================
