-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_workspace_tables
-- Created  : 2025-07-01
-- Schema   : fortress (PostgreSQL — lkvipgroup-portal)
-- Purpose  : Replaces JSON flat-file (workspace-db.ts) with proper relational
--            tables. Preserves all existing WorkspaceSprint / WorkspaceTask /
--            WorkspaceComment logic — only storage layer changes.
-- ─────────────────────────────────────────────────────────────────────────────

-- fortress_workspace_sprints
CREATE TABLE "fortress_workspace_sprints" (
    "id"        SERIAL          NOT NULL,
    "name"      VARCHAR(200)    NOT NULL,
    "project"   VARCHAR(100)    NOT NULL DEFAULT 'all',
    "startDate" VARCHAR(20)     NOT NULL,
    "endDate"   VARCHAR(20)     NOT NULL,
    "goal"      TEXT,
    "status"    VARCHAR(20)     NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3)  NOT NULL,

    CONSTRAINT "fortress_workspace_sprints_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fortress_workspace_sprints_status_idx"  ON "fortress_workspace_sprints"("status");
CREATE INDEX "fortress_workspace_sprints_project_idx" ON "fortress_workspace_sprints"("project");

-- fortress_workspace_tasks
CREATE TABLE "fortress_workspace_tasks" (
    "id"           SERIAL          NOT NULL,
    "title"        VARCHAR(500)    NOT NULL,
    "description"  TEXT,
    "project"      VARCHAR(100)    NOT NULL DEFAULT 'hub',
    "status"       VARCHAR(20)     NOT NULL DEFAULT 'todo',
    "priority"     VARCHAR(20)     NOT NULL DEFAULT 'medium',
    "assigneeId"   INTEGER,
    "assigneeName" VARCHAR(200),
    "sprintId"     INTEGER,
    "dueDate"      VARCHAR(20),
    "completedAt"  TIMESTAMPTZ(3),
    "completedBy"  INTEGER,
    "tags"         TEXT[]          NOT NULL DEFAULT '{}',
    "result"       TEXT,
    "createdBy"    INTEGER,
    "createdAt"    TIMESTAMPTZ(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMPTZ(3)  NOT NULL,

    CONSTRAINT "fortress_workspace_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fortress_workspace_tasks_status_idx"     ON "fortress_workspace_tasks"("status");
CREATE INDEX "fortress_workspace_tasks_project_idx"    ON "fortress_workspace_tasks"("project");
CREATE INDEX "fortress_workspace_tasks_sprintId_idx"   ON "fortress_workspace_tasks"("sprintId");
CREATE INDEX "fortress_workspace_tasks_priority_idx"   ON "fortress_workspace_tasks"("priority");
CREATE INDEX "fortress_workspace_tasks_assigneeId_idx" ON "fortress_workspace_tasks"("assigneeId");

ALTER TABLE "fortress_workspace_tasks"
    ADD CONSTRAINT "fortress_workspace_tasks_sprintId_fkey"
    FOREIGN KEY ("sprintId")
    REFERENCES "fortress_workspace_sprints"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- fortress_workspace_comments
CREATE TABLE "fortress_workspace_comments" (
    "id"         SERIAL          NOT NULL,
    "taskId"     INTEGER         NOT NULL,
    "authorId"   INTEGER,
    "authorName" VARCHAR(200),
    "content"    TEXT            NOT NULL,
    "createdAt"  TIMESTAMPTZ(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMPTZ(3)  NOT NULL,

    CONSTRAINT "fortress_workspace_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fortress_workspace_comments_taskId_idx" ON "fortress_workspace_comments"("taskId");

ALTER TABLE "fortress_workspace_comments"
    ADD CONSTRAINT "fortress_workspace_comments_taskId_fkey"
    FOREIGN KEY ("taskId")
    REFERENCES "fortress_workspace_tasks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
