import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all categories with their relationships
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        items: true,
        tenderItems: true
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get category by ID with relationships
router.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: true,
        children: true,
        items: true,
        tenderItems: true
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create a new category
router.post('/categories', async (req, res) => {
  try {
    const { name, description, code, cat_type, parent_id } = req.body;

    // Validate required fields
    if (!name || !cat_type) {
      return res.status(400).json({ message: 'Name and Category Type are required' });
    }

    // Check if category code already exists
    if (code) {
      const existingCategory = await prisma.category.findFirst({
        where: { code }
      });

      if (existingCategory) {
        return res.status(400).json({ message: 'Category code already exists' });
      }
    }

    // Validate parent category if provided
    if (parent_id) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parent_id }
      });

      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        code,
        cat_type,
        parent_id: parent_id || null
      },
      include: {
        parent: true,
        children: true
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update a category
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, code, cat_type, parent_id } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if updated code already exists (if code is being changed)
    if (code && code !== existingCategory.code) {
      const categoryWithCode = await prisma.category.findFirst({
        where: { code }
      });

      if (categoryWithCode) {
        return res.status(400).json({ message: 'Category code already exists' });
      }
    }

    // Validate parent category if provided
    if (parent_id) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parent_id }
      });

      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category not found' });
      }

      // Prevent circular reference
      if (parent_id === parseInt(id)) {
        return res.status(400).json({ message: 'Category cannot be its own parent' });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        code,
        cat_type,
        parent_id: parent_id || null
      },
      include: {
        parent: true,
        children: true
      }
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete a category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists and has no dependencies
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: true,
        items: true,
        tenderItems: true
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check for dependencies
    if (category.children.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

    if (category.items.length > 0 || category.tenderItems.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with associated items or tender items' 
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

export default router; 