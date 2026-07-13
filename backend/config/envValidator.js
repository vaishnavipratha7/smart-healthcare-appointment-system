/**
 * Environment Variables Validator
 * Validates that all required environment variables are present and correctly formatted on startup.
 */
const validateEnv = () => {
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
  const missing = [];

  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ CRITICAL CONFIGURATION ERROR: Missing required environment variables:');
    missing.forEach((envVar) => {
      console.error(`   - ${envVar}`);
    });
    process.exit(1);
  }

  // Warn if in production and using default values or dev configuration
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your_jwt_secret_key_change_this_in_production') {
      console.warn('⚠️ WARNING: Using default JWT_SECRET in production! Please update for security.');
    }
  }

  console.log('✅ Environment variables validated successfully.');
};

module.exports = validateEnv;
