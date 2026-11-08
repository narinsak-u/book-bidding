export default [
  {
    ignores: [
      'node_modules/',
      '.svelte-kit/',
      'dist/',
      'build/',
      '.vite/',
      '.output/'
    ]
  },
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  }
];