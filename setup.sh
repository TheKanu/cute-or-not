#!/bin/bash

echo "🐱 Setting up Cute or Not Cat Voting App..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your database credentials!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create images directory
echo "📁 Creating images directory..."
mkdir -p backend/images

# Database setup
echo "🗄️  Setting up database..."
echo "Please ensure PostgreSQL is running and you have created a database named 'cute_or_not'"
echo "Run the following SQL commands in your PostgreSQL client:"
echo ""
echo "CREATE DATABASE cute_or_not;"
echo ""
echo "Then run: psql -U your_user -d cute_or_not -f backend/migrations/schema.sql"
echo ""

echo "✅ Setup complete! Run 'npm start' to start the server."