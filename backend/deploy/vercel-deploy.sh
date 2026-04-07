#!/bin/bash

# Event Management System - Vercel Deployment Script
# Phase 5 - Production Deployment

set -e

echo "🚀 Starting Event Management System frontend deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the application
echo "📦 Building Next.js application..."
npm run build

# Deploy to Vercel
echo "🚂 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Application URL: https://your-domain.vercel.app"
echo "📊 Health Check: https://your-domain.vercel.app/api/health"
