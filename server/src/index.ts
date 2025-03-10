import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import inventoryRoutes from './routes/inventory.js';
import categoryRoutes from './routes/categories.js';
import tenderRoutes from './routes/tender.js';
import bidRoutes from './routes/bid.js';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', inventoryRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tenderRoutes);
app.use('/api', bidRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0); 