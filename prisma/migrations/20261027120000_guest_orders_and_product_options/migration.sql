-- Additive changes so orders can be placed (with or without an account) and
-- products can carry bilingual text, sale price and size/colour options.

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "nameBn" TEXT;

-- AlterTable
ALTER TABLE "Product"
  ADD COLUMN "nameBn" TEXT,
  ADD COLUMN "descriptionBn" TEXT,
  ADD COLUMN "oldPrice" DECIMAL(10,2),
  ADD COLUMN "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "colors" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Order"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "orderNumber" TEXT NOT NULL,
  ADD COLUMN "idempotencyKey" TEXT NOT NULL,
  ADD COLUMN "accessToken" TEXT NOT NULL,
  ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
  ADD COLUMN "subtotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "deliveryNote" TEXT;

-- AlterTable
ALTER TABLE "OrderItem"
  ADD COLUMN "productName" TEXT NOT NULL,
  ADD COLUMN "size" TEXT,
  ADD COLUMN "color" TEXT;

-- DropIndex
DROP INDEX "OrderItem_orderId_productId_key";

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_size_color_key" ON "OrderItem"("orderId", "productId", "size", "color");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
