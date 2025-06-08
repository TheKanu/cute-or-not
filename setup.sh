#!/bin/bash

# Quick Start Script for Cute or Not
# This script helps you get up and running quickly

echo "🚀 Cute or Not - Quick Start"
echo "============================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v12 or higher."
    exit 1
fi
echo "✅ PostgreSQL found"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp example.env .env
    echo "📝 Created .env file. Please edit it with your database credentials."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📁 Creating directory structure..."
mkdir -p backend/images/cats
mkdir -p backend/images/not_cats
touch backend/images/.gitkeep
touch backend/images/not_cats/.gitkeep
echo "✅ Directories created"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your PostgreSQL credentials"
echo "2. Create the database: createdb cute_or_not"
echo "3. Run migrations: psql -U your_user -d cute_or_not -f backend/migrations/newtables.sql"
echo "4. Start the server: npm start"
echo ""
echo "Happy cat voting! 🐱"