module.exports = {
  extends: ['astro'],
  rules: {
    // 忽略 Vue 组件导入的类型检查错误
    '@typescript-eslint/no-unused-vars': 'off',
  },
  overrides: [
    {
      files: ['*.astro'],
      rules: {
        // 在 Astro 文件中忽略模块导入错误
        'import/no-unresolved': 'off',
      }
    }
  ]
}
