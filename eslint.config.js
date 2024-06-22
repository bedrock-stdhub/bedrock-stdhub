import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';


export default [
  { files: [ '**/*.{js,mjs,cjs,ts}' ] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      semi: 'error',
      quotes: [ 'error', 'single' ],
      'array-bracket-spacing': [ 'error', 'always' ],
      'object-curly-spacing': [ 'error', 'always' ],
    }
  }
];