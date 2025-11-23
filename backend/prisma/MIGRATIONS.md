# Prisma Migrations Guide

## Current Migration Structure

```
prisma/
├── migrations/
│   ├── 20251123_init/
│   │   └── migration.sql       # Initial schema with password field
│   └── migration_lock.toml     # Database provider lock
├── db/                          # Generated Prisma Client
└── schema.prisma                # Schema definition
```

## Migration Commands

### Create a New Migration
When you change `schema.prisma`, run:
```bash
go run github.com/steebchen/prisma-client-go migrate dev --name your_migration_name
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Regenerate the Prisma Client

### Apply Pending Migrations
To apply migrations on another environment:
```bash
go run github.com/steebchen/prisma-client-go migrate deploy
```

### Check Migration Status
```bash
go run github.com/steebchen/prisma-client-go migrate status
```

### View Migration Diff
To see what SQL will be generated:
```bash
go run github.com/steebchen/prisma-client-go migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script
```

## Important Notes

- ✅ **Use `migrate dev`** for development (creates migration files)
- ❌ **Avoid `db push`** in production (doesn't create migration files)
- 📁 **Commit migrations** to version control
- 🔄 **Migration files are auto-generated** - don't edit manually

## Current Schema

Your database includes:
- ✅ User table with password field
- ✅ Language table
- ✅ Generation table
- ✅ All indexes and foreign keys
