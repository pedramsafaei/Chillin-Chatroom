const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validatePresignRequest, validateUploadComplete } = require('../middleware/validation');
const Attachment = require('../database/models/Attachment');
const crypto = require('crypto');

// S3 presigned URL support
let StorageManager;
try {
  const s3Client = require('../storage/s3Client');
  StorageManager = s3Client.StorageManager;
} catch (error) {
  console.warn('S3 client not available');
}

// POST /api/v1/uploads/presign
router.post('/presign', authenticate, validatePresignRequest, async (req, res) => {
  try {
    const { fileName, mimeType, size } = req.body;
    const { userId } = req.user;
    
    // Check if S3 is configured
    if (!StorageManager) {
      return res.status(503).json({ 
        error: 'File upload service not configured. Please set up S3/MinIO.' 
      });
    }
    
    // Generate unique file key
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const extension = fileName.split('.').pop();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `uploads/${userId}/${timestamp}-${randomStr}-${sanitizedName}`;
    
    try {
      // Generate presigned URL for upload
      const uploadUrl = await StorageManager.getSignedUrl(fileKey, 3600);
      const fileUrl = StorageManager.getFileUrl(fileKey);
      
      // For actual S3 presigned POST, we would use createPresignedPost
      // For now, return the signed GET URL which can be used with PUT
      res.json({
        uploadUrl,
        fileUrl,
        fields: {
          key: fileKey,
          'Content-Type': mimeType
        }
      });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return res.status(503).json({ 
        error: 'Failed to generate upload URL. S3 service may not be properly configured.' 
      });
    }
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// POST /api/v1/uploads/complete
router.post('/complete', authenticate, validateUploadComplete, async (req, res) => {
  try {
    const { fileUrl, messageId, fileName, mimeType, size } = req.body;
    
    // If messageId provided, create attachment record
    if (messageId) {
      const attachment = await Attachment.create({
        messageId: parseInt(messageId),
        fileName: fileName || 'uploaded_file',
        fileSize: size || 0,
        mimeType: mimeType || 'application/octet-stream',
        url: fileUrl,
        thumbnailUrl: null,
        width: null,
        height: null
      });
      
      return res.json({ 
        success: true, 
        attachment 
      });
    }
    
    res.json({ 
      success: true, 
      fileUrl 
    });
  } catch (error) {
    console.error('Upload complete error:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

module.exports = router;
