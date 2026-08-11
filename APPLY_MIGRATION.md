# How to Apply the Academy Migration

## Quick Method: Copy & Paste into Supabase SQL Editor

Since Supabase CLI isn't linked, apply the migration manually:

### Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to your Supabase project at https://supabase.com/dashboard

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Open the Migration File**
   - On your computer, open: `supabase/migrations/20260810000000_add_academies.sql`
   - Select ALL the content (Ctrl+A)
   - Copy it (Ctrl+C)

4. **Paste into SQL Editor**
   - In Supabase Dashboard, click "New query"
   - Paste the entire migration content
   - Click "Run" button (or press Ctrl+Enter)

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Run this verification query:
   ```sql
   SELECT slug, name_en, name_ar, is_active 
   FROM public.academies 
   ORDER BY created_at;
   ```
   - You should see both `itqan` and `sohbah` academies

6. **Restart Your Dev Server**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

7. **Test the App**
   - Visit http://localhost:3000
   - You should now see the academy selector with both academies!

## Alternative: Link Supabase CLI (Optional)

If you want to use CLI in the future:

```bash
# Login to Supabase
npx supabase login

# Link your project (get project-ref from your project URL)
npx supabase link --project-ref your-project-ref-here

# Then you can use:
npx supabase db push
```

Your project ref is in your Supabase project URL:
`https://supabase.com/dashboard/project/[THIS-IS-YOUR-PROJECT-REF]`

## Troubleshooting

### Error: "relation academies already exists"
**Cause:** Migration already applied  
**Fix:** Skip to step 5 (verify) - you're good!

### Error: "permission denied"
**Cause:** Not logged in or wrong project  
**Fix:** Make sure you're using the SQL Editor in the correct project

### Still see "Could not find table academies"
**Cause:** Migration didn't run or wrong schema  
**Fix:** 
1. Check if the query actually ran (look for error messages)
2. Verify you're in the right project
3. Try running the verification query first to see what tables exist

## What the Migration Does

- ✅ Creates `academies` table
- ✅ Adds `academy_id` column to `teachers`, `students`, `circles`
- ✅ Updates all RLS policies for academy filtering
- ✅ Updates all database functions (RPCs)
- ✅ Creates both Itqan and Sohbah academies
- ✅ Assigns all existing data to Itqan academy

## After Migration Success

Once the migration is applied:
- Visit your app root
- You should see both academies
- Click on Sohbah to see the Sohbah home page
- All existing Itqan functionality continues to work

See `CHECKLIST.md` for the full setup guide.
