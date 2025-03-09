import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

// Tender schema
export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  status: text("status").notNull().default("draft"), // draft, open, closed, awarded
  deadline: timestamp("deadline").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTenderSchema = createInsertSchema(tenders).pick({
  title: true,
  description: true,
  categoryId: true,
  status: true,
  deadline: true,
  createdBy: true,
});

// Inventory Category schema
export const inventoryCategories = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull(),
});

export const insertInventoryCategorySchema = createInsertSchema(inventoryCategories).pick({
  name: true,
  description: true,
  code: true,
});

// Tender Item schema
export const tenderItems = pgTable("tender_items", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(), // e.g. pcs, kg, m
  estimatedPrice: doublePrecision("estimated_price"),
  sku: text("sku"), // Stock Keeping Unit for inventory
  minQuantity: integer("min_quantity"), // Minimum quantity for inventory alert
  currentStock: integer("current_stock").default(0), // Current available stock
  location: text("location"), // Storage location
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertTenderItemSchema = createInsertSchema(tenderItems).pick({
  tenderId: true,
  categoryId: true,
  name: true,
  description: true,
  quantity: true,
  unit: true,
  estimatedPrice: true,
  sku: true,
  minQuantity: true,
  currentStock: true,
  location: true,
});

// Bidder schema
export const bidders = pgTable("bidders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  rating: integer("rating"),
  verified: boolean("verified").default(false),
});

export const insertBidderSchema = createInsertSchema(bidders).pick({
  name: true,
  contactPerson: true,
  email: true,
  phone: true,
  address: true,
  rating: true,
  verified: true,
});

// Bid schema
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull(),
  bidderId: integer("bidder_id").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  submissionDate: timestamp("submission_date").defaultNow(),
  status: text("status").notNull().default("submitted"), // submitted, under review, accepted, rejected
  notes: text("notes"),
  aiScore: integer("ai_score"),
});

export const insertBidSchema = createInsertSchema(bids).pick({
  tenderId: true,
  bidderId: true,
  totalAmount: true,
  status: true,
  notes: true,
  aiScore: true,
});

// Bid Items schema
export const bidItems = pgTable("bid_items", {
  id: serial("id").primaryKey(),
  bidId: integer("bid_id").notNull(),
  tenderItemId: integer("tender_item_id").notNull(),
  categoryId: integer("category_id").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  alternativeItem: boolean("alternative_item").default(false), // If bidder is offering an alternative item
  alternativeItemName: text("alternative_item_name"),
  alternativeItemDescription: text("alternative_item_description"),
  alternativeItemSku: text("alternative_item_sku"),
  deliveryTimeInDays: integer("delivery_time_days"),
  warrantyPeriodInDays: integer("warranty_period_days"),
  complianceNotes: text("compliance_notes"),
});

export const insertBidItemSchema = createInsertSchema(bidItems).pick({
  bidId: true,
  tenderItemId: true,
  categoryId: true,
  unitPrice: true,
  totalPrice: true,
  alternativeItem: true,
  alternativeItemName: true,
  alternativeItemDescription: true,
  alternativeItemSku: true,
  deliveryTimeInDays: true,
  warrantyPeriodInDays: true,
  complianceNotes: true,
});

// AI Insight schema
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id"),
  bidderId: integer("bidder_id"),
  type: text("type").notNull(), // price trend, recommendation, warning
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  severity: text("severity").notNull().default("info"), // info, warning, alert
  metadata: json("metadata"),
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).pick({
  tenderId: true,
  bidderId: true,
  type: true,
  title: true,
  description: true,
  severity: true,
  metadata: true,
});

// Inventory Item schema
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  sku: text("sku").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").notNull().default(0),
  location: text("location"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).pick({
  name: true,
  description: true,
  categoryId: true,
  sku: true,
  quantity: true,
  minQuantity: true,
  location: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type InventoryCategory = typeof inventoryCategories.$inferSelect;
export type InsertInventoryCategory = z.infer<typeof insertInventoryCategorySchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;

export type TenderItem = typeof tenderItems.$inferSelect;
export type InsertTenderItem = z.infer<typeof insertTenderItemSchema>;

export type Bidder = typeof bidders.$inferSelect;
export type InsertBidder = z.infer<typeof insertBidderSchema>;

export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;

export type BidItem = typeof bidItems.$inferSelect;
export type InsertBidItem = z.infer<typeof insertBidItemSchema>;

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;

import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const categorySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertCategorySchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const inventoryCategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertInventoryCategorySchema = inventoryCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const inventoryItemSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  quantity: z.number().int().min(0).default(0),
  unit: z.string().min(1).max(50),
  categoryId: z.number().int(),
  location: z.string().optional(),
  status: z.enum(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK']).default('AVAILABLE'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertInventoryItemSchema = inventoryItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});