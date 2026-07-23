# 📘 HƯỚNG DẪN CHI TIẾT XÂY DỰNG ADMIN TỔNG TẬP ĐOÀN – LKVIP GROUP

Tài liệu này cung cấp **hướng dẫn toàn diện** cho backend và frontend để xây dựng giao diện quản trị tổng tập đoàn, phục vụ 5 dự án con (game, hub, sports, trade, dating) với khả năng tùy chỉnh theo từng project.

---

## 📌 1. TỔNG QUAN KIẾN TRÚC

```text
┌─────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                       │
│                   (admin.tc-gaming.live)                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │            React + Vite + TypeScript                 │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │ │
│  │  │   Layout   │  │  Routing  │  │   Store    │     │ │
│  │  └────────────┘  └────────────┘  └────────────┘     │ │
│  │  ┌────────────────────────────────────────────────┐  │ │
│  │  │            Modules (Game, Hub, ...)           │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Middlewares: auth, projectResolver, rateLimit       │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Project-specific controllers & services             │ │
│  │  (game, hub, sports, trade, dating)                 │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  Prisma multi-client factory                         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASES (6 MySQL instances)                  │
│  admin_db  │  game_db  │  hub_db  │  sports_db  │ trade_db │
│  dating_db                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 2. BACKEND – CẤU TRÚC & CODE CHI TIẾT

### 2.1. Thư mục backend

```text
backend/
├── prisma/
│   ├── admin/           # Schema cho admin_db
│   ├── game/            # Schema cho game_db
│   ├── hub/
│   ├── sports/
│   ├── trade/
│   └── dating/
├── src/
│   ├── config/
│   │   ├── database.ts      # Kết nối DB
│   │   ├── redis.ts
│   │   └── prisma-factory.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── projectResolver.ts
│   │   ├── rateLimiter.ts
│   │   └── errorHandler.ts
│   ├── modules/
│   │   ├── admin/           # Module quản trị chung
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── finance.controller.ts
│   │   │   │   ├── lottery.controller.ts   (cho game)
│   │   │   │   ├── agent.controller.ts
│   │   │   │   ├── promotion.controller.ts
│   │   │   │   └── settings.controller.ts
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   └── validators/
│   │   ├── game/            # Module riêng cho game (nếu cần)
│   │   └── ...
│   ├── shared/
│   │   ├── services/
│   │   │   ├── cache.service.ts
│   │   │   ├── logger.service.ts
│   │   │   └── ...
│   │   └── utils/
│   ├── app.ts
│   └── server.ts
├── ecosystem.config.js
├── .env
└── package.json
```

### 2.2. Prisma Multi-Client Factory

```typescript
// src/config/prisma-factory.ts
import { PrismaClient } from '@prisma/client';

const clients = new Map<string, PrismaClient>();

export const getPrismaClient = (project: string): PrismaClient => {
  if (!clients.has(project)) {
    const url = process.env[`${project.toUpperCase()}_DATABASE_URL`];
    if (!url) throw new Error(`No DATABASE_URL for project: ${project}`);
    const client = new PrismaClient({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['error'],
    });
    clients.set(project, client);
  }
  return clients.get(project)!;
};
```

### 2.3. Middleware: Project Resolver

```typescript
// src/middlewares/projectResolver.ts
import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../config/prisma-factory';

declare global {
  namespace Express {
    interface Request {
      project: string;
      db: PrismaClient;
    }
  }
}

export const projectResolver = (req: Request, res: Response, next: NextFunction) => {
  const project = req.headers['x-project'] || req.user?.project;
  if (!project) {
    return res.status(400).json({ error: 'Missing X-Project header' });
  }
  req.project = project;
  req.db = getPrismaClient(project);
  next();
};
```

### 2.4. Auth Controller (Login + Project List)

```typescript
// src/modules/admin/controllers/auth.controller.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { getPrismaClient } from '../../../config/prisma-factory';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const adminDb = getPrismaClient('admin');
  const user = await adminDb.user.findUnique({
    where: { username },
    include: { userProjects: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const projects = user.userProjects.map((up) => up.project);
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role, projects },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ token, projects, user: { id: user.id, username: user.username, role: user.role } });
};
```

### 2.5. Dashboard Controller (Thống kê)

```typescript
// src/modules/admin/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import { startOfDay, subDays, format } from 'date-fns';

