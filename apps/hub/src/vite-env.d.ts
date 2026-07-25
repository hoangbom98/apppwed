/// <reference types="vite/client" />

// Type shim for dompurify — package is listed in package.json.
// Run `pnpm install` to activate. This declaration prevents TS2307 during tsc --noEmit
// before the package is physically installed.
declare module 'dompurify' {
  interface DOMPurifyI {
    sanitize(dirty: string, options?: object): string;
    isSupported: boolean;
  }
  const DOMPurify: DOMPurifyI;
  export default DOMPurify;
}
/// <reference types="vite-plugin-pwa/client" />
