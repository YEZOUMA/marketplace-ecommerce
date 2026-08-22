import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Values that must never survive into a real deployment. Catches the most
// common beginner mistake: copying .env.example to .env and forgetting to
// replace the placeholder secrets — which would otherwise fail silently
// (e.g. every JWT signed with a publicly-known secret) instead of loudly.
const INSECURE_PLACEHOLDER_PATTERNS = [/change-?me/i, /changeme/i, /^secret$/i, /^password$/i, /^minioadmin$/i];

function looksLikePlaceholder(value) {
  return INSECURE_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(
      `Variable d'environnement manquante: ${name}. Copiez .env.example vers .env et renseignez-la.`,
    );
  }
  return value;
}

// A stricter variant for secrets: required everywhere, and in production it
// also refuses known placeholder values and enforces a minimum length so a
// weak or forgotten secret fails fast at boot instead of quietly weakening
// every token/signature the app issues.
function requiredSecret(name, { fallback, minLength = 16 } = {}) {
  // A convenience fallback (e.g. for local dev) must never apply in
  // production — there, the variable must be explicitly set or boot fails.
  const value = required(name, isProduction ? undefined : fallback);

  if (isProduction) {
    if (looksLikePlaceholder(value)) {
      throw new Error(
        `${name} contient encore une valeur d'exemple ("${value}"). Générez un secret unique ` +
          `(ex: openssl rand -hex 32) et mettez-le dans votre .env avant de démarrer en production.`,
      );
    }
    if (value.length < minLength) {
      throw new Error(`${name} est trop court (${minLength} caractères minimum recommandés en production).`);
    }
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  databaseUrl: required('DATABASE_URL', isTest ? 'postgresql://test:test@localhost:5432/test' : undefined),

  jwt: {
    accessSecret: requiredSecret('JWT_ACCESS_SECRET', { fallback: isTest ? 'test-access-secret' : undefined }),
    refreshSecret: requiredSecret('JWT_REFRESH_SECRET', { fallback: isTest ? 'test-refresh-secret' : undefined }),
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
    webhookSecret: requiredSecret('PAYMENTS_WEBHOOK_SECRET', { fallback: isTest ? 'test-webhook-secret' : 'dev-webhook-secret' }),
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

  seed: {
    runOnStart: process.env.RUN_SEED_ON_START === 'true',
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@marketplace.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'ChangeMoi123!',
  },
};

if (isProduction && looksLikePlaceholder(env.databaseUrl)) {
  throw new Error(
    "DATABASE_URL semble contenir un mot de passe d'exemple (POSTGRES_PASSWORD non changé). " +
      'Choisissez un mot de passe fort pour PostgreSQL avant de démarrer en production.',
  );
}

// PAYMENTS_MOCK_MODE=false in production without real provider keys would
// silently make every publication payment fail (adapters throw). Fail at
// boot instead, with a message pointing at the fix.
if (isProduction && !env.payments.mockMode) {
  const providers = env.payments;
  const configured = ['orangeMoney', 'moovMoney', 'wave', 'sankMoney'].filter((key) => providers[key].apiKey);
  if (configured.length === 0) {
    throw new Error(
      "PAYMENTS_MOCK_MODE=false mais aucune clé API de prestataire mobile money n'est configurée. " +
        'Renseignez au moins un prestataire (ex: ORANGE_MONEY_API_KEY) ou repassez en PAYMENTS_MOCK_MODE=true.',
    );
  }
}

if (isProduction && env.seed.runOnStart && looksLikePlaceholder(env.seed.adminPassword)) {
  throw new Error(
    "SEED_ADMIN_PASSWORD contient encore le mot de passe d'exemple. Choisissez-en un fort avant de démarrer " +
      'en production (le compte admin sera créé avec ce mot de passe au premier démarrage).',
  );
}
