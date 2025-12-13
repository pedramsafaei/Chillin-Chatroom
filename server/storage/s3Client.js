const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let s3Client = null;

const initS3 = () => {
  const useMinIO = process.env.USE_MINIO === 'true';
  
  const config = {
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    },
  };

  // If using MinIO, configure endpoint
  if (useMinIO) {
    config.endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    config.forcePathStyle = true; // Required for MinIO
  }

  s3Client = new S3Client(config);
  console.log(`S3 client initialized (${useMinIO ? 'MinIO' : 'AWS S3'})`);
  return s3Client;
};

const getS3Client = () => {
  if (!s3Client) {
    throw new Error('S3 client not initialized. Call initS3() first.');
  }
  return s3Client;
};

class StorageManager {
  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'chillin-chatroom';
  }

  // Upload file
  async uploadFile(key, fileBuffer, contentType = 'application/octet-stream', metadata = {}) {
    const client = getS3Client();
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
    });

    await client.send(command);
    
    // Return public URL
    return this.getFileUrl(key);
  }

  // Upload avatar
  async uploadAvatar(username, fileBuffer, contentType) {
    const key = `avatars/${username}-${Date.now()}.${this.getExtension(contentType)}`;
    return await this.uploadFile(key, fileBuffer, contentType, {
      username,
      type: 'avatar',
    });
  }

  // Upload media (images, videos, etc.)
  async uploadMedia(roomName, username, fileBuffer, contentType) {
    const key = `media/${roomName}/${username}-${Date.now()}.${this.getExtension(contentType)}`;
    return await this.uploadFile(key, fileBuffer, contentType, {
      roomName,
      username,
      type: 'media',
    });
  }

  // Get file URL
  getFileUrl(key) {
    const useMinIO = process.env.USE_MINIO === 'true';
    if (useMinIO) {
      const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
      return `${endpoint}/${this.bucketName}/${key}`;
    }
    return `https://${this.bucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  // Get signed URL for private files
  async getSignedUrl(key, expiresIn = 3600) {
    const client = getS3Client();
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  }

  // Delete file
  async deleteFile(key) {
    const client = getS3Client();
    
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await client.send(command);
  }

  // Helper to get file extension from content type
  getExtension(contentType) {
    const map = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
    };
    return map[contentType] || 'bin';
  }
}

module.exports = {
  initS3,
  getS3Client,
  StorageManager: new StorageManager(),
};
