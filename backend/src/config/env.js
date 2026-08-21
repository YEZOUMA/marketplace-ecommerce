import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  databaseUrl: required('DATABASE_URL', process.env.NODE_ENV === 'test' ? 'postgresql://test:test@localhost:5432/test' : undefined),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', process.env.NODE_ENV === 'test' ? 'test-access-secret' : undefined),
    refreshSecret: required('JWT_REFRESH_SECRET', process.env.NODE_ENV === 'test' ? 'test-refresh-secret' : undefined),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  storage: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'product-images',
    publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000/product-images',
    localFallback: process.env.STORAGE_MODE !== 'minio', // default: local disk volume
    localDir: process.env.STORAGE_LOCAL_DIR || '/app/uploads',
  },

  publicationFee: {
    amount: parseFloat(process.env.PUBLICATION_FEE_AMOUNT || '500'),
    currency: process.env.PUBLICATION_FEE_CURRENCY || 'XOF',
  },

  payments: {
    mockMode: process.env.PAYMENTS_MOCK_MODE !== 'false', // defaults to true (sandbox)
    webhookSecret: process.env.PAYMENTS_WEBHOOK_SECRET || 'dev-webhook-secret',
    orangeMoney: {
      apiKey: process.env.ORANGE_MONEY_API_KEY || '',
      apiSecret: process.env.ORANGE_MONEY_API_SECRET || '',
      baseUrl: process.env.ORANGE_MONEY_BASE_URL || '',
    },
    moovMoney: {
      apiKey: process.env.MOOV_MONEY_API_KEY || '',
      apiSecret: process.env.MOOV_MONEY_API_SECRET || '',
      baseUrl: process.env.MOOV_MONEY_BASE_URL || '',
    },
    wave: {
      apiKey: process.env.WAVE_API_KEY || '',
      apiSecret: process.env.WAVE_API_SECRET || '',
      baseUrl: process.env.WAVE_BASE_URL || '',
    },
    sankMoney: {
      apiKey: process.env.SANK_MONEY_API_KEY || '',
      apiSecret: process.env.SANK_MONEY_API_SECRET || '',
      baseUrl: process.env.SANK_MONEY_BASE_URL || '',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },
};
