#!/bin/bash
# Seed script for ArtMatch AI database
# This script extracts database connection from .manus/db and runs the seed

set -e

cd "$(dirname "$0")/.."

# Extract database URL from .manus/db if DATABASE_URL is not set
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set, attempting to extract from .manus/db..."
  
  # Check if .manus/db exists
  if [ -d ".manus/db" ]; then
    # Extract connection info using Python
    export DATABASE_URL=$(python3 << 'EOF'
import json
import os
import urllib.parse

for f in os.listdir('.manus/db'):
    with open(f'.manus/db/{f}') as file:
        data = json.load(file)
        cmd = data.get('command', '')
        if '--host' in cmd:
            parts = cmd.split()
            host = parts[parts.index('--host') + 1] if '--host' in parts else ''
            port = parts[parts.index('--port') + 1] if '--port' in parts else '4000'
            user = parts[parts.index('--user') + 1] if '--user' in parts else ''
            database = parts[parts.index('--database') + 1] if '--database' in parts else ''
            url = f"mysql://{urllib.parse.quote(user, safe='')}@{host}:{port}/{database}?ssl={{\"rejectUnauthorized\":true}}"
            print(url)
            break
EOF
)
    echo "Extracted DATABASE_URL: $DATABASE_URL"
  else
    echo "Error: .manus/db directory not found and DATABASE_URL not set"
    exit 1
  fi
fi

echo "Running database seed..."
npx tsx server/seed.ts
