import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertCategorySchema, 
  insertTenderSchema, 
  insertTenderItemSchema, 
  insertBidderSchema, 
  insertBidSchema, 
  insertBidItemSchema,
  insertAiInsightSchema,
  insertInventoryCategorySchema,
  insertInventoryItemSchema
} from "@shared/schema";

// Helper for checking authentication
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(Number(req.params.id));
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(Number(req.params.id), validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteCategory(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Inventory Category routes
  app.get("/api/inventory-categories", async (req, res) => {
    try {
      const categories = await storage.getInventoryCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory categories" });
    }
  });

  app.get("/api/inventory-categories/:id", async (req, res) => {
    try {
      const category = await storage.getInventoryCategory(Number(req.params.id));
      if (!category) {
        return res.status(404).json({ message: "Inventory category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory category" });
    }
  });

  app.post("/api/inventory-categories", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInventoryCategorySchema.parse(req.body);
      const category = await storage.createInventoryCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory category" });
    }
  });

  app.put("/api/inventory-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInventoryCategorySchema.partial().parse(req.body);
      const category = await storage.updateInventoryCategory(Number(req.params.id), validatedData);
      if (!category) {
        return res.status(404).json({ message: "Inventory category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inventory category" });
    }
  });

  app.delete("/api/inventory-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteInventoryCategory(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Inventory category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory category" });
    }
  });

  // Tender routes
  app.get("/api/tenders", async (req, res) => {
    try {
      const tenders = await storage.getTenders();
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenders" });
    }
  });

  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const tender = await storage.getTender(Number(req.params.id));
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tender" });
    }
  });

  app.post("/api/tenders", isAuthenticated, async (req, res) => {
    try {
      const data = { ...req.body, createdBy: req.user?.id };
      const validatedData = insertTenderSchema.parse(data);
      const tender = await storage.createTender(validatedData);
      res.status(201).json(tender);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tender data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tender" });
    }
  });

  app.put("/api/tenders/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTenderSchema.partial().parse(req.body);
      const tender = await storage.updateTender(Number(req.params.id), validatedData);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tender data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tender" });
    }
  });

  app.delete("/api/tenders/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteTender(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Tender not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tender" });
    }
  });

  // Tender Item routes
  app.get("/api/tenders/:tenderId/items", async (req, res) => {
    try {
      const items = await storage.getTenderItems(Number(req.params.tenderId));
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tender items" });
    }
  });

  app.post("/api/tender-items", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTenderItemSchema.parse(req.body);
      const item = await storage.createTenderItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tender item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tender item" });
    }
  });

  app.put("/api/tender-items/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTenderItemSchema.partial().parse(req.body);
      const item = await storage.updateTenderItem(Number(req.params.id), validatedData);
      if (!item) {
        return res.status(404).json({ message: "Tender item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tender item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tender item" });
    }
  });

  app.delete("/api/tender-items/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteTenderItem(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Tender item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tender item" });
    }
  });

  // Bidder routes
  app.get("/api/bidders", async (req, res) => {
    try {
      const bidders = await storage.getBidders();
      res.json(bidders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bidders" });
    }
  });

  app.get("/api/bidders/:id", async (req, res) => {
    try {
      const bidder = await storage.getBidder(Number(req.params.id));
      if (!bidder) {
        return res.status(404).json({ message: "Bidder not found" });
      }
      res.json(bidder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bidder" });
    }
  });

  app.post("/api/bidders", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBidderSchema.parse(req.body);
      const bidder = await storage.createBidder(validatedData);
      res.status(201).json(bidder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bidder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bidder" });
    }
  });

  app.put("/api/bidders/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBidderSchema.partial().parse(req.body);
      const bidder = await storage.updateBidder(Number(req.params.id), validatedData);
      if (!bidder) {
        return res.status(404).json({ message: "Bidder not found" });
      }
      res.json(bidder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bidder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bidder" });
    }
  });

  app.delete("/api/bidders/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteBidder(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Bidder not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bidder" });
    }
  });

  // Bid routes
  app.get("/api/bids", async (req, res) => {
    try {
      const bids = await storage.getBids();
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get("/api/tenders/:tenderId/bids", async (req, res) => {
    try {
      const bids = await storage.getBidsByTender(Number(req.params.tenderId));
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bids for tender" });
    }
  });

  app.get("/api/bidders/:bidderId/bids", async (req, res) => {
    try {
      const bids = await storage.getBidsByBidder(Number(req.params.bidderId));
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bids for bidder" });
    }
  });

  app.get("/api/bids/:id", async (req, res) => {
    try {
      const bid = await storage.getBid(Number(req.params.id));
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      res.json(bid);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bid" });
    }
  });

  app.post("/api/bids", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBidSchema.parse(req.body);
      const bid = await storage.createBid(validatedData);
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bid" });
    }
  });

  app.put("/api/bids/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBidSchema.partial().parse(req.body);
      const bid = await storage.updateBid(Number(req.params.id), validatedData);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      res.json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bid" });
    }
  });

  app.delete("/api/bids/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteBid(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Bid not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bid" });
    }
  });

  // Bid Item routes
  app.get("/api/bids/:bidId/items", async (req, res) => {
    try {
      const items = await storage.getBidItems(Number(req.params.bidId));
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bid items" });
    }
  });

  app.post("/api/bid-items", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBidItemSchema.parse(req.body);
      const item = await storage.createBidItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bid item" });
    }
  });

  app.put("/api/bid-items/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBidItemSchema.partial().parse(req.body);
      const item = await storage.updateBidItem(Number(req.params.id), validatedData);
      if (!item) {
        return res.status(404).json({ message: "Bid item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bid item" });
    }
  });

  app.delete("/api/bid-items/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteBidItem(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Bid item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bid item" });
    }
  });

  // AI Insights routes
  app.get("/api/ai-insights", async (req, res) => {
    try {
      const insights = await storage.getAiInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  app.get("/api/tenders/:tenderId/ai-insights", async (req, res) => {
    try {
      const insights = await storage.getAiInsightsByTender(Number(req.params.tenderId));
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI insights for tender" });
    }
  });

  app.get("/api/bidders/:bidderId/ai-insights", async (req, res) => {
    try {
      const insights = await storage.getAiInsightsByBidder(Number(req.params.bidderId));
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI insights for bidder" });
    }
  });

  app.post("/api/ai-insights", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAiInsightSchema.parse(req.body);
      const insight = await storage.createAiInsight(validatedData);
      res.status(201).json(insight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid AI insight data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create AI insight" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/tender-stats", async (req, res) => {
    try {
      const stats = await storage.getTenderStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tender statistics" });
    }
  });

  app.get("/api/analytics/bidder-analytics", async (req, res) => {
    try {
      const analytics = await storage.getBidderAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bidder analytics" });
    }
  });

  // Inventory Item routes
  app.get("/api/inventory-items", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.get("/api/inventory-items/:id", async (req, res) => {
    try {
      const item = await storage.getInventoryItem(Number(req.params.id));
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  app.post("/api/inventory-items", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory-items/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(Number(req.params.id), validatedData);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory-items/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteInventoryItem(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
