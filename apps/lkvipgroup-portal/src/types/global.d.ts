/**
 * global.d.ts — Khai báo kiểu toàn cục cho lkvipgroup-portal.
 *
 * Bao gồm:
 *   - Khai báo module CSS thuần (side-effect import như `import "./globals.css"`)
 *   - WorkspaceStats: kiểu dữ liệu trả về từ getDashboardStats() trong workspace-db.ts
 */

// Khai báo cho side-effect import CSS thuần (ví dụ: import "./globals.css")
// Không phải CSS Module — chỉ cần TypeScript bỏ qua lỗi TS2882.
declare module "*.css" {
  const _: never;
  export default _;
}

// ── WorkspaceStats ────────────────────────────────────────────────────────────
// Phản ánh đúng shape trả về từ getDashboardStats() trong src/lib/workspace-db.ts.
// Không dùng type assertion — được suy ra trực tiếp từ logic của hàm.

interface SprintProgressInfo {
  sprint: {
    id:        number;
    name:      string;
    project:   string;
    startDate: string;
    endDate:   string;
    goal:      string | null;
    status:    string;
    createdAt: Date;
    updatedAt: Date;
  };
  total:    number;
  done:     number;
  progress: number;
}

interface WorkspaceStats {
  total:          number;
  todo:           number;
  inProgress:     number;
  done:           number;
  overdue:        number;
  dueSoon:        number;
  sprintProgress: SprintProgressInfo | null;
  recentDone:     {
    id:          number;
    title:       string;
    completedAt: Date | null;
    [key: string]: unknown;
  }[];
  velocity: { day: string; count: number }[];
}
