#!/bin/bash

echo "🏊 Swim School Booking Platform - Startup Script"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

echo "${YELLOW}Step 1: Initializing Backend${NC}"
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --legacy-peer-deps
fi

echo "${GREEN}✅ Backend dependencies ready${NC}"
echo ""

echo "${YELLOW}Step 2: Seeding Database${NC}"
npm run seed
echo ""

echo "${YELLOW}Step 3: Starting Backend Server${NC}"
npm start &
BACKEND_PID=$!
echo "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"
echo "   API: http://localhost:5000"
echo ""

sleep 3

# Go back to root
cd ../

echo "${YELLOW}Step 4: Starting Frontend${NC}"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "${GREEN}✅ Frontend dependencies ready${NC}"
echo ""

npm start &
FRONTEND_PID=$!
echo "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"
echo "   App: http://localhost:3000"
echo ""

echo "=================================================="
echo "${GREEN}🎉 System Ready!${NC}"
echo "=================================================="
echo ""
echo "📍 Backend API:   http://localhost:5000"
echo "🖥️  Frontend App:  http://localhost:3000"
echo ""
echo "📋 Demo Credentials:"
echo "   Admin:     admin@swim.de / admin123"
echo "   Customer:  max@example.com / password123"
echo ""
echo "Press CTRL+C to stop all services"
echo ""

# Keep script running
wait
