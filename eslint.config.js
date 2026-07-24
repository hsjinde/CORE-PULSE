import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .claude 下的殘留 worktree 自帶 tsconfig,會讓 typescript-eslint 看到多個
  // 候選 root 而無法判定,連 vite.config.ts 都會 parse 失敗。
  globalIgnores(['dist', '.claude']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      // 明確釘住 root,不讓 parser 自己猜(見上方 globalIgnores 的理由)
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
