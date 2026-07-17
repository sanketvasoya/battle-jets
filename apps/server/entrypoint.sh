#!/bin/sh
set -e
cd /app/apps/server
npx prisma migrate deploy --schema=../../database/schema.prisma
exec node dist/main
