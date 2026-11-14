import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const noElectron = (message) => ({
  paths: [
    { name: 'electron', message },
    { name: 'moment', message: 'Moment.js مجاز نیست؛ از Intl.DateTimeFormat استفاده کنید.' },
  ],
  patterns: [{ group: ['electron/*'], message }],
});

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'dist/**',
      'release/**',
      'playwright-report/**',
      'test-results/**',
      'e2e-artifacts/**',
      'resources-build/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'moment', message: 'Moment.js مجاز نیست؛ از Intl استفاده کنید.' }] },
      ],
    },
  },

  // ---------- پروسهٔ اصلی و اسکریپت‌ها (Node) ----------
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', 'e2e/**/*.ts', 'scripts/**/*.{mjs,cjs,js}', '*.{ts,mts,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // منطق کسب‌وکار باید TypeScript خالص بماند تا بدون Electron تست شود.
    files: ['src/main/core/**/*.ts', 'src/main/db/**/*.ts', 'src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        noElectron('core/db/shared نباید به electron وابسته باشند؛ از لایهٔ IPC استفاده کنید.'),
      ],
    },
  },
  {
    // preload فقط پل است: تنها contextBridge و ipcRenderer.
    files: ['src/preload/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'electron',
              allowImportNames: ['contextBridge', 'ipcRenderer', 'IpcRendererEvent'],
              message: 'در preload فقط contextBridge و ipcRenderer مجاز است.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // ---------- renderer (مرورگر، بدون دسترسی Node/Electron) ----------
  {
    files: ['src/renderer/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-imports': [
        'error',
        noElectron('renderer به electron دسترسی ندارد؛ فقط از window.api استفاده کنید.'),
      ],
      'no-restricted-globals': [
        'error',
        { name: 'require', message: 'require در renderer مجاز نیست.' },
      ],
    },
  },

  // ---------- کد بالادستی Drawnix (vendored) ----------
  {
    files: ['packages/**/*.{ts,tsx}'],
    // دستورهای eslint-disable پروژهٔ اصلی برای پیکربندی خودش نوشته شده‌اند.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  // سبک کدنویسی پروژهٔ اصلی حفظ شده است؛ فقط قواعد ایمنی (hooks و ممنوعیت electron) اعمال می‌شود.
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-empty': 'off',
      'no-prototype-builtins': 'off',
      'no-case-declarations': 'off',
      'prefer-const': 'off',
      'no-useless-escape': 'off',
    },
  },

  // ---------- تست‌ها ----------
  {
    files: ['**/*.spec.{ts,tsx}', 'src/renderer/src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  }
);
