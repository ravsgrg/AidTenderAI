import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all tenders with their categories
router.get('/tenders', async (req, res) => {
  try {
    const tenders = await prisma.tender.findMany({
      include: {
        category: true,
        items: {
          include: {
            category: true
          }
        }
      }
    });
    res.json(tenders);
  } catch (error) {
    console.error('Error fetching tenders:', error);
    res.status(500).json({ message: 'Error fetching tenders' });
  }
});

// Get a single tender by ID
router.get('/tenders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tender = await prisma.tender.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        items: {
          include: {
            category: true
          }
        },
        bids: {
          include: {
            bidder: true,
            items: true
          }
        }
      }
    });

    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    res.json(tender);
  } catch (error) {
    console.error('Error fetching tender:', error);
    res.status(500).json({ message: 'Error fetching tender' });
  }
});

// Create a new tender
router.post('/tenders', async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      startDate,
      endDate,
      categoryId,
      items
    } = req.body;

    // Validate required fields
    if (!title || !categoryId || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Title, Category, Start Date, and End Date are required' 
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Create tender with items
    const tender = await prisma.tender.create({
      data: {
        title,
        description,
        status: status || 'DRAFT',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        categoryId,
        createdBy: 1, // TODO: Replace with actual user ID from auth
        items: {
          create: items?.map((item: any) => ({
            categoryId: item.categoryId,
            quantity: item.quantity,
            specifications: item.specifications || null
          }))
        }
      },
      include: {
        category: true,
        items: {
          include: {
            category: true
          }
        }
      }
    });

    res.json(tender);
  } catch (error) {
    console.error('Error creating tender:', error);
    res.status(500).json({ message: 'Error creating tender' });
  }
});

// Update tender status
router.patch('/tenders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const tender = await prisma.tender.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        category: true
      }
    });

    res.json(tender);
  } catch (error) {
    console.error('Error updating tender status:', error);
    res.status(500).json({ message: 'Error updating tender status' });
  }
});

// Add items to tender
router.post('/tenders/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const tender = await prisma.tender.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }

    const createdItems = await prisma.tenderItem.createMany({
      data: items.map((item: any) => ({
        tenderId: parseInt(id),
        categoryId: item.categoryId,
        quantity: item.quantity,
        specifications: item.specifications || null
      }))
    });

    res.json(createdItems);
  } catch (error) {
    console.error('Error adding tender items:', error);
    res.status(500).json({ message: 'Error adding tender items' });
  }
});

// Delete tender item
router.delete('/tenders/:tenderId/items/:itemId', async (req, res) => {
  try {
    const { tenderId, itemId } = req.params;

    const item = await prisma.tenderItem.findFirst({
      where: {
        id: parseInt(itemId),
        tenderId: parseInt(tenderId)
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Tender item not found' });
    }

    await prisma.tenderItem.delete({
      where: { id: parseInt(itemId) }
    });

    res.json({ message: 'Tender item deleted successfully' });
  } catch (error) {
    console.error('Error deleting tender item:', error);
    res.status(500).json({ message: 'Error deleting tender item' });
  }
});

export default router; 