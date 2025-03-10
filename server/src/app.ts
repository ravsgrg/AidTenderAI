import express from 'express';
import cors from 'cors';
import inventoryRoutes from './routes/inventory';
import categoryRoutes from './routes/category';
import tenderRoutes from './routes/tender';
import bidRoutes from './routes/bid';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', inventoryRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tenderRoutes);
app.use('/api', bidRoutes);

export default app; 