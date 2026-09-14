/**
 * Cưỡng chế luật ranh giới bằng máy — `docs/04-guidelines/coding-standards.md` §7.
 * Một bộ cấu hình duy nhất cho cả ba vùng, vì `shared/` không thuộc package nào
 * và luật ranh giới phải nhìn thấy đồng thời cả ba vùng mới kiểm được.
 */

const NODE_MODULES_BANNED_IN_RENDERER = [
  'electron',
  'fs',
  'node:fs',
  'path',
  'node:path',
  'os',
  'node:os',
  'child_process',
  'node:child_process',
  'better-sqlite3',
]

const MESSAGES = {
  renderer: 'Renderer không được truy cập Node. Dùng window.api.',
  backend: 'Backend không được phụ thuộc vào tầng giao diện.',
  service: 'Service phải chạy được bằng Node thuần để unit test.',
  repository: 'Repository không được phụ thuộc ngược lên Service.',
  ipc: 'ipc/ chỉ được gọi services/. Cấm nhảy tầng xuống repositories/.',
  shared: 'shared/ phải là JS thuần.',
  sql: 'Cấm nối chuỗi SQL. Dùng tham số hoá `?` ở Repository.',
}

module.exports = {
  root: true,
  env: { es2023: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['import'],
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  settings: {
    'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
    react: { version: '18.3' },
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-cycle': 'error',
    'import/no-unresolved': 'off',
    eqeqeq: 'error',
    'no-var': 'error',
    'prefer-const': 'error',
  },
  overrides: [
    { files: ['frontend/public/**/*.js'], env: { browser: true } },
    {
      files: ['frontend/test/**/*.{js,jsx}'],
      env: { browser: true, node: true },
      parserOptions: { ecmaFeatures: { jsx: true } },
      plugins: ['react'],
      extends: ['plugin:react/recommended', 'plugin:react/jsx-runtime', 'prettier'],
      rules: { 'react/prop-types': 'off' },
    },
    // ── Renderer ────────────────────────────────────────────────────────────
    {
      files: ['frontend/src/**/*.{js,jsx}'],
      env: { browser: true },
      parserOptions: { ecmaFeatures: { jsx: true } },
      plugins: ['react', 'react-hooks', 'jsx-a11y'],
      extends: [
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'prettier',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: NODE_MODULES_BANNED_IN_RENDERER.map((name) => ({
              name,
              message: MESSAGES.renderer,
            })),
            patterns: [{ group: ['**/backend/**'], message: MESSAGES.renderer }],
          },
        ],
        'no-restricted-globals': [
          'error',
          { name: 'require', message: MESSAGES.renderer },
          { name: 'process', message: MESSAGES.renderer },
          { name: '__dirname', message: MESSAGES.renderer },
        ],
        'react/jsx-key': 'error',
        'react/no-unstable-nested-components': 'error',
        'react/prop-types': 'off',
      },
    },

    // ── Backend ─────────────────────────────────────────────────────────────
    {
      files: ['backend/src/**/*.js'],
      env: { node: true },
      rules: {
        'no-console': 'error',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              { name: 'react', message: MESSAGES.backend },
              { name: 'react-dom', message: MESSAGES.backend },
            ],
            patterns: [{ group: ['**/frontend/**'], message: MESSAGES.backend }],
          },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector:
              'TemplateLiteral > TemplateElement[value.raw=/\\b(SELECT|INSERT|UPDATE|DELETE)\\b/i]',
            message: MESSAGES.sql,
          },
        ],
      },
    },
    {
      files: ['backend/src/services/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          { paths: [{ name: 'electron', message: MESSAGES.service }] },
        ],
      },
    },
    {
      files: ['backend/src/repositories/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [{ group: ['**/services/**'], message: MESSAGES.repository }] },
        ],
      },
    },
    {
      files: ['backend/src/main/ipc/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [{ group: ['**/repositories/**'], message: MESSAGES.ipc }] },
        ],
      },
    },

    // ── Test của backend ────────────────────────────────────────────────────
    // Chạy bằng `node --test`, nên là ESM `.mjs` và có sẵn bộ test của Node.
    {
      files: ['backend/test/**/*.mjs'],
      env: { node: true },
      rules: {
        'no-console': 'error',
        'no-restricted-syntax': [
          'error',
          {
            selector:
              'TemplateLiteral > TemplateElement[value.raw=/\b(SELECT|INSERT|UPDATE|DELETE)\b/i]',
            message: MESSAGES.sql,
          },
        ],
      },
    },

    // ── shared/ ─────────────────────────────────────────────────────────────
    {
      files: ['shared/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              { name: 'fs', message: MESSAGES.shared },
              { name: 'node:fs', message: MESSAGES.shared },
              { name: 'path', message: MESSAGES.shared },
              { name: 'node:path', message: MESSAGES.shared },
              { name: 'electron', message: MESSAGES.shared },
              { name: 'react', message: MESSAGES.shared },
              { name: 'react-dom', message: MESSAGES.shared },
            ],
            patterns: [
              { group: ['**/frontend/**', '**/backend/**', '../*'], message: MESSAGES.shared },
            ],
          },
        ],
      },
    },

    // ── File cấu hình (không phải mã nguồn ứng dụng) ────────────────────────
    {
      files: ['*.cjs', '*.config.js', 'frontend/*.config.js', 'backend/*.config.js'],
      env: { node: true },
      parserOptions: { sourceType: 'script' },
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      files: [
        'frontend/vite.config.js',
        'frontend/vitest.config.js',
        'backend/electron.vite.config.js',
      ],
      parserOptions: { sourceType: 'module' },
    },
  ],
}
