echo "🏗️  Testing Foundation Setup"
echo "============================"

# Check if backend is running
echo "Checking backend connectivity..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Backend is running on port 3000"
else
    echo "Backend is not running. Please start with: npm run start:dev"
    exit 1
fi

# Check if frontend can start
echo "Checking frontend setup..."
cd /Users/ade/goaltrack/frontend

if npm run build > /dev/null 2>&1; then
    echo "Frontend builds successfully"
else
    echo "Frontend build failed"
    exit 1
fi

echo "🧪 Running API integration tests..."
# Run API test suite
npm run test:api

echo "Foundation setup complete!"
echo "Next steps:"
echo "1. Start backend: cd backend && npm run start:dev"
echo "2. Start frontend: cd frontend && npm run dev"  
echo "3. Run integration tests: npm run test:integration"