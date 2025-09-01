const multer = require('multer');
const { Upload } = require('@aws-sdk/lib-storage');
const s3Client = require('../config/s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log('File received:', file.originalname, 'Type:', file.mimetype);
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Function to remove background using remove.bg API
const removeBackground = async (imageBuffer) => {
  try {
    console.log('Removing background from image...');
    
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", new Blob([imageBuffer]));

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { 
        "X-Api-Key": process.env.REMOVE_BG_API_KEY
      },
      body: formData,
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      const errorText = await response.text();
      throw new Error(`Remove.bg API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Background removal error:', error);
    throw error;
  }
};

// Custom middleware to handle background removal and S3 upload
const uploadToS3WithBgRemoval = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    let processedBuffer = req.file.buffer;
    let contentType = req.file.mimetype;
    
    // Check if background removal is requested (optional parameter)
    const removeBg = req.body.removeBg === 'true' || req.query.removeBg === 'true';
    
    if (removeBg) {
      try {
        console.log('Processing image for background removal...');
        processedBuffer = await removeBackground(req.file.buffer);
        contentType = 'image/png'; // remove.bg returns PNG format
        console.log('Background removed successfully');
      } catch (bgError) {
        console.error('Background removal failed, using original image:', bgError.message);
        // Continue with original image if background removal fails
      }
    }

    // Generate unique filename
    const fileExtension = removeBg && processedBuffer !== req.file.buffer ? '.png' : path.extname(req.file.originalname);
    const fileName = `items/${uuidv4()}${fileExtension}`;

    console.log('Uploading to S3:', fileName);

    // Upload processed image to S3
    const uploadParams = {
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: processedBuffer,
        ContentType: contentType
      }
    };

    const s3Upload = new Upload(uploadParams);
    const result = await s3Upload.done();
    
    // Create the public URL
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    // Add S3 information to req.file
    req.file.location = publicUrl;
    req.file.key = fileName;
    req.file.backgroundRemoved = removeBg && processedBuffer !== req.file.buffer;

    console.log('File uploaded successfully:', publicUrl);
    console.log('Background removed:', req.file.backgroundRemoved);
    
    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to process and upload image',
      error: error.message 
    });
  }
};

// Alternative middleware that always removes background
const uploadToS3AlwaysRemoveBg = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    console.log('Processing image for background removal...');
    
    // Always remove background
    let processedBuffer;
    try {
      processedBuffer = await removeBackground(req.file.buffer);
      console.log('Background removed successfully');
    } catch (bgError) {
      console.error('Background removal failed:', bgError.message);
      return res.status(400).json({ 
        message: 'Failed to remove background from image',
        error: bgError.message 
      });
    }

    // Generate unique filename with .png extension (remove.bg returns PNG)
    const fileName = `items/${uuidv4()}.png`;

    console.log('Uploading processed image to S3:', fileName);

    // Upload processed image to S3
    const uploadParams = {
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: processedBuffer,
        ContentType: 'image/png'
      }
    };

    const s3Upload = new Upload(uploadParams);
    const result = await s3Upload.done();
    
    // Create the public URL
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    // Add S3 information to req.file
    req.file.location = publicUrl;
    req.file.key = fileName;
    req.file.backgroundRemoved = true;

    console.log('File uploaded successfully with background removed:', publicUrl);
    
    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to process and upload image',
      error: error.message 
    });
  }
};

module.exports = { 
  upload, 
  uploadToS3: uploadToS3WithBgRemoval
};