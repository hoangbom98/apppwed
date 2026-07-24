// game/src/layout/index.ts — Barrel exports with both English and legacy names
// English names are preferred for new code.

export { default as AppShell }        from './KhungUngDung';   // AppShell (main layout wrapper)
export { default as Header }          from './DauTrang';        // Header (top bar)
export { default as BottomNav }       from './ThanhDieuHuong'; // BottomNav (mobile bottom navigation)

// Legacy Vietnamese names — kept for backwards compatibility
export { default as KhungUngDung }   from './KhungUngDung';
export { default as DauTrang }       from './DauTrang';
export { default as ThanhDieuHuong } from './ThanhDieuHuong';
