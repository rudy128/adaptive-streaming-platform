import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';

const s3Config = {
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
};

if (env.aws.endpoint) {
  s3Config.endpoint = env.aws.endpoint;
  s3Config.forcePathStyle = env.aws.forcePathStyle;
}

const s3 = new S3Client(s3Config);

export default s3;
