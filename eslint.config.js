// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // jest.mock() factories must use require() — import declarations can't
    // appear inside a callback, and the factory runs before hoisted imports.
    files: ['jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
