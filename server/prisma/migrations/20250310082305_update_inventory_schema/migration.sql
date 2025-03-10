-- CreateTable
CREATE TABLE "inventory_items" (
    "item_no" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "unit_weight" DOUBLE PRECISION NOT NULL,
    "qty" INTEGER NOT NULL,
    "cat_type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("item_no")
);
