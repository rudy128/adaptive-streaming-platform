import 'dotenv/config';

const env = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // PostgreSQL
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/streaming',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // S3-compatible storage (AWS / Supabase / MinIO etc.)
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET || 'streaming-bucket',
    endpoint: process.env.S3_ENDPOINT || '',       // e.g. https://xxx.storage.supabase.co/storage/v1/s3
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    publicUrl: process.env.S3_PUBLIC_URL || '',
  },

  // CORS
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(','),

  // Presence
  heartbeatInterval: 5_000,   // 5 seconds
  heartbeatTimeout: 15_000,   // 15 seconds – remove viewer after this
};

export default env;
