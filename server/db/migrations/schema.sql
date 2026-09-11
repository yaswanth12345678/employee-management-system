-- =========================================================================
-- EMS database schema (PostgreSQL 14+)
-- Apply once on an empty database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f server/db/migrations/schema.sql
-- =========================================================================

-- ── Extensions & shared helpers ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Enumerated types (stable, code-controlled value sets) ────────────────
CREATE TYPE employment_status AS ENUM ('probation','active','on_leave','terminated');
CREATE TYPE project_status     AS ENUM ('planning','active','on_hold','completed','cancelled');
CREATE TYPE task_status        AS ENUM ('todo','in_progress','in_review','blocked','done');
CREATE TYPE priority_level     AS ENUM ('low','medium','high','critical');
CREATE TYPE attendance_status  AS ENUM ('present','absent','late','half_day','remote');
CREATE TYPE leave_type         AS ENUM ('annual','sick','casual','unpaid','maternity','paternity');
CREATE TYPE leave_status       AS ENUM ('pending','approved','rejected','cancelled');
CREATE TYPE notification_type  AS ENUM
  ('task_assigned','task_updated','leave_status','project_update','mention','system');

-- ── roles (lookup table — carries metadata, referenced by FK) ────────────
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── users (authentication identity) ──────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT NOT NULL UNIQUE,
  password_hash TEXT   NOT NULL,
  role_id       UUID   NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  token_version INTEGER NOT NULL DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role_id ON users(role_id);

-- ── departments (head_id FK added after employees exists) ────────────────
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  head_id     UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── employees (HR profile — 1:1 with users, self-ref manager hierarchy) ──
CREATE TABLE employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  first_name    VARCHAR(80) NOT NULL,
  last_name     VARCHAR(80) NOT NULL,
  phone         VARCHAR(20),
  job_title     VARCHAR(120),
  department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
  manager_id    UUID REFERENCES employees(id)   ON DELETE SET NULL,
  status        employment_status NOT NULL DEFAULT 'probation',
  hire_date     DATE NOT NULL,
  date_of_birth DATE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_emp_manager_not_self CHECK (manager_id IS NULL OR manager_id <> id)
);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_manager_id    ON employees(manager_id);
CREATE INDEX idx_employees_status        ON employees(status);

-- Sequence for auto-generating employee codes (EMP-00002, …). Admin keeps EMP-00001.
CREATE SEQUENCE employee_code_seq START WITH 2 INCREMENT BY 1;

-- Resolve the circular dependency: departments.head_id -> employees.id
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_head
  FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL;
CREATE INDEX idx_departments_head_id ON departments(head_id);

-- ── projects ─────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               VARCHAR(20) NOT NULL UNIQUE,
  name               VARCHAR(160) NOT NULL,
  description        TEXT,
  department_id      UUID REFERENCES departments(id) ON DELETE SET NULL,
  project_manager_id UUID REFERENCES employees(id)   ON DELETE RESTRICT,
  status             project_status NOT NULL DEFAULT 'planning',
  priority           priority_level NOT NULL DEFAULT 'medium',
  start_date         DATE,
  end_date           DATE,
  budget             NUMERIC(14,2),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_project_dates
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_projects_department_id ON projects(department_id);
CREATE INDEX idx_projects_manager_id    ON projects(project_manager_id);
CREATE INDEX idx_projects_status        ON projects(status);

-- ── project_members (M:N junction — projects <-> employees) ──────────────
CREATE TABLE project_members (
  project_id      UUID NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role_on_project VARCHAR(80),
  allocated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, employee_id)
);
CREATE INDEX idx_project_members_employee_id ON project_members(employee_id);

