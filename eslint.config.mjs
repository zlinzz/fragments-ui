// eslint.config.mjs

import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  { files: ['**/*.js'], languageOptions: { sourceType: 'module' } },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser, // Added DOM browser globals
      },
    },
  },
  pluginJs.configs.recommended,
];