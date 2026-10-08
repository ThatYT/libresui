import vue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'

export default [
  { ignores: ['node_modules/**', 'dist/**'] },
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tsParser } },
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    files: ['**/*.ts', '**/*.mts'],
    languageOptions: { parser: tsParser },
  },
]
