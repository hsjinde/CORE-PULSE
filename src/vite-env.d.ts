/// <reference types="vite/client" />

/** 由 vite.config.ts 的 define 在建置時注入的 ISO 時間字串 */
declare const __BUILD_TIME__: string;

declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const value: unknown;
  export default value;
}
