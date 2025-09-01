const Item = require("../models/item.model.js");
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const mongoose = require('mongoose');

const getItems = async (req, res) => {
  try {
    console.log('=== GET ITEMS DEBUG ===');
    console.log('req.user:', req.user);
    console.log('User ID for query:', req.user._id);
    console.log('User ID type:', typeof req.user._id);
    console.log('======================');

    const userId = new mongoose.Types.ObjectId(req.user._id);
    console.log('Converted User ID:', userId);

    // Get items only for the logged-in user
    const items = await Item.find({ user: userId })
      .populate('user', 'name email')
      .populate('itemType', 'name') // Add itemType population
      .sort({ createdAt: -1 });
    
    console.log(`Found ${items.length} items for user ${userId}`);
    
    if (items.length > 0) {
      console.log('Sample item details:', items.slice(0, 3).map(item => ({
        itemId: item._id,
        name: item.name,
        color: item.color,
        dressCode: item.dressCode,
        brand: item.brand,
        material: item.material,
        itemType: item.itemType ? item.itemType.name : 'No type',
        userId: item.user ? item.user._id : 'NO USER',
        userName: item.user ? item.user.name : 'NO NAME'
      })));
    }
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.log('Error getting items:', error.message);
    console.log('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getSingleItem = async (req, res) => {
  try {
    console.log('=== GET SINGLE ITEM DEBUG ===');
    console.log('Item ID:', req.params.id);
    console.log('User ID:', req.user._id);
    console.log('============================');

    // Find item that belongs to the logged-in user
    const item = await Item.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('user', 'name email');
    
    if (!item) {
      console.log('Item not found or does not belong to user');
      return res.status(404).json({ 
        success: false,
        message: "Item not found or you don't have permission to access it" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.log('Error getting single item:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const createItem = async (req, res) => {
  try {
    console.log('=== CREATE ITEM DEBUG ===');
    console.log('req.user:', req.user);
    console.log('User ID:', req.user._id);
    console.log('User Email:', req.user.email);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('========================');

    // Verify user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    // Check if image was uploaded
    if (!req.file || !req.file.location) {
      return res.status(400).json({ 
        success: false,
        message: "Image is required" 
      });
    }

    // Create item with all fields from request body
    const itemData = {
      name: req.body.name,
      color: req.body.color || '',
      dressCode: req.body.dressCode || '',
      brand: req.body.brand || '',
      material: req.body.material || '',
      itemType: req.body.itemType ? new mongoose.Types.ObjectId(req.body.itemType) : null,
      image: req.file.location,
      backgroundRemoved: req.file.backgroundRemoved || false,
      user: new mongoose.Types.ObjectId(req.user._id)
    };

    console.log('Creating item with complete data:', JSON.stringify(itemData, null, 2));
    
    const item = await Item.create(itemData);
    
    console.log('Item created successfully:');
    console.log('- Item ID:', item._id);
    console.log('- Name:', item.name);
    console.log('- Color:', item.color);
    console.log('- Dress Code:', item.dressCode);
    console.log('- Brand:', item.brand);
    console.log('- Material:', item.material);
    console.log('- Item Type:', item.itemType);
    console.log('- Associated User ID:', item.user);
    
    // Populate user and itemType details for response
    await item.populate([
      { path: 'user', select: 'name email' },
      { path: 'itemType', select: 'name' }
    ]);
    
    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: {
        ...item.toObject(),
        backgroundRemoved: req.file.backgroundRemoved
      }
    });
  } catch (error) {
    console.log('Error creating item:', error.message);
    console.log('Error details:', error);
    
    // Clean up uploaded file if item creation fails
    if (req.file && req.file.key) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: req.file.key
        });
        await s3Client.send(deleteCommand);
        console.log('Cleaned up uploaded file due to error');
      } catch (deleteError) {
        console.log('Error deleting image from S3:', deleteError.message);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== UPDATE ITEM DEBUG ===');
    console.log('Item ID:', id);
    console.log('User ID:', req.user._id);
    console.log('Body:', req.body);
    console.log('========================');
    
    // Find item that belongs to the logged-in user
    const existingItem = await Item.findOne({ 
      _id: id, 
      user: req.user._id 
    });
    
    if (!existingItem) {
      console.log('Item not found or does not belong to user');
      return res.status(404).json({ 
        success: false,
        message: `Item not found or you don't have permission to update it` 
      });
    }

    let updateData = {};

    // Update text fields if provided
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.color !== undefined) updateData.color = req.body.color;
    if (req.body.dressCode !== undefined) updateData.dressCode = req.body.dressCode;
    if (req.body.brand !== undefined) updateData.brand = req.body.brand;
    if (req.body.material !== undefined) updateData.material = req.body.material;
    
    // Handle itemType field
    if (req.body.itemType !== undefined) {
      updateData.itemType = req.body.itemType ? new mongoose.Types.ObjectId(req.body.itemType) : null;
    }

    // If new image is uploaded
    if (req.file && req.file.location) {
      console.log('New image uploaded:', req.file.location);
      console.log('Background removal status:', req.file.backgroundRemoved);
      
      updateData.image = req.file.location;
      updateData.backgroundRemoved = req.file.backgroundRemoved || false;
      
      // Delete old image from S3 if it exists
      if (existingItem.image) {
        try {
          // Extract key from S3 URL
          const urlParts = existingItem.image.split('/');
          const oldImageKey = urlParts.slice(-2).join('/'); // gets "items/filename.jpg"
          
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldImageKey
          });
          await s3Client.send(deleteCommand);
          console.log('Deleted old image:', oldImageKey);
        } catch (deleteError) {
          console.log('Error deleting old image from S3:', deleteError.message);
        }
      }
    }

    console.log('Update data:', updateData);

    // Update only items that belong to the user
    const item = await Item.findOneAndUpdate(
      { _id: id, user: req.user._id }, 
      updateData, 
      { new: true }
    ).populate([
      { path: 'user', select: 'name email' },
      { path: 'itemType', select: 'name' }
    ]);
    
    console.log('Item updated successfully');
    
    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: {
        ...item.toObject(),
        backgroundRemoved: req.file ? req.file.backgroundRemoved : item.backgroundRemoved
      }
    });
  } catch (error) {
    console.log('Error updating item:', error.message);
    
    // Clean up uploaded file if update fails
    if (req.file && req.file.key) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: req.file.key
        });
        await s3Client.send(deleteCommand);
      } catch (deleteError) {
        console.log('Error deleting image from S3:', deleteError.message);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== DELETE ITEM DEBUG ===');
    console.log('Item ID:', id);
    console.log('User ID:', req.user._id);
    console.log('========================');
    
    // Delete only items that belong to the user
    const item = await Item.findOneAndDelete({ 
      _id: id, 
      user: req.user._id 
    });
    
    if (!item) {
      console.log('Item not found or does not belong to user');
      return res.status(404).json({ 
        success: false,
        message: `Item not found or you don't have permission to delete it` 
      });
    }

    // Delete image from S3 if it exists
    if (item.image) {
      try {
        const urlParts = item.image.split('/');
        const imageKey = urlParts.slice(-2).join('/'); // gets "items/filename.jpg"
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imageKey
        });
        await s3Client.send(deleteCommand);
        console.log('Deleted image from S3:', imageKey);
      } catch (deleteError) {
        console.log('Error deleting image from S3:', deleteError.message);
      }
    }

    console.log('Item deleted successfully');
    res.status(200).json({ 
      success: true,
      message: "Item deleted successfully" 
    });
  } catch (error) {
    console.log('Error deleting item:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Additional controller method to get user's item statistics
const getItemStats = async (req, res) => {
  try {
    console.log('Getting stats for user:', req.user._id);
    
    const totalItems = await Item.countDocuments({ user: req.user._id });
    const itemsWithBackgroundRemoved = await Item.countDocuments({ 
      user: req.user._id, 
      backgroundRemoved: true 
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalItems,
        itemsWithBackgroundRemoved,
        itemsWithOriginalBackground: totalItems - itemsWithBackgroundRemoved
      }
    });
  } catch (error) {
    console.log('Error getting stats:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  getItems,
  getSingleItem,
  createItem,
  updateItem,
  deleteItem,
  getItemStats,
};