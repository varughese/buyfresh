goodbye hellofresh

prefix any recipe with https://buyfresh-zeta.vercel.app/ , it will parse the recipe and give you the exact ingredients at the store:

## Database Setup

This app uses a Postgres database (currently Neon) to store shared shopping lists.

### Environment Variables

Add to `.env.local`:
```
DATABASE_URL=postgresql://...
DATABASE_PROVIDER=neon  # Optional, defaults to "neon". Can be "neon" or "supabase"
```

### Initialize Database

Run the migration to create the `shopping_lists` table:

```bash
# Option 1: Run the setup script
pnpm tsx scripts/setup-db.ts

# Option 2: Run the SQL directly
psql $DATABASE_URL -f migrations/001_create_shopping_lists.sql
```

### Switching Database Providers

The app uses a database abstraction layer. To switch from Neon to Supabase:

1. Update `DATABASE_PROVIDER=supabase` in `.env.local`
2. Implement `createSupabaseConnection` in `src/lib/db/supabase.ts`
3. Update `DATABASE_URL` to your Supabase connection string

https://github.com/user-attachments/assets/0a61164b-7098-40e0-9bfa-e9136e20b6c7





older version:


![2025-02-17 15 59 52](https://github.com/user-attachments/assets/6ffb3bdf-925f-4e3a-b355-66e0b3cbffa0)

