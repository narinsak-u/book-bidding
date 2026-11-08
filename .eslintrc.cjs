const config = {
  extends: [
    'eslint:recommended',
    'plugin:svelte/recommended',
    'prettier'
  ],
  plugins: ['svelte'],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte/svelte3',
    }
  ],
  rules: {
    // Svelte specific rules
    'svelte/button-has-type': 'error',
    'svelte/no-directive-js': 'error',
    'svelte/no-multiple-slot': 'error',
    
    // General JavaScript/TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    
    // Prettier integration
    'prettier/prettier': 'error',
  }
};

module.exports = config;