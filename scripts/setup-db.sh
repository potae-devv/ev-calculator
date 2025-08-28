#!/bin/bash

# EV Calculator Database Setup Script
# This script sets up the database using Prisma

echo "🚀 Setting up EV Calculator database..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
docker-compose up postgres -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec ev-calculator-postgres pg_isready -U postgres -d ev_calculator >/dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push database schema
echo "📋 Pushing database schema..."
npm run db:push

# Seed the database
echo "🌱 Seeding database with user accounts..."
npm run db:seed

echo "🎉 Database setup complete!"
echo ""
echo "📊 You can now:"
echo "  - Start the development server: npm run dev"
echo "  - View the database: npm run db:studio"
echo "  - Connect with psql: docker exec -it ev-calculator-postgres psql -U postgres -d ev_calculator"
echo ""
echo "🔑 Test user accounts:"
echo "  - admin@evcalculator.com / password (admin role)"
echo "  - user@evcalculator.com / password (user role)"
echo "  - demo@evcalculator.com / password (user role)"