export const getStats = async (req: Request, res: Response) => {
  const db = req.db; // từ projectResolver
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  // Ví dụ: lấy số user đăng ký hôm nay
  const newUsersToday = await db.user.count({
    where: { createdAt: { gte: today } },
  });

  const newUsersYesterday = await db.user.count({
    where: { createdAt: { gte: yesterday, lt: today } },
  });

  // Tổng nạp hôm nay
  const depositToday = await db.transaction.aggregate({
    where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: today } },
    _sum: { amount: true },
  });

  // Tương tự cho rút, cược, thưởng...

  const growth = newUsersYesterday > 0
    ? ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100
    : 0;

  res.json({
    newUsers: newUsersToday,
    newUsersGrowth: growth,
    deposits: depositToday._sum.amount || 0,
    // ...
  });
};
```

### 2.6. User Management Controller (Danh sách user)

```typescript
// src/modules/admin/controllers/user.controller.ts
export const getUsers = async (req: Request, res: Response) => {
  const db = req.db;
  const { page = 1, limit = 20, search, status, vipLevel } = req.query;

  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search as string } },
      { email: { contains: search as string } },
    ];
  }
  if (status) where.status = status;
  if (vipLevel) where.vipLevel = Number(vipLevel);

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        totalDeposit: true,
        totalBet: true,
        status: true,
        vipLevel: true,
        createdAt: true,
        lastLogin: true,
      },
    }),
    db.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};
```

---

## 🎨 3. FRONTEND – CẤU TRÚC & CODE CHI TIẾT

### 3.1. Thư mục frontend/admin-dashboard

```text
frontend/admin-dashboard/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── icons/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes.tsx
    ├── core/
    │   ├── api/
    │   │   ├── client.ts
    │   │   └── endpoints/
    │   │       ├── auth.ts
    │   │       ├── dashboard.ts
    │   │       ├── users.ts
    │   │       └── ...
    │   ├── auth/
    │   │   ├── AuthContext.tsx
    │   │   └── useAuth.ts
    │   ├── project/
    │   │   ├── ProjectContext.tsx
    │   │   └── useProject.ts
    │   ├── store/
    │   │   ├── index.ts
    │   │   └── slices/
    │   │       ├── dashboardSlice.ts
    │   │       ├── userSlice.ts
    │   │       └── ...
    │   └── menu/
    │       ├── registry.ts
    │       └── types.ts
    ├── layouts/
    │   ├── AdminLayout.tsx
    │   ├── Sidebar.tsx
    │   ├── Header.tsx
    │   └── Footer.tsx
    ├── pages/
    │   ├── Login.tsx
    │   ├── SelectProject.tsx
    │   ├── Dashboard/
    │   │   ├── index.tsx
    │   │   ├── StatsCards.tsx
    │   │   ├── Charts.tsx
    │   │   └── RecentEvents.tsx
    │   ├── Users/
    │   │   ├── index.tsx
    │   │   ├── UserTable.tsx
    │   │   ├── UserFilters.tsx
    │   │   └── RFMAnalysis.tsx
    │   ├── Finance/
    │   ├── Lottery/
    │   ├── Agents/
    │   ├── Promotions/
    │   ├── Monitor/
    │   ├── Providers/
    │   └── Settings/
    │       ├── index.tsx
    │       ├── GeneralSettings/
    │       └── RegistrationSettings/
    ├── shared/
    │   ├── components/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Table.tsx
    │   │   ├── Skeleton.tsx
    │   │   └── Toast.tsx
    │   ├── hooks/
    │   │   ├── useDebounce.ts
    │   │   ├── useLocalStorage.ts
    │   │   └── useWebSocket.ts
    │   └── utils/
    │       ├── format.ts
    │       └── validation.ts
    └── styles/
        └── globals.css
```

### 3.2. Project Context (Chọn dự án)

```tsx
// src/core/project/ProjectContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type ProjectType = 'game' | 'hub' | 'sports' | 'trade' | 'dating';

interface ProjectContextType {
  currentProject: ProjectType | null;
  setCurrentProject: (project: ProjectType) => void;
  projects: ProjectType[];
  setProjects: (projects: ProjectType[]) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<ProjectType | null>(null);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('lkvip_project') as ProjectType | null;
    if (saved && projects.includes(saved)) {
      setCurrentProject(saved);
    }
    setIsLoading(false);
  }, [projects]);

  const setCurrentProjectAndSave = (project: ProjectType) => {
    setCurrentProject(project);
    localStorage.setItem('lkvip_project', project);
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject: setCurrentProjectAndSave,
        projects,
        setProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};
