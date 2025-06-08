#!/bin/bash

echo "🧹 Setting up clean directory structure..."

# Create necessary directories
mkdir -p backend/images/cats
mkdir -p backend/images/not_cats

# Create .gitkeep files to preserve directory structure
touch backend/images/.gitkeep
touch backend/images/not_cats/.gitkeep

# Remove any accidentally committed images
if [ -d ".git" ]; then
    echo "📸 Removing cat images from git tracking..."
    git rm -r --cached backend/images/cats 2>/dev/null || true
    git rm --cached backend/images/*.jpg 2>/dev/null || true
    git rm --cached backend/images/*.jpeg 2>/dev/null || true
    git rm --cached backend/images/*.png 2>/dev/null || true
fi

echo "✅ Directory structure ready!"
echo ""
echo "Next steps:"
echo "1. Run: git add .gitignore backend/images/.gitkeep"
echo "2. Run: git commit -m 'Clean up image directories'"
echo "3. Run: git push"