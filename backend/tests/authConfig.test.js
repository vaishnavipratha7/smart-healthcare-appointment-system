const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRequireEmailVerification } = require('../utils/authConfig');

test('requires email verification when explicitly enabled', () => {
  const env = {
    ENABLE_EMAIL_VERIFICATION: 'true',
    NODE_ENV: 'production',
    EMAIL_HOST: 'smtp.example.com',
  };

  assert.equal(shouldRequireEmailVerification(env), true);
});

test('skips email verification for demo deployments without SMTP', () => {
  const env = {
    ENABLE_EMAIL_VERIFICATION: 'false',
    NODE_ENV: 'production',
    EMAIL_HOST: '',
  };

  assert.equal(shouldRequireEmailVerification(env), false);
});
