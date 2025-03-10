import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.bidItem.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.tenderItem.deleteMany();
  await prisma.tender.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.bidder.deleteMany();
  await prisma.user.deleteMany();

  // Create categories that will be shared between inventory and tenders
  const categories = await Promise.all([
    // Equipment Categories
    prisma.category.create({
      data: {
        name: 'Heavy Equipment',
        description: 'Construction and earth-moving equipment',
        code: 'HEQ',
        cat_type: 'EQUIPMENT'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Light Equipment',
        description: 'Small tools and portable equipment',
        code: 'LEQ',
        cat_type: 'EQUIPMENT'
      }
    }),
    // Material Categories
    prisma.category.create({
      data: {
        name: 'Building Materials',
        description: 'Construction materials and supplies',
        code: 'BMA',
        cat_type: 'MATERIALS'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Electrical Materials',
        description: 'Electrical components and supplies',
        code: 'EMA',
        cat_type: 'MATERIALS'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Plumbing Materials',
        description: 'Plumbing supplies and fixtures',
        code: 'PMA',
        cat_type: 'MATERIALS'
      }
    }),
    // Service Categories
    prisma.category.create({
      data: {
        name: 'Professional Services',
        description: 'Consulting and professional services',
        code: 'PSV',
        cat_type: 'SERVICES'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Labor Services',
        description: 'Skilled and unskilled labor services',
        code: 'LSV',
        cat_type: 'SERVICES'
      }
    })
  ]);

  // Create admin user
  const hashedPassword = await hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  // Create sample bidders
  const bidders = await Promise.all([
    prisma.bidder.create({
      data: {
        name: 'ABC Construction Co.',
        email: 'bids@abcconstruction.com',
        phone: '+1234567890',
        address: '123 Builder Street, Construction City',
        contactPerson: 'John Builder',
        status: 'ACTIVE'
      }
    }),
    prisma.bidder.create({
      data: {
        name: 'XYZ Contractors Ltd.',
        email: 'procurement@xyzcontractors.com',
        phone: '+9876543210',
        address: '456 Contractor Avenue, Builder Town',
        contactPerson: 'Jane Contractor',
        status: 'ACTIVE'
      }
    })
  ]);

  // Create sample inventory items
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        item_no: 'HEQ001',
        desc: 'Excavator 20-ton',
        unit: 'UNIT',
        unit_cost: 75000,
        unit_weight: 20000,
        qty: 3,
        categoryId: categories[0].id
      }
    }),
    prisma.inventoryItem.create({
      data: {
        item_no: 'BMA001',
        desc: 'Portland Cement Type I',
        unit: 'BAG',
        unit_cost: 25,
        unit_weight: 40,
        qty: 2000,
        categoryId: categories[2].id
      }
    })
  ]);

  // Create a sample tender using the same categories
  const buildingTender = await prisma.tender.create({
    data: {
      title: 'Office Building Construction Project',
      description: 'Construction of a 5-story office building including all materials and labor',
      status: 'PUBLISHED',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      categoryId: categories[2].id, // Using Building Materials category
      createdBy: admin.id,
      items: {
        create: [
          {
            categoryId: categories[0].id, // Heavy Equipment category
            quantity: 2,
            specifications: 'Excavator for foundation work, minimum 20-ton capacity',
          },
          {
            categoryId: categories[2].id, // Building Materials category
            quantity: 1000,
            specifications: 'Portland cement Type I, 40kg bags',
          }
        ]
      }
    }
  });

  // Create sample bids
  const firstBid = await prisma.bid.create({
    data: {
      tenderId: buildingTender.id,
      bidderId: bidders[0].id,
      status: 'SUBMITTED',
      totalAmount: 285000,
      submittedAt: new Date(),
      items: {
        create: [
          {
            tenderItemId: 1, // First tender item
            unitPrice: 80000,
            quantity: 2,
            totalPrice: 160000
          },
          {
            tenderItemId: 2, // Second tender item
            unitPrice: 25,
            quantity: 1000,
            totalPrice: 25000
          }
        ]
      }
    }
  });

  console.log({
    categories: categories.length,
    inventoryItems: inventoryItems.length,
    users: 1,
    bidders: bidders.length,
    tenders: 1,
    bids: 1,
    message: 'Database seeded successfully'
  });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 