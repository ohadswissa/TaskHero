import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // JWT
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: Joi.number().default(12),

  // Storage
  STORAGE_TYPE: Joi.string().valid('local', 's3').default('local'),
  S3_ENDPOINT: Joi.string().optional(),
  S3_ACCESS_KEY: Joi.string().optional(),
  S3_SECRET_KEY: Joi.string().optional(),
  S3_BUCKET: Joi.string().optional(),
  S3_REGION: Joi.string().default('us-east-1'),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'log', 'debug', 'verbose').default('log'),

  // Feature Flags
  FEATURE_PHOTO_UPLOAD: Joi.boolean().default(true),
  FEATURE_MINI_GAMES: Joi.boolean().default(true),
  FEATURE_REAL_WORLD_REWARDS: Joi.boolean().default(true),
});
