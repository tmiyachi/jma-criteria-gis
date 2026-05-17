/**
 * @see https://stylelint.io/user-guide/configure/
 * @type {import('stylelint').Config}
 */
export default {
  ignoreFiles: ['dist/**/*', '.venv/**/*', 'web/dist/**/*'],
  extends: ['stylelint-config-recommended', 'stylelint-config-recess-order'],
  rules: {},
};
