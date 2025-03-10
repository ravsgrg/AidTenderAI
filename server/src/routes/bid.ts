import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all bids with their related data
router.get('/bids', async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      include: {
        tender: true,
        bidder: true,
        items: {
          include: {
            tenderItem: true
          }
        }
      }
    });
    res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ message: 'Error fetching bids' });
  }
});

// Get a single bid by ID
router.get('/bids/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bid = await prisma.bid.findUnique({
      where: { id: parseInt(id) },
      include: {
        tender: true,
        bidder: true,
        items: {
          include: {
            tenderItem: true
          }
        }
      }
    });

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    res.json(bid);
  } catch (error) {
    console.error('Error fetching bid:', error);
    res.status(500).json({ message: 'Error fetching bid' });
  }
});

// Create a new bid
router.post('/bids', async (req, res) => {
  try {
    const {
      tenderId,
      status,
      items
    } = req.body;

    // Validate required fields
    if (!tenderId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Tender ID and items are required' 
      });
    }

    // Check if tender exists and is published
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId }
    });

    if (!tender) {
      return res.status(400).json({ message: 'Invalid tender ID' });
    }

    if (tender.status !== 'PUBLISHED') {
      return res.status(400).json({ message: 'Cannot bid on unpublished tender' });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        tenderId,
        bidderId: 1, // TODO: Replace with actual bidder ID from auth
        status: status || 'DRAFT',
        totalAmount,
        items: {
          create: items.map(item => ({
            tenderItemId: item.tenderItemId,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.unitPrice * item.quantity
          }))
        }
      },
      include: {
        tender: true,
        bidder: true,
        items: {
          include: {
            tenderItem: true
          }
        }
      }
    });

    res.json(bid);
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({ message: 'Error creating bid' });
  }
});

// Update bid status
router.patch('/bids/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const bid = await prisma.bid.update({
      where: { id: parseInt(id) },
      data: {
        status,
        submittedAt: status === 'SUBMITTED' ? new Date() : undefined
      },
      include: {
        tender: true,
        bidder: true
      }
    });

    // If bid is accepted, reject all other bids for the same tender
    if (status === 'ACCEPTED') {
      await prisma.bid.updateMany({
        where: {
          tenderId: bid.tenderId,
          id: { not: bid.id },
          status: { not: 'REJECTED' }
        },
        data: {
          status: 'REJECTED'
        }
      });

      // Update tender status to AWARDED
      await prisma.tender.update({
        where: { id: bid.tenderId },
        data: { status: 'AWARDED' }
      });
    }

    res.json(bid);
  } catch (error) {
    console.error('Error updating bid status:', error);
    res.status(500).json({ message: 'Error updating bid status' });
  }
});

// Get bids for a specific tender
router.get('/tenders/:tenderId/bids', async (req, res) => {
  try {
    const { tenderId } = req.params;
    const bids = await prisma.bid.findMany({
      where: { tenderId: parseInt(tenderId) },
      include: {
        bidder: true,
        items: {
          include: {
            tenderItem: true
          }
        }
      }
    });
    res.json(bids);
  } catch (error) {
    console.error('Error fetching tender bids:', error);
    res.status(500).json({ message: 'Error fetching tender bids' });
  }
});

export default router; 