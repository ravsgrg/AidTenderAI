import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory,
  inventoryCategories, InventoryCategory, InsertInventoryCategory,
  tenders, Tender, InsertTender,
  tenderItems, TenderItem, InsertTenderItem,
  bidders, Bidder, InsertBidder,
  bids, Bid, InsertBid,
  bidItems, BidItem, InsertBidItem,
  aiInsights, AiInsight, InsertAiInsight
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Inventory Category methods
  getInventoryCategories(): Promise<InventoryCategory[]>;
  getInventoryCategory(id: number): Promise<InventoryCategory | undefined>;
  createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory>;
  updateInventoryCategory(id: number, category: Partial<InsertInventoryCategory>): Promise<InventoryCategory | undefined>;
  deleteInventoryCategory(id: number): Promise<boolean>;
  
  // Tender methods
  getTenders(): Promise<Tender[]>;
  getTender(id: number): Promise<Tender | undefined>;
  createTender(tender: InsertTender): Promise<Tender>;
  updateTender(id: number, tender: Partial<InsertTender>): Promise<Tender | undefined>;
  deleteTender(id: number): Promise<boolean>;
  
  // Tender Item methods
  getTenderItems(tenderId: number): Promise<TenderItem[]>;
  getTenderItem(id: number): Promise<TenderItem | undefined>;
  createTenderItem(tenderItem: InsertTenderItem): Promise<TenderItem>;
  updateTenderItem(id: number, tenderItem: Partial<InsertTenderItem>): Promise<TenderItem | undefined>;
  deleteTenderItem(id: number): Promise<boolean>;
  
  // Bidder methods
  getBidders(): Promise<Bidder[]>;
  getBidder(id: number): Promise<Bidder | undefined>;
  createBidder(bidder: InsertBidder): Promise<Bidder>;
  updateBidder(id: number, bidder: Partial<InsertBidder>): Promise<Bidder | undefined>;
  deleteBidder(id: number): Promise<boolean>;
  
  // Bid methods
  getBids(): Promise<Bid[]>;
  getBidsByTender(tenderId: number): Promise<Bid[]>;
  getBidsByBidder(bidderId: number): Promise<Bid[]>;
  getBid(id: number): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  updateBid(id: number, bid: Partial<InsertBid>): Promise<Bid | undefined>;
  deleteBid(id: number): Promise<boolean>;
  
  // Bid Item methods
  getBidItems(bidId: number): Promise<BidItem[]>;
  getBidItem(id: number): Promise<BidItem | undefined>;
  createBidItem(bidItem: InsertBidItem): Promise<BidItem>;
  updateBidItem(id: number, bidItem: Partial<InsertBidItem>): Promise<BidItem | undefined>;
  deleteBidItem(id: number): Promise<boolean>;
  
  // AI Insight methods
  getAiInsights(): Promise<AiInsight[]>;
  getAiInsightsByTender(tenderId: number): Promise<AiInsight[]>;
  getAiInsightsByBidder(bidderId: number): Promise<AiInsight[]>;
  getAiInsight(id: number): Promise<AiInsight | undefined>;
  createAiInsight(aiInsight: InsertAiInsight): Promise<AiInsight>;
  deleteAiInsight(id: number): Promise<boolean>;
  
  // Analytics methods
  getTenderStats(): Promise<any>;
  getBidderAnalytics(): Promise<any>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private inventoryCategories: Map<number, InventoryCategory>;
  private tenders: Map<number, Tender>;
  private tenderItems: Map<number, TenderItem>;
  private bidders: Map<number, Bidder>;
  private bids: Map<number, Bid>;
  private bidItems: Map<number, BidItem>;
  private aiInsights: Map<number, AiInsight>;
  
  sessionStore: session.Store;
  
  currentUserId: number;
  currentCategoryId: number;
  currentInventoryCategoryId: number;
  currentTenderId: number;
  currentTenderItemId: number;
  currentBidderId: number;
  currentBidId: number;
  currentBidItemId: number;
  currentAiInsightId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.tenders = new Map();
    this.tenderItems = new Map();
    this.bidders = new Map();
    this.bids = new Map();
    this.bidItems = new Map();
    this.aiInsights = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentTenderId = 1;
    this.currentTenderItemId = 1;
    this.currentBidderId = 1;
    this.currentBidId = 1;
    this.currentBidItemId = 1;
    this.currentAiInsightId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Tender methods
  async getTenders(): Promise<Tender[]> {
    return Array.from(this.tenders.values());
  }
  
  async getTender(id: number): Promise<Tender | undefined> {
    return this.tenders.get(id);
  }
  
  async createTender(tender: InsertTender): Promise<Tender> {
    const id = this.currentTenderId++;
    const newTender: Tender = { 
      ...tender, 
      id, 
      createdAt: tender.createdAt || new Date() 
    };
    this.tenders.set(id, newTender);
    return newTender;
  }
  
  async updateTender(id: number, tender: Partial<InsertTender>): Promise<Tender | undefined> {
    const existingTender = this.tenders.get(id);
    if (!existingTender) return undefined;
    
    const updatedTender = { ...existingTender, ...tender };
    this.tenders.set(id, updatedTender);
    return updatedTender;
  }
  
  async deleteTender(id: number): Promise<boolean> {
    return this.tenders.delete(id);
  }
  
  // Tender Item methods
  async getTenderItems(tenderId: number): Promise<TenderItem[]> {
    return Array.from(this.tenderItems.values()).filter(
      (item) => item.tenderId === tenderId
    );
  }
  
  async getTenderItem(id: number): Promise<TenderItem | undefined> {
    return this.tenderItems.get(id);
  }
  
  async createTenderItem(tenderItem: InsertTenderItem): Promise<TenderItem> {
    const id = this.currentTenderItemId++;
    const newTenderItem: TenderItem = { ...tenderItem, id };
    this.tenderItems.set(id, newTenderItem);
    return newTenderItem;
  }
  
  async updateTenderItem(id: number, tenderItem: Partial<InsertTenderItem>): Promise<TenderItem | undefined> {
    const existingTenderItem = this.tenderItems.get(id);
    if (!existingTenderItem) return undefined;
    
    const updatedTenderItem = { ...existingTenderItem, ...tenderItem };
    this.tenderItems.set(id, updatedTenderItem);
    return updatedTenderItem;
  }
  
  async deleteTenderItem(id: number): Promise<boolean> {
    return this.tenderItems.delete(id);
  }
  
  // Bidder methods
  async getBidders(): Promise<Bidder[]> {
    return Array.from(this.bidders.values());
  }
  
  async getBidder(id: number): Promise<Bidder | undefined> {
    return this.bidders.get(id);
  }
  
  async createBidder(bidder: InsertBidder): Promise<Bidder> {
    const id = this.currentBidderId++;
    const newBidder: Bidder = { ...bidder, id };
    this.bidders.set(id, newBidder);
    return newBidder;
  }
  
  async updateBidder(id: number, bidder: Partial<InsertBidder>): Promise<Bidder | undefined> {
    const existingBidder = this.bidders.get(id);
    if (!existingBidder) return undefined;
    
    const updatedBidder = { ...existingBidder, ...bidder };
    this.bidders.set(id, updatedBidder);
    return updatedBidder;
  }
  
  async deleteBidder(id: number): Promise<boolean> {
    return this.bidders.delete(id);
  }
  
  // Bid methods
  async getBids(): Promise<Bid[]> {
    return Array.from(this.bids.values());
  }
  
  async getBidsByTender(tenderId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.tenderId === tenderId
    );
  }
  
  async getBidsByBidder(bidderId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.bidderId === bidderId
    );
  }
  
  async getBid(id: number): Promise<Bid | undefined> {
    return this.bids.get(id);
  }
  
  async createBid(bid: InsertBid): Promise<Bid> {
    const id = this.currentBidId++;
    const newBid: Bid = { 
      ...bid, 
      id, 
      submissionDate: new Date() 
    };
    this.bids.set(id, newBid);
    return newBid;
  }
  
  async updateBid(id: number, bid: Partial<InsertBid>): Promise<Bid | undefined> {
    const existingBid = this.bids.get(id);
    if (!existingBid) return undefined;
    
    const updatedBid = { ...existingBid, ...bid };
    this.bids.set(id, updatedBid);
    return updatedBid;
  }
  
  async deleteBid(id: number): Promise<boolean> {
    return this.bids.delete(id);
  }
  
  // Bid Item methods
  async getBidItems(bidId: number): Promise<BidItem[]> {
    return Array.from(this.bidItems.values()).filter(
      (item) => item.bidId === bidId
    );
  }
  
  async getBidItem(id: number): Promise<BidItem | undefined> {
    return this.bidItems.get(id);
  }
  
  async createBidItem(bidItem: InsertBidItem): Promise<BidItem> {
    const id = this.currentBidItemId++;
    const newBidItem: BidItem = { ...bidItem, id };
    this.bidItems.set(id, newBidItem);
    return newBidItem;
  }
  
  async updateBidItem(id: number, bidItem: Partial<InsertBidItem>): Promise<BidItem | undefined> {
    const existingBidItem = this.bidItems.get(id);
    if (!existingBidItem) return undefined;
    
    const updatedBidItem = { ...existingBidItem, ...bidItem };
    this.bidItems.set(id, updatedBidItem);
    return updatedBidItem;
  }
  
  async deleteBidItem(id: number): Promise<boolean> {
    return this.bidItems.delete(id);
  }
  
  // AI Insight methods
  async getAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values());
  }
  
  async getAiInsightsByTender(tenderId: number): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).filter(
      (insight) => insight.tenderId === tenderId
    );
  }
  
  async getAiInsightsByBidder(bidderId: number): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).filter(
      (insight) => insight.bidderId === bidderId
    );
  }
  
  async getAiInsight(id: number): Promise<AiInsight | undefined> {
    return this.aiInsights.get(id);
  }
  
  async createAiInsight(aiInsight: InsertAiInsight): Promise<AiInsight> {
    const id = this.currentAiInsightId++;
    const newAiInsight: AiInsight = { 
      ...aiInsight, 
      id, 
      createdAt: new Date() 
    };
    this.aiInsights.set(id, newAiInsight);
    return newAiInsight;
  }
  
  async deleteAiInsight(id: number): Promise<boolean> {
    return this.aiInsights.delete(id);
  }
  
  // Analytics methods
  async getTenderStats(): Promise<any> {
    const tenders = Array.from(this.tenders.values());
    const bids = Array.from(this.bids.values());
    
    const activeTenders = tenders.filter(t => t.status === 'open').length;
    const closedTenders = tenders.filter(t => t.status === 'closed').length;
    const awardedTenders = tenders.filter(t => t.status === 'awarded').length;
    
    // Calculate total value of all active tenders
    const totalValue = bids.reduce((sum, bid) => sum + bid.totalAmount, 0);
    
    return {
      activeTenders,
      closedTenders,
      awardedTenders,
      totalValue,
      totalTenders: tenders.length,
      totalBids: bids.length,
      averageBidsPerTender: tenders.length > 0 ? bids.length / tenders.length : 0
    };
  }
  
  async getBidderAnalytics(): Promise<any> {
    const bidders = Array.from(this.bidders.values());
    const bids = Array.from(this.bids.values());
    
    const qualifiedBidders = bidders.filter(b => b.verified).length;
    const totalBidders = bidders.length;
    
    // Get bidders with most bids
    const bidderBidCounts = bidders.map(bidder => {
      const bidderBids = bids.filter(b => b.bidderId === bidder.id);
      return {
        id: bidder.id,
        name: bidder.name,
        bidCount: bidderBids.length,
        totalAmount: bidderBids.reduce((sum, bid) => sum + bid.totalAmount, 0)
      };
    }).sort((a, b) => b.bidCount - a.bidCount);
    
    return {
      qualifiedBidders,
      totalBidders,
      topBidders: bidderBidCounts.slice(0, 5)
    };
  }
  
  // Seed initial data
  private seedData() {
    // Create admin user
    this.users.set(1, {
      id: 1,
      username: 'admin',
      password: '$2b$10$Kta1WtQwiSyxaxaCNE6jVeupQQsyWjG0BVzECAL9Z0KbLHgPgQZVu', // "password"
      fullName: 'Admin User',
      role: 'admin'
    });
    this.currentUserId = 2;
    
    // Create categories
    const categories = [
      { id: 1, name: 'Basic Hardware', description: 'Basic construction materials and hardware supplies' },
      { id: 2, name: 'Pipes & Fittings', description: 'All types of pipes and pipe fittings' },
      { id: 3, name: 'Electrical', description: 'Electrical equipment and supplies' },
      { id: 4, name: 'Manufactured Items', description: 'Pre-manufactured items and equipment' },
    ];
    
    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
    this.currentCategoryId = categories.length + 1;
    
    // Create bidders
    const bidders = [
      { 
        id: 1, 
        name: 'ABC Contractors', 
        contactPerson: 'John Smith', 
        email: 'john@abccontractors.com', 
        phone: '+1234567890', 
        address: '123 Main St, City', 
        rating: 4, 
        verified: true 
      },
      { 
        id: 2, 
        name: 'XYZ Supplies', 
        contactPerson: 'Jane Doe', 
        email: 'jane@xyzsupplies.com', 
        phone: '+0987654321', 
        address: '456 Oak Ave, Town', 
        rating: 5, 
        verified: true 
      },
      { 
        id: 3, 
        name: 'City Builders', 
        contactPerson: 'Mike Johnson', 
        email: 'mike@citybuilders.com', 
        phone: '+1122334455', 
        address: '789 Pine Rd, Village', 
        rating: 3, 
        verified: true 
      }
    ];
    
    bidders.forEach(bidder => {
      this.bidders.set(bidder.id, bidder);
    });
    this.currentBidderId = bidders.length + 1;
    
    // Create tenders
    const tenders = [
      { 
        id: 1, 
        title: 'Community Center Plumbing Materials', 
        description: 'Supply of plumbing materials for community center construction', 
        categoryId: 2, 
        status: 'open', 
        deadline: new Date('2023-05-15'), 
        createdBy: 1, 
        createdAt: new Date('2023-04-01') 
      },
      { 
        id: 2, 
        title: 'School Renovation Hardware Supplies', 
        description: 'Hardware supplies for school renovation project', 
        categoryId: 1, 
        status: 'under review', 
        deadline: new Date('2023-04-30'), 
        createdBy: 1, 
        createdAt: new Date('2023-03-15') 
      },
      { 
        id: 3, 
        title: 'Healthcare Facility Equipment', 
        description: 'Equipment for new healthcare facility', 
        categoryId: 4, 
        status: 'awarded', 
        deadline: new Date('2023-04-10'), 
        createdBy: 1, 
        createdAt: new Date('2023-03-01') 
      }
    ];
    
    tenders.forEach(tender => {
      this.tenders.set(tender.id, tender);
    });
    this.currentTenderId = tenders.length + 1;
    
    // Create tender items
    const tenderItems = [
      { id: 1, tenderId: 1, name: 'PVC Pipes 2"', description: '2 inch PVC pipes', quantity: 50, unit: 'meters', estimatedPrice: 5.5 },
      { id: 2, tenderId: 1, name: 'PVC Elbow Joints', description: '2 inch PVC elbow joints', quantity: 20, unit: 'pcs', estimatedPrice: 1.2 },
      { id: 3, tenderId: 1, name: 'Water Taps', description: 'Stainless steel water taps', quantity: 10, unit: 'pcs', estimatedPrice: 15 },
      
      { id: 4, tenderId: 2, name: 'Door Hinges', description: 'Metal door hinges', quantity: 30, unit: 'pairs', estimatedPrice: 3 },
      { id: 5, tenderId: 2, name: 'Door Handles', description: 'Metal door handles', quantity: 15, unit: 'pcs', estimatedPrice: 8 },
      
      { id: 6, tenderId: 3, name: 'Hospital Beds', description: 'Standard hospital beds', quantity: 5, unit: 'pcs', estimatedPrice: 500 },
      { id: 7, tenderId: 3, name: 'Examination Tables', description: 'Medical examination tables', quantity: 3, unit: 'pcs', estimatedPrice: 300 }
    ];
    
    tenderItems.forEach(item => {
      this.tenderItems.set(item.id, item);
    });
    this.currentTenderItemId = tenderItems.length + 1;
    
    // Create bids
    const bids = [
      { 
        id: 1, 
        tenderId: 1, 
        bidderId: 1, 
        totalAmount: 350, 
        submissionDate: new Date('2023-04-10'), 
        status: 'submitted', 
        notes: 'Can deliver within 2 weeks', 
        aiScore: 85 
      },
      { 
        id: 2, 
        tenderId: 1, 
        bidderId: 2, 
        totalAmount: 380, 
        submissionDate: new Date('2023-04-12'), 
        status: 'submitted', 
        notes: 'Premium quality materials', 
        aiScore: 78 
      },
      { 
        id: 3, 
        tenderId: 2, 
        bidderId: 1, 
        totalAmount: 190, 
        submissionDate: new Date('2023-04-05'), 
        status: 'under review', 
        notes: 'Fast delivery guaranteed', 
        aiScore: 90 
      },
      { 
        id: 4, 
        tenderId: 2, 
        bidderId: 3, 
        totalAmount: 200, 
        submissionDate: new Date('2023-04-08'), 
        status: 'under review', 
        notes: 'Best quality in market', 
        aiScore: 82 
      },
      { 
        id: 5, 
        tenderId: 3, 
        bidderId: 2, 
        totalAmount: 3200, 
        submissionDate: new Date('2023-03-20'), 
        status: 'accepted', 
        notes: 'Medical grade equipment', 
        aiScore: 92 
      }
    ];
    
    bids.forEach(bid => {
      this.bids.set(bid.id, bid);
    });
    this.currentBidId = bids.length + 1;
    
    // Create bid items
    const bidItems = [
      { id: 1, bidId: 1, tenderItemId: 1, unitPrice: 5, totalPrice: 250 },
      { id: 2, bidId: 1, tenderItemId: 2, unitPrice: 1, totalPrice: 20 },
      { id: 3, bidId: 1, tenderItemId: 3, unitPrice: 8, totalPrice: 80 },
      
      { id: 4, bidId: 2, tenderItemId: 1, unitPrice: 5.5, totalPrice: 275 },
      { id: 5, bidId: 2, tenderItemId: 2, unitPrice: 1.1, totalPrice: 22 },
      { id: 6, bidId: 2, tenderItemId: 3, unitPrice: 8.3, totalPrice: 83 },
      
      { id: 7, bidId: 3, tenderItemId: 4, unitPrice: 3, totalPrice: 90 },
      { id: 8, bidId: 3, tenderItemId: 5, unitPrice: 6.7, totalPrice: 100 },
      
      { id: 9, bidId: 4, tenderItemId: 4, unitPrice: 3.5, totalPrice: 105 },
      { id: 10, bidId: 4, tenderItemId: 5, unitPrice: 6.3, totalPrice: 95 },
      
      { id: 11, bidId: 5, tenderItemId: 6, unitPrice: 450, totalPrice: 2250 },
      { id: 12, bidId: 5, tenderItemId: 7, unitPrice: 320, totalPrice: 960 }
    ];
    
    bidItems.forEach(item => {
      this.bidItems.set(item.id, item);
    });
    this.currentBidItemId = bidItems.length + 1;
    
    // Create AI insights
    const aiInsights = [
      {
        id: 1,
        tenderId: 1,
        bidderId: null,
        type: 'price_trend',
        title: 'Price Trend Alert',
        description: 'Steel prices expected to rise 5% in next quarter based on market analysis.',
        createdAt: new Date('2023-04-15'),
        severity: 'info',
        metadata: { priceChange: '+5%', timeframe: 'Q2 2023' }
      },
      {
        id: 2,
        tenderId: null,
        bidderId: null,
        type: 'recommendation',
        title: 'Recommendation',
        description: '3 new qualified bidders identified for upcoming electrical works tender.',
        createdAt: new Date('2023-04-14'),
        severity: 'success',
        metadata: { bidderCount: 3, category: 'Electrical' }
      },
      {
        id: 3,
        tenderId: null,
        bidderId: 1,
        type: 'warning',
        title: 'Compliance Warning',
        description: 'Documentation inconsistencies detected in ABC Contractors\' recent submissions.',
        createdAt: new Date('2023-04-12'),
        severity: 'warning',
        metadata: { issueType: 'Documentation', bidder: 'ABC Contractors' }
      }
    ];
    
    aiInsights.forEach(insight => {
      this.aiInsights.set(insight.id, insight);
    });
    this.currentAiInsightId = aiInsights.length + 1;
  }
}

export const storage = new MemStorage();