```

### 3.3. API Client (gắn token & X-Project)

```tsx
// src/core/api/client.ts
import axios from 'axios';
import { ProjectType } from '../project/ProjectContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.tc-gaming.live',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lkvip_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const project = localStorage.getItem('lkvip_project') as ProjectType | null;
  if (project) {
    config.headers['X-Project'] = project;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lkvip_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3.4. Menu Registry (động theo project)

```tsx
// src/core/menu/registry.ts
import { MenuItem } from './types';

export const menuRegistry: Record<string, MenuItem[]> = {
  game: [
    { key: 'dashboard', label: '📊 Dashboard', path: '/dashboard' },
    { key: 'users', label: '👥 Người chơi', path: '/users' },
    { key: 'finance', label: '💰 Tài chính', path: '/finance' },
    { key: 'lottery', label: '🎰 Xổ số', path: '/lottery' },
    { key: 'agents', label: '🤝 Đại lý', path: '/agents' },
    { key: 'promotions', label: '🎁 Khuyến mãi', path: '/promotions' },
    { key: 'providers', label: '🏷️ Đối tác', path: '/providers' },
    { key: 'monitor', label: '📡 Giám sát', path: '/monitor' },
    { key: 'settings', label: '⚙️ Cài đặt', path: '/settings' },
  ],
  hub: [
    { key: 'dashboard', label: '📊 Dashboard', path: '/dashboard' },
    { key: 'users', label: '👥 Người dùng', path: '/users' },
    { key: 'finance', label: '💰 Tài chính', path: '/finance' },
    { key: 'posts', label: '📝 Bài viết', path: '/posts' },
    { key: 'categories', label: '📂 Danh mục', path: '/categories' },
    // ... tương tự
  ],
  // sports, trade, dating
};
```

### 3.5. Dashboard – Thống kê nhanh + Biểu đồ

```tsx
// src/pages/Dashboard/index.tsx
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '../../core/project/ProjectContext';
import { dashboardApi } from '../../core/api/endpoints/dashboard';
import StatsCards from './StatsCards';
import Charts from './Charts';
import RecentEvents from './RecentEvents';
import { Skeleton } from '../../shared/components/Skeleton';

const Dashboard: React.FC = () => {
  const { currentProject } = useProject();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', currentProject],
    queryFn: () => dashboardApi.getStats(currentProject),
    staleTime: 60 * 1000,
  });

  if (isLoading) return <Skeleton count={8} className="h-32" />;

  return (
    <div className="space-y-6">
      <StatsCards stats={data} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Charts data={data} />
        <RecentEvents events={data?.recentEvents || []} />
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## 🧩 4. TÍCH HỢP WEBSOCKET (REALTIME MONITOR)

```tsx
// src/core/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [data, ...prev]);
    };
    return () => ws.current?.close();
  }, [url]);

  const sendMessage = (msg: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  };

  return { messages, sendMessage };
};
```

---

## ✅ 5. TRIỂN KHAI – KIỂM TRA TỪNG MODULE

| Module | Backend API đã có | Frontend component đã có |
|--------|-------------------|--------------------------|
| Layout & Routing | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| User Management | ✅ | ✅ |
| Finance | ✅ | Đang xây dựng |
| Lottery | ✅ | Đang xây dựng |
| Agents | ✅ | Đang xây dựng |
| Promotions | ✅ | Đang xây dựng |
| Realtime Monitor | ✅ (WS) | Đang xây dựng |
| Game Providers | ✅ | Đang xây dựng |
| Settings | ✅ | ✅ |

---

## 🚀 6. LỘ TRÌNH PHÁT TRIỂN

1. **Tuần 1-2**: Layout, Routing, Auth, Project Selector.
2. **Tuần 3-4**: Dashboard (stats, charts, realtime events).
3. **Tuần 5-6**: User Management (table, filter, RFM, retention).
4. **Tuần 7-8**: Finance (overview, payment channels, large transactions).
5. **Tuần 9-10**: Lottery (game list, draw management).
6. **Tuần 11-12**: Agents (overview, list, commission, ranking).
7. **Tuần 13-14**: Promotions (list, add/edit, participation).
8. **Tuần 15-16**: Realtime Monitor (chat, alerts, logs).
9. **Tuần 17-18**: Game Providers (list, balance, reconciliation).
10. **Tuần 19-20**: Settings (general, registration, payment, security).

---

## 📦 7. CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ |
|------------|-----------|
| UI Components | Ant Design + Tailwind CSS |
| State | Zustand |
| Routing | React Router v6 |
| Chart | Recharts |
| Table | TanStack Table |
| Form | React Hook Form + Zod |
| HTTP | Axios + React Query |
| Realtime | Socket.io-client |
| Build | Vite |
| Backend | Node.js + Express + TypeScript + Prisma |
