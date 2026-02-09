FROM node:18-alpine

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

WORKDIR /app

# Install all dependencies (including devDeps for prisma CLI)
COPY package*.json ./
RUN npm ci

# Copy source code and generate Prisma client
COPY . .
RUN npx prisma generate

# Remove devDependencies after prisma generate to keep image lean
RUN npm prune --production

# Keep prisma CLI available for db push in entrypoint
RUN npm install -g prisma@5.10.0

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

# Use entrypoint script to handle DB migration + seeding + startup
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
