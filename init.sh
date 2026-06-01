#!/bin/bash
set -e

echo "🥍 LacrosseBoss — Project Setup"
echo "================================"

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is required. Install it from https://docs.docker.com/get-docker/"
  exit 1
fi

# Setup .env.local
if [ ! -f .env.local ]; then
  echo ""
  echo "📝 Supabase configuration"
  read -p "  Supabase project URL: " SUPABASE_URL
  read -p "  Supabase anon key: " SUPABASE_ANON_KEY

  cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
EOF
  echo "  ✅ .env.local created"
else
  echo "✅ .env.local already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
docker run --rm -v "$(pwd)":/work -w /work node:22-slim npm install
sudo chown -R "$(id -u):$(id -g)" node_modules package-lock.json

# Run Supabase migrations
echo ""
echo "🗄️  Database migrations"
read -p "  Run migrations against your Supabase DB? (y/N): " RUN_MIGRATIONS

if [[ "$RUN_MIGRATIONS" =~ ^[Yy]$ ]]; then
  read -p "  Supabase DB connection string (postgresql://...): " DB_URL
  for f in supabase/migrations/*.sql; do
    echo "  Applying $(basename "$f")..."
    docker run --rm -v "$(pwd)":/work -w /work --network host \
      postgres:16-alpine psql "$DB_URL" -f "/work/$f"
  done
  echo "  ✅ Migrations applied"
else
  echo "  ⏭️  Skipped. Run migrations manually later."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start dev server:"
echo "  docker run --rm -v \$(pwd):/work -w /work -p 3000:3000 node:22-slim npm run dev -- -H 0.0.0.0"
