import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

// Plugins
import jsdocPlugin from 'eslint-plugin-jsdoc'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import neostandard from 'neostandard'

/** Files to include in linting. */
const filesToParse = ['**/*.{mjs,ts,tsx}']

export default defineConfig([
    // Auto generated features
    { files: filesToParse, languageOptions: { globals: globals.browser } },
    {
        files: filesToParse, plugins: { js }, extends: ['js/recommended']
    },
    // Adds neostandard
    ...neostandard(),
    tseslint.configs.recommended,
    {
        files: filesToParse,
        rules: {
            indent: ['error', 4, { SwitchCase: 1 }],
            '@stylistic/jsx-indent-props': ['error', 4],
            '@stylistic/jsx-indent': ['error', 4],
            '@stylistic/indent': ['error', 4, {
                SwitchCase: 1
            }],
            'react/jsx-handler-names': 'off',
            'no-undef': 'off',
            camelcase: 'off',
            curly: ['error', 'all'],
            'no-multi-spaces': 'error',
            'padding-line-between-statements': [
                'warn',
                { blankLine: 'always', prev: '*', next: 'block' },
                { blankLine: 'always', prev: 'block', next: '*' },
                { blankLine: 'always', prev: '*', next: 'block-like' },
                { blankLine: 'always', prev: 'block-like', next: '*' }
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            // Disables warnings for unused vars that start with a '_'
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_'
                }
            ],
        },
    },
    // JSDocs
    jsdocPlugin.configs['flat/recommended-typescript'],
    {
        files: filesToParse,
        plugins: { jsdoc: jsdocPlugin },
        rules: {
            'jsdoc/require-description': 'warn',
            'jsdoc/check-alignment': 'warn',
            'jsdoc/check-param-names': 'warn',
            'jsdoc/check-tag-names': 'warn',
            'jsdoc/check-types': 'warn',
            'jsdoc/implements-on-classes': 'warn',
            'jsdoc/no-undefined-types': 'warn',
            'jsdoc/require-jsdoc': 'warn',
            'jsdoc/require-param': 'warn',
            'jsdoc/require-param-description': 'warn',
            'jsdoc/require-param-name': 'warn',
            'jsdoc/require-returns-check': 'warn',
            'jsdoc/require-returns-description': 'warn',
            'jsdoc/valid-types': 'warn',
            'jsdoc/require-returns': 'warn',
        }
    },
    // React
    reactPlugin.configs.flat.recommended, // This is not a plugin object, but a shareable config object
    reactPlugin.configs.flat['jsx-runtime'], // Add this if you are using React 17+
    reactHooksPlugin.configs['recommended-latest'],
    {
        files: filesToParse,
        plugins: {
            react: reactPlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'react/no-unescaped-entities': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'off',
            'react/display-name': 'off',
            'react/jsx-equals-spacing': 'error',
            'react/jsx-closing-bracket-location': 'error',
            'react/jsx-closing-tag-location': 'error',
            'react/jsx-curly-spacing': [
                'error',
                {
                    when: 'never',
                    children: true
                }
            ],
            'react/jsx-tag-spacing': [
                'error',
                {
                    afterOpening: 'never',
                    beforeClosing: 'never',
                    beforeSelfClosing: 'proportional-always',
                    closingSlash: 'never'
                }
            ],
            'react/jsx-curly-brace-presence': [
                'error',
                {
                    props: 'never',
                    children: 'never'
                }
            ],
            'react/jsx-uses-react': 'error',
            'react/jsx-uses-vars': 'error',
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    },
])
