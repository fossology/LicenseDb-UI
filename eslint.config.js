// SPDX-License-Identifier: FSFAP
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Kaushlendra Pratap Singh <kaushlendra-pratap.singh@siemens.com>
// SPDX-FileContributor: Chirag Varu <chiragvaru.main@gmail.com>

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
			// React Rules
			'react/jsx-uses-react': 'error',
			'react/react-in-jsx-scope': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			// Import Rules
			'import/no-unresolved': 'error',
			'import/order': [
				'error',
				{
					groups: ['builtin', 'external', 'internal'],
				},
			],

			// Prettier Rule to handle formatting
			'prettier/prettier': 'error',

			// General Rules
			'no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'none',
					ignoreRestSiblings: false,
				},
			],

			semi: ['error', 'always'],
			quotes: ['error', 'single'],
			indent: ['error', 'tab'],
			eqeqeq: ['warn', 'always'],
			'no-console': 'warn',
			'no-debugger': 'error',
      
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
		},
  },
])
