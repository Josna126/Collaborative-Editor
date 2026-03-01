# Setup script for Collaborative Editor
# Run this script to set up the project

Write-Host "🚀 Setting up Collaborative Editor..." -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`nChecking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "`nChecking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check for .env.local file
Write-Host "`nChecking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file found" -ForegroundColor Green
} else {
    Write-Host "⚠ .env.local file not found" -ForegroundColor Yellow
    Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
    
    $envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bboyzvyhvwtatqnnyted.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib3l6dnlodnd0YXRxbm55dGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzcwNDUsImV4cCI6MjA4Nzg1MzA0NX0.USUiyxBk5YNrAVNWFeWGpsSsnefW4kniOKXJv-b5EXE

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=http://localhost:3000
WS_PORT=3001
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ .env.local file created" -ForegroundColor Green
    Write-Host "⚠ Please update with your Supabase credentials if different" -ForegroundColor Yellow
}

# Display next steps
Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Ensure Supabase database is set up (run supabase-schema.sql)" -ForegroundColor White
Write-Host "2. Update .env.local with your Supabase credentials if needed" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "4. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "5. Open another browser window to test collaboration" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "- README.md - Setup and usage instructions" -ForegroundColor White
Write-Host "- ARCHITECTURE.md - System architecture and design decisions" -ForegroundColor White
Write-Host "- DEPLOYMENT.md - Production deployment guide" -ForegroundColor White

Write-Host "`n🎉 Happy coding!" -ForegroundColor Green