-- ── tasks (belongs to a project; optional subtask self-ref) ──────────────
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id  UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  assignee_id     UUID REFERENCES employees(id) ON DELETE SET NULL,
  reporter_id     UUID REFERENCES employees(id) ON DELETE SET NULL,
  status          task_status    NOT NULL DEFAULT 'todo',
  priority        priority_level NOT NULL DEFAULT 'medium',
  due_date        DATE,
  estimated_hours NUMERIC(6,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_task_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0)
);
CREATE INDEX idx_tasks_project_id     ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id    ON tasks(assignee_id);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

-- ── comments (scoped FK to tasks — NOT polymorphic) ──────────────────────
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_comment_body CHECK (length(btrim(body)) > 0)
);
CREATE INDEX idx_comments_task_id   ON comments(task_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- ── attendance (one row per employee per day) ────────────────────────────
CREATE TABLE attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date    DATE NOT NULL,
  check_in_at  TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  status       attendance_status NOT NULL DEFAULT 'present',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_attendance_per_day UNIQUE (employee_id, work_date),
  CONSTRAINT chk_attendance_times
    CHECK (check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at)
);

-- ── leave_requests (an approval workflow) ────────────────────────────────
CREATE TABLE leave_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type        leave_type   NOT NULL,
  status      leave_status NOT NULL DEFAULT 'pending',
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT,
  approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  decided_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);
CREATE INDEX idx_leave_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_status      ON leave_requests(status);
CREATE INDEX idx_leave_approver_id ON leave_requests(approver_id);

-- ── notifications (recipient = a user; entity_* is a deliberate soft ref) ─
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(200) NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  entity_type VARCHAR(40),
  entity_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at     TIMESTAMPTZ
);
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_all
  ON notifications(user_id, created_at DESC);

-- ── password_reset_tokens (surfaced by the forgot/reset-password flow) ───
CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prt_user_id    ON password_reset_tokens(user_id);
CREATE INDEX idx_prt_token_hash ON password_reset_tokens(token_hash);

-- ── user_settings (1:1 with users; preferences for the Settings module) ──
CREATE TABLE user_settings (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme                VARCHAR(10) NOT NULL DEFAULT 'system',
  locale               VARCHAR(10) NOT NULL DEFAULT 'en',
  email_notifications  BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_theme CHECK (theme IN ('light','dark','system'))
);

-- ── chat (direct-message conversations between users) ────────────────────
CREATE TABLE chat_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_chat_pair CHECK (user_low < user_high),
  CONSTRAINT uq_chat_pair UNIQUE (user_low, user_high)
);
CREATE INDEX idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(conversation_id, sender_id)
  WHERE read_at IS NULL;

-- ── updated_at triggers ──────────────────────────────────────────────────
CREATE TRIGGER trg_users_updated              BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_departments_updated        BEFORE UPDATE ON departments        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employees_updated          BEFORE UPDATE ON employees          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_updated           BEFORE UPDATE ON projects           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated              BEFORE UPDATE ON tasks              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_comments_updated           BEFORE UPDATE ON comments           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_updated         BEFORE UPDATE ON attendance         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leave_requests_updated     BEFORE UPDATE ON leave_requests     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_settings_updated      BEFORE UPDATE ON user_settings       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_chat_conversations_updated   BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── seed reference data ──────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('admin',    'Full system access'),
  ('hr',       'Manages employees, departments, and leave'),
  ('manager',  'Manages projects, tasks, and team approvals'),
  ('employee', 'Standard employee access');

-- Default admin: admin@ems.local / Admin@12345
WITH admin_role AS (
  SELECT id FROM roles WHERE name = 'admin'
),
new_user AS (
  INSERT INTO users (email, password_hash, role_id)
  SELECT 'admin@ems.local', crypt('Admin@12345', gen_salt('bf', 12)), id FROM admin_role
  RETURNING id
)
INSERT INTO employees (user_id, employee_code, first_name, last_name, status, hire_date)
SELECT id, 'EMP-00001', 'System', 'Administrator', 'active', CURRENT_DATE FROM new_user;

INSERT INTO user_settings (user_id)
SELECT id FROM users WHERE email = 'admin@ems.local';
