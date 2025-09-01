const { S3Client } = require('@aws-sdk/client-s3');

// Debug environment variables
console.log('=== DEBUG ENV VARS ===');
console.log('AWS_BUCKET_NAME raw:', JSON.stringify(process.env.AWS_BUCKET_NAME));
console.log('AWS_REGION raw:', JSON.stringify(process.env.AWS_REGION));
console.log('=====================');

// Check if environment variables are loaded
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_BUCKET_NAME) {
  console.error('Missing required AWS environment variables!');
  console.error('Required variables:');
  console.error('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'MISSING');
  console.error('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'MISSING');
  console.error('- AWS_REGION:', process.env.AWS_REGION || 'MISSING');
  console.error('- AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME || 'MISSING');
  process.exit(1);
}

// Configure AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log('AWS S3 configured successfully with SDK v3!');
console.log('Bucket:', process.env.AWS_BUCKET_NAME);
console.log('Region:', process.env.AWS_REGION);

module.exports = s3Client;