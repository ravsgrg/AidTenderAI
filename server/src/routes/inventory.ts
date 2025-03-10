import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Error handling middleware for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: 'Error uploading file',
      error: err.message
    });
  }
  next();
};

// Get all inventory items with their categories
router.get('/inventory-items', async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        category: true
      },
      orderBy: {
        item_no: 'asc'
      }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching inventory items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add a new inventory item
router.post('/inventory-items', async (req, res) => {
  try {
    const { item_no, desc, unit, unit_cost, unit_weight, qty, categoryId } = req.body;

    // Validate required fields
    if (!item_no || !categoryId || qty === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'Item No, Category and Quantity are required'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category'
      });
    }

    // Check if item_no already exists
    const existingItem = await prisma.inventoryItem.findFirst({
      where: { item_no }
    });

    if (existingItem) {
      return res.status(400).json({ 
        success: false,
        message: 'Item number already exists'
      });
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        item_no,
        desc: desc || '',
        unit: unit || '',
        unit_cost: unit_cost || 0,
        unit_weight: unit_weight || 0,
        qty,
        categoryId
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating inventory item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk import inventory items from CSV
router.post('/inventory-items/bulk-import', 
  (req, res, next) => upload.single('file')(req, res, (err) => handleMulterError(err, req, res, next)),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded'
      });
    }

    const results: any[] = [];
    const errors: string[] = [];

    try {
      // Read and parse CSV file
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      
      // Check if file is empty
      if (!fileContent.trim()) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'The uploaded file is empty'
        });
      }

      const records = await new Promise<any[]>((resolve, reject) => {
        parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          skipRecordsWithError: true
        }, (err, data) => {
          if (err) {
            reject(new Error('Error parsing CSV file: ' + err.message));
          } else if (!Array.isArray(data) || data.length === 0) {
            reject(new Error('No valid records found in CSV file'));
          } else {
            resolve(data);
          }
        });
      });

      // Validate CSV headers
      const requiredHeaders = ['item_no', 'unit', 'qty', 'categoryId'];
      const firstRecord = records[0];
      const missingHeaders = requiredHeaders.filter(header => !(header in firstRecord));
      
      if (missingHeaders.length > 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        });
      }

      // Process each record
      for (const record of records) {
        try {
          // Convert and validate fields
          const item = {
            item_no: record.item_no?.trim(),
            desc: record.desc?.trim() || '',
            unit: record.unit?.trim() || '',
            unit_cost: parseFloat(record.unit_cost) || 0,
            unit_weight: parseFloat(record.unit_weight) || 0,
            qty: parseInt(record.qty) || 0,
            categoryId: parseInt(record.categoryId)
          };

          // Validate required fields
          if (!item.item_no || !item.categoryId) {
            errors.push(`Row with item_no ${record.item_no || 'unknown'}: Missing required fields`);
            continue;
          }

          // Check if category exists
          const category = await prisma.category.findUnique({
            where: { id: item.categoryId }
          });

          if (!category) {
            errors.push(`Row with item_no ${item.item_no}: Invalid category ID ${item.categoryId}`);
            continue;
          }

          // Check for duplicate item_no
          const existingItem = await prisma.inventoryItem.findFirst({
            where: { item_no: item.item_no }
          });

          if (existingItem) {
            errors.push(`Row with item_no ${item.item_no}: Item number already exists`);
            continue;
          }

          // Create the item
          const newItem = await prisma.inventoryItem.create({
            data: item,
            include: { category: true }
          });

          results.push(newItem);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Error processing row with item_no ${record.item_no || 'unknown'}: ${errorMessage}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Send response
      res.json({
        success: true,
        message: results.length > 0 ? 'Items imported successfully' : 'No items were imported',
        imported: results.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        items: results
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ 
        success: false,
        message: 'Error processing CSV file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
});

// Update an inventory item
router.put('/inventory-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_no, desc, unit, unit_cost, unit_weight, qty, categoryId } = req.body;

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found'
      });
    }

    // Check if category exists if updating category
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid category'
        });
      }
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: {
        item_no,
        desc,
        unit,
        unit_cost,
        unit_weight,
        qty,
        categoryId
      },
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating inventory item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete an inventory item
router.delete('/inventory-items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found'
      });
    }

    await prisma.inventoryItem.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting inventory item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 