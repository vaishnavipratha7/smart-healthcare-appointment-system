const shouldRequireEmailVerification = (env = process.env) => {
  if (env.ENABLE_EMAIL_VERIFICATION === 'false') {
    return false;
  }

  if (env.ENABLE_EMAIL_VERIFICATION === 'true') {
    return true;
  }

  return Boolean(env.EMAIL_HOST && env.EMAIL_HOST.trim()) || env.NODE_ENV !== 'production';
};

module.exports = {
  shouldRequireEmailVerification,
};
