#!/bin/bash

# Event Management System - Railway Deployment Script
# Phase 5 - Production Deployment

set -e

echo "🚀 Starting Event Management System deployment to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (expects RAILWAY_TOKEN env var)
echo "🔐 Logging into Railway..."
railway login

# Build and deploy
echo "📦 Building application..."
npm run build

echo "🚂 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Application URL: https://your-app-name.up.railway.app"
echo "📊 Health Check: https://your-app-name.up.railway.app/health"
