import { PrismaClient } from '@prisma/client';
import { 
  User, InsertUser,
  Category, InsertCategory,
  InventoryCategory, InsertInventoryCategory,
  Tender, InsertTender,
  TenderItem, InsertTenderItem,
  Bidder, InsertBidder,
  Bid, InsertBid,
  BidItem, InsertBidItem,
  AiInsight, InsertAiInsight
} from '@shared/schema';
import { IStorage } from './storage';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

// Setup session store
const PostgresSessionStore = connectPg(session);

export class PrismaStorage implements IStorage {
  private prisma: PrismaClient;
  sessionStore: session.Store;

  constructor() {
    this.prisma = new PrismaClient();
    // Initialize the session store with the DATABASE_URL env variable
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { username }
    });
    return user as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = await this.prisma.user.create({
      data: {
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        role: user.role || 'user',
      }
    });
    return newUser as User;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany();
    return categories as Category[];
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const category = await this.prisma.category.findUnique({
      where: { id }
    });
    return category as Category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory = await this.prisma.category.create({
      data: {
        name: category.name,
        description: category.description || null,
      }
    });
    return newCategory as Category;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: category
      });
      return updatedCategory as Category;
    } catch (err) {
      // Record not found
      return undefined;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await this.prisma.category.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Inventory Category methods
  async getInventoryCategories(): Promise<InventoryCategory[]> {
    const categories = await this.prisma.inventoryCategory.findMany();
    return categories as InventoryCategory[];
  }

  async getInventoryCategory(id: number): Promise<InventoryCategory | undefined> {
    const category = await this.prisma.inventoryCategory.findUnique({
      where: { id }
    });
    return category as InventoryCategory;
  }

  async createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory> {
    const newCategory = await this.prisma.inventoryCategory.create({
      data: {
        name: category.name,
        description: category.description || null,
        code: category.code,
      }
    });
    return newCategory as InventoryCategory;
  }

  async updateInventoryCategory(id: number, category: Partial<InsertInventoryCategory>): Promise<InventoryCategory | undefined> {
    try {
      const updatedCategory = await this.prisma.inventoryCategory.update({
        where: { id },
        data: category
      });
      return updatedCategory as InventoryCategory;
    } catch (err) {
      return undefined;
    }
  }

  async deleteInventoryCategory(id: number): Promise<boolean> {
    try {
      await this.prisma.inventoryCategory.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Tender methods
  async getTenders(): Promise<Tender[]> {
    const tenders = await this.prisma.tender.findMany();
    return tenders as Tender[];
  }

  async getTender(id: number): Promise<Tender | undefined> {
    const tender = await this.prisma.tender.findUnique({
      where: { id }
    });
    return tender as Tender;
  }

  async createTender(tender: InsertTender): Promise<Tender> {
    const newTender = await this.prisma.tender.create({
      data: {
        title: tender.title,
        description: tender.description,
        categoryId: tender.categoryId,
        status: tender.status || 'draft',
        deadline: new Date(tender.deadline),
        createdBy: tender.createdBy,
      }
    });
    return newTender as Tender;
  }

  async updateTender(id: number, tender: Partial<InsertTender>): Promise<Tender | undefined> {
    try {
      const updatedTender = await this.prisma.tender.update({
        where: { id },
        data: {
          ...tender,
          deadline: tender.deadline ? new Date(tender.deadline) : undefined,
        }
      });
      return updatedTender as Tender;
    } catch (err) {
      return undefined;
    }
  }

  async deleteTender(id: number): Promise<boolean> {
    try {
      await this.prisma.tender.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Tender Item methods
  async getTenderItems(tenderId: number): Promise<TenderItem[]> {
    const items = await this.prisma.tenderItem.findMany({
      where: { tenderId }
    });
    return items as TenderItem[];
  }

  async getTenderItem(id: number): Promise<TenderItem | undefined> {
    const item = await this.prisma.tenderItem.findUnique({
      where: { id }
    });
    return item as TenderItem;
  }

  async createTenderItem(tenderItem: InsertTenderItem): Promise<TenderItem> {
    const newItem = await this.prisma.tenderItem.create({
      data: {
        tenderId: tenderItem.tenderId,
        categoryId: tenderItem.categoryId,
        inventoryCategoryId: tenderItem.categoryId, // Use category ID as inventory category by default
        name: tenderItem.name,
        description: tenderItem.description || null,
        quantity: tenderItem.quantity,
        unit: tenderItem.unit,
        estimatedPrice: tenderItem.estimatedPrice || null,
        sku: tenderItem.sku || null,
        minQuantity: tenderItem.minQuantity || null,
        currentStock: tenderItem.currentStock || 0,
        location: tenderItem.location || null,
      }
    });
    return newItem as TenderItem;
  }

  async updateTenderItem(id: number, tenderItem: Partial<InsertTenderItem>): Promise<TenderItem | undefined> {
    try {
      const updatedItem = await this.prisma.tenderItem.update({
        where: { id },
        data: tenderItem
      });
      return updatedItem as TenderItem;
    } catch (err) {
      return undefined;
    }
  }

  async deleteTenderItem(id: number): Promise<boolean> {
    try {
      await this.prisma.tenderItem.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Bidder methods
  async getBidders(): Promise<Bidder[]> {
    const bidders = await this.prisma.bidder.findMany();
    return bidders as Bidder[];
  }

  async getBidder(id: number): Promise<Bidder | undefined> {
    const bidder = await this.prisma.bidder.findUnique({
      where: { id }
    });
    return bidder as Bidder;
  }

  async createBidder(bidder: InsertBidder): Promise<Bidder> {
    const newBidder = await this.prisma.bidder.create({
      data: {
        name: bidder.name,
        contactPerson: bidder.contactPerson,
        email: bidder.email,
        phone: bidder.phone,
        address: bidder.address || null,
        rating: bidder.rating || null,
        verified: bidder.verified || false,
      }
    });
    return newBidder as Bidder;
  }

  async updateBidder(id: number, bidder: Partial<InsertBidder>): Promise<Bidder | undefined> {
    try {
      const updatedBidder = await this.prisma.bidder.update({
        where: { id },
        data: bidder
      });
      return updatedBidder as Bidder;
    } catch (err) {
      return undefined;
    }
  }

  async deleteBidder(id: number): Promise<boolean> {
    try {
      await this.prisma.bidder.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Bid methods
  async getBids(): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany();
    return bids as Bid[];
  }

  async getBidsByTender(tenderId: number): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      where: { tenderId }
    });
    return bids as Bid[];
  }

  async getBidsByBidder(bidderId: number): Promise<Bid[]> {
    const bids = await this.prisma.bid.findMany({
      where: { bidderId }
    });
    return bids as Bid[];
  }

  async getBid(id: number): Promise<Bid | undefined> {
    const bid = await this.prisma.bid.findUnique({
      where: { id }
    });
    return bid as Bid;
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    const newBid = await this.prisma.bid.create({
      data: {
        tenderId: bid.tenderId,
        bidderId: bid.bidderId,
        totalAmount: bid.totalAmount,
        status: bid.status || 'submitted',
        notes: bid.notes || null,
        aiScore: bid.aiScore || null,
      }
    });
    return newBid as Bid;
  }

  async updateBid(id: number, bid: Partial<InsertBid>): Promise<Bid | undefined> {
    try {
      const updatedBid = await this.prisma.bid.update({
        where: { id },
        data: bid
      });
      return updatedBid as Bid;
    } catch (err) {
      return undefined;
    }
  }

  async deleteBid(id: number): Promise<boolean> {
    try {
      await this.prisma.bid.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Bid Item methods
  async getBidItems(bidId: number): Promise<BidItem[]> {
    const items = await this.prisma.bidItem.findMany({
      where: { bidId }
    });
    return items as BidItem[];
  }

  async getBidItem(id: number): Promise<BidItem | undefined> {
    const item = await this.prisma.bidItem.findUnique({
      where: { id }
    });
    return item as BidItem;
  }

  async createBidItem(bidItem: InsertBidItem): Promise<BidItem> {
    const newItem = await this.prisma.bidItem.create({
      data: {
        bidId: bidItem.bidId,
        tenderItemId: bidItem.tenderItemId,
        categoryId: bidItem.categoryId,
        unitPrice: bidItem.unitPrice,
        totalPrice: bidItem.totalPrice,
        alternativeItem: bidItem.alternativeItem || false,
        alternativeItemName: bidItem.alternativeItemName || null,
        alternativeItemDescription: bidItem.alternativeItemDescription || null,
        alternativeItemSku: bidItem.alternativeItemSku || null,
        deliveryTimeInDays: bidItem.deliveryTimeInDays || null,
        warrantyPeriodInDays: bidItem.warrantyPeriodInDays || null,
        complianceNotes: bidItem.complianceNotes || null,
      }
    });
    return newItem as BidItem;
  }

  async updateBidItem(id: number, bidItem: Partial<InsertBidItem>): Promise<BidItem | undefined> {
    try {
      const updatedItem = await this.prisma.bidItem.update({
        where: { id },
        data: bidItem
      });
      return updatedItem as BidItem;
    } catch (err) {
      return undefined;
    }
  }

  async deleteBidItem(id: number): Promise<boolean> {
    try {
      await this.prisma.bidItem.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // AI Insight methods
  async getAiInsights(): Promise<AiInsight[]> {
    const insights = await this.prisma.aiInsight.findMany();
    return insights as AiInsight[];
  }

  async getAiInsightsByTender(tenderId: number): Promise<AiInsight[]> {
    const insights = await this.prisma.aiInsight.findMany({
      where: { tenderId }
    });
    return insights as AiInsight[];
  }

  async getAiInsightsByBidder(bidderId: number): Promise<AiInsight[]> {
    const insights = await this.prisma.aiInsight.findMany({
      where: { bidderId }
    });
    return insights as AiInsight[];
  }

  async getAiInsight(id: number): Promise<AiInsight | undefined> {
    const insight = await this.prisma.aiInsight.findUnique({
      where: { id }
    });
    return insight as AiInsight;
  }

  async createAiInsight(aiInsight: InsertAiInsight): Promise<AiInsight> {
    const newInsight = await this.prisma.aiInsight.create({
      data: {
        tenderId: aiInsight.tenderId || null,
        bidderId: aiInsight.bidderId || null,
        type: aiInsight.type,
        title: aiInsight.title,
        description: aiInsight.description,
        severity: aiInsight.severity || 'info',
        metadata: aiInsight.metadata || null,
      }
    });
    return newInsight as AiInsight;
  }

  async deleteAiInsight(id: number): Promise<boolean> {
    try {
      await this.prisma.aiInsight.delete({
        where: { id }
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Analytics methods
  async getTenderStats(): Promise<any> {
    const activeTenders = await this.prisma.tender.count({
      where: {
        status: {
          in: ['draft', 'open']
        }
      }
    });
    
    const closedTenders = await this.prisma.tender.count({
      where: {
        status: {
          in: ['closed', 'awarded']
        }
      }
    });
    
    const totalBudget = await this.prisma.tender.aggregate({
      _sum: {
        budget: true
      },
      where: {
        status: 'open'
      }
    });
    
    const averageBidsPerTender = await this.prisma.bid.groupBy({
      by: ['tenderId'],
      _count: {
        _all: true
      }
    }).then(groups => {
      if (groups.length === 0) return 0;
      const total = groups.reduce((acc, curr) => acc + curr._count._all, 0);
      return total / groups.length;
    });
    
    return {
      activeTenders,
      closedTenders,
      totalBudget: totalBudget._sum.budget || 0,
      averageBidsPerTender
    };
  }

  async getBidderAnalytics(): Promise<any> {
    const totalBidders = await this.prisma.bidder.count();
    
    const qualifiedBidders = await this.prisma.bidder.count({
      where: {
        verified: true
      }
    });
    
    const topBidders = await this.prisma.bidder.findMany({
      take: 5,
      orderBy: {
        rating: 'desc'
      },
      where: {
        rating: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        rating: true
      }
    });
    
    const bidsByCategory = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            bidItems: true
          }
        }
      }
    });
    
    return {
      totalBidders,
      qualifiedBidders,
      topBidders,
      bidsByCategory: bidsByCategory.map(c => ({
        categoryId: c.id,
        categoryName: c.name,
        bidCount: c._count.bidItems
      }))
    };
  }

  // Initialize database with seed data
  async seedDatabase() {
    // Check if we already have users
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      console.log('Database already seeded, skipping seed operation');
      return;
    }

    console.log('Seeding database with initial data...');

    // Create admin user
    const adminUser = await this.prisma.user.create({
      data: {
        username: 'admin',
        password: '$2b$10$Kta1WtQwiSyxaxaCNE6jVeupQQsyWjG0BVzECAL9Z0KbLHgPgQZVu', // 'password'
        fullName: 'Admin User',
        role: 'admin'
      }
    });

    // Create categories
    const hardware = await this.prisma.category.create({
      data: {
        name: 'Basic Hardware',
        description: 'Basic construction hardware and supplies'
      }
    });

    const plumbing = await this.prisma.category.create({
      data: {
        name: 'Plumbing',
        description: 'Pipes, fittings, and plumbing supplies'
      }
    });

    const electrical = await this.prisma.category.create({
      data: {
        name: 'Electrical',
        description: 'Electrical components and wiring'
      }
    });

    // Create inventory categories
    const plumbingSupplies = await this.prisma.inventoryCategory.create({
      data: {
        name: 'Plumbing Supplies',
        description: 'Pipes, fittings, and fixtures for water systems',
        code: 'PLUMB'
      }
    });

    const constructionMaterials = await this.prisma.inventoryCategory.create({
      data: {
        name: 'Construction Materials',
        description: 'Basic building materials like cement, wood, and bricks',
        code: 'CONSTR'
      }
    });

    const electricalComponents = await this.prisma.inventoryCategory.create({
      data: {
        name: 'Electrical Components',
        description: 'Wiring, connectors, and electrical equipment',
        code: 'ELECT'
      }
    });

    const hvacEquipment = await this.prisma.inventoryCategory.create({
      data: {
        name: 'HVAC Equipment',
        description: 'Heating, ventilation, and air conditioning equipment',
        code: 'HVAC'
      }
    });

    const toolsHardware = await this.prisma.inventoryCategory.create({
      data: {
        name: 'Tools & Hardware',
        description: 'Hand tools, power tools, and hardware items',
        code: 'TOOLS'
      }
    });

    // Create a tender
    const tender = await this.prisma.tender.create({
      data: {
        title: 'Community Center Plumbing Materials',
        description: 'Supply of plumbing materials for the new community center project',
        categoryId: plumbing.id,
        status: 'open',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: adminUser.id
      }
    });

    // Create tender items
    const pvcPipes = await this.prisma.tenderItem.create({
      data: {
        tenderId: tender.id,
        categoryId: plumbing.id,
        inventoryCategoryId: plumbingSupplies.id,
        name: 'PVC Pipes (2-inch)',
        description: 'High-quality 2-inch PVC pipes for water supply',
        quantity: 100,
        unit: 'meters',
        estimatedPrice: 5.50,
        sku: 'PVC-2IN-100',
        minQuantity: 20,
        currentStock: 10,
        location: 'Warehouse A'
      }
    });

    const copperPipes = await this.prisma.tenderItem.create({
      data: {
        tenderId: tender.id,
        categoryId: plumbing.id,
        inventoryCategoryId: plumbingSupplies.id,
        name: 'Copper Pipes (1-inch)',
        description: 'Premium copper pipes for hot water systems',
        quantity: 50,
        unit: 'meters',
        estimatedPrice: 12.75,
        sku: 'COP-1IN-50',
        minQuantity: 10,
        currentStock: 5,
        location: 'Warehouse B'
      }
    });

    // Create bidders
    const bidder1 = await this.prisma.bidder.create({
      data: {
        name: 'ABC Contractors',
        contactPerson: 'John Smith',
        email: 'john@abccontractors.com',
        phone: '555-1234',
        address: '123 Main St, Anytown',
        rating: 4,
        verified: true
      }
    });

    const bidder2 = await this.prisma.bidder.create({
      data: {
        name: 'Quality Suppliers Ltd',
        contactPerson: 'Jane Doe',
        email: 'jane@qualitysuppliers.com',
        phone: '555-5678',
        address: '456 Oak Ave, Somewhere',
        rating: 5,
        verified: true
      }
    });

    const bidder3 = await this.prisma.bidder.create({
      data: {
        name: 'BuildRight Inc',
        contactPerson: 'Bob Johnson',
        email: 'bob@buildright.com',
        phone: '555-9012',
        address: '789 Pine Rd, Nowhere',
        rating: 3,
        verified: false
      }
    });

    // Create bids
    const bid1 = await this.prisma.bid.create({
      data: {
        tenderId: tender.id,
        bidderId: bidder1.id,
        totalAmount: 350.00,
        status: 'submitted',
        aiScore: 85
      }
    });

    const bid2 = await this.prisma.bid.create({
      data: {
        tenderId: tender.id,
        bidderId: bidder2.id,
        totalAmount: 420.00,
        status: 'submitted',
        aiScore: 92
      }
    });

    // Create bid items
    await this.prisma.bidItem.create({
      data: {
        bidId: bid1.id,
        tenderItemId: pvcPipes.id,
        categoryId: plumbing.id,
        unitPrice: 5.00,
        totalPrice: 500.00,
        deliveryTimeInDays: 7
      }
    });

    await this.prisma.bidItem.create({
      data: {
        bidId: bid1.id,
        tenderItemId: copperPipes.id,
        categoryId: plumbing.id,
        unitPrice: 12.00,
        totalPrice: 600.00,
        deliveryTimeInDays: 7
      }
    });

    await this.prisma.bidItem.create({
      data: {
        bidId: bid2.id,
        tenderItemId: pvcPipes.id,
        categoryId: plumbing.id,
        unitPrice: 5.25,
        totalPrice: 525.00,
        deliveryTimeInDays: 5
      }
    });

    await this.prisma.bidItem.create({
      data: {
        bidId: bid2.id,
        tenderItemId: copperPipes.id,
        categoryId: plumbing.id,
        unitPrice: 12.50,
        totalPrice: 625.00,
        deliveryTimeInDays: 5
      }
    });

    // Create AI insights
    await this.prisma.aiInsight.create({
      data: {
        tenderId: tender.id,
        type: 'price_trend',
        title: 'Rising PVC Pipe Prices',
        description: 'Current market analysis indicates PVC pipe prices are expected to rise by 8% in the next month. Consider expediting procurement.',
        severity: 'warning'
      }
    });

    await this.prisma.aiInsight.create({
      data: {
        tenderId: tender.id,
        bidderId: bidder2.id,
        type: 'recommendation',
        title: 'Highly Recommended Supplier',
        description: 'Quality Suppliers Ltd has consistently delivered high-quality materials on time in the past 10 projects.',
        severity: 'info'
      }
    });

    console.log('Database seeded successfully');
  }
}