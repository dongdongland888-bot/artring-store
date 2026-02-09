#!/bin/sh
set -e

echo "⏳ Waiting for MySQL to be ready..."
# Simple retry loop to wait for MySQL
MAX_RETRIES=30
RETRY_COUNT=0
until npx prisma db push --skip-generate 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ MySQL is still not ready after ${MAX_RETRIES} attempts. Exiting."
    exit 1
  fi
  echo "⏳ MySQL not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES)... retrying in 3s"
  sleep 3
done

echo "✅ Database schema pushed successfully!"

# Seed database (only if no products exist yet)
echo "🌱 Checking if database needs seeding..."
NEED_SEED=$(node --input-type=module -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const count = await prisma.product.count();
await prisma.\$disconnect();
if (count === 0) {
  process.stdout.write('yes');
} else {
  process.stdout.write('no');
}
" 2>/dev/null || echo "yes")

if [ "$NEED_SEED" = "yes" ]; then
  echo "📦 Database is empty, running seed..."
  node prisma/seed.js || echo "⚠️ Seed failed, continuing anyway..."
else
  echo "✅ Database already has data, skipping seed."
fi

echo "🚀 Starting server..."
exec node src/index.js
