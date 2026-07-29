// Khai báo cho CSS imports trong Next.js — tránh TS2882 error
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
