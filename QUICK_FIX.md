# ⚡ Quick Fix: Apply Migration in 2 Minutes

## The Error You're Seeing

```
Failed to fetch academies: Could not find the table 'public.academies'
```

**Why?** The database migration hasn't been applied yet.

## ✅ Solution: Apply Migration Manually

### Step 1: Open Your Migration File

Open this file on your computer:
```
d:\githup repo\Itqan-fullstack\supabase\migrations\20260810000000_add_academies.sql
```

### Step 2: Copy Everything

- Select ALL content in the file (Ctrl+A)
- Copy it (Ctrl+C)

### Step 3: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Select your Itqan project
3. Click "SQL Editor" in the left sidebar
4. Click "New query" button

### Step 4: Paste and Run

1. Paste the migration content (Ctrl+V)
2. Click the "RUN" button (or Ctrl+Enter)
3. Wait for "Success" message

### Step 5: Verify

Run this query to confirm it worked:

```sql
SELECT slug, name_en, is_active 
FROM public.academies;
```

You should see:
```
slug    | name_en         | is_active
--------|-----------------|----------
itqan   | Itqan Academy   | true
sohbah  | Sohbah Academy  | true
```

### Step 6: Restart Dev Server

```bash
# Stop your dev server (Ctrl+C in the terminal)
# Then restart it:
npm run dev
```

### Step 7: Test

Visit http://localhost:3000

**You should now see:**
- ✅ Academy selector page
- ✅ Both Itqan and Sohbah academies
- ✅ Sohbah logo displaying
- ✅ No errors!

## That's It!

The migration is applied and your multi-academy system is live.

---

## 🔧 Alternative: If You Can't Access Supabase Dashboard

If you can't access the dashboard, you can link Supabase CLI:

```bash
# Get your project ref from project settings URL
npx supabase link --project-ref YOUR_PROJECT_REF

# Then push the migration
npx supabase db push
```

Your project ref is in Settings → General → Reference ID

---

## Still Having Issues?

### Issue: "relation academies already exists"
**Solution:** Migration already applied! Just restart your dev server.

### Issue: Can't find migration file
**Solution:** File is at: `d:\githup repo\Itqan-fullstack\supabase\migrations\20260810000000_add_academies.sql`

### Issue: SQL Editor shows error
**Solution:** Copy the ENTIRE file content, including all comments. Don't skip any lines.

### Issue: Still see "table not found" after running
**Solution:** 
1. Check you're in the correct Supabase project
2. Try running the verification query
3. If academies table exists, restart your dev server
4. Clear browser cache and refresh

---

## Need More Help?

- Detailed guide: `APPLY_MIGRATION.md`
- Full checklist: `CHECKLIST.md`
- Architecture: `ARCHITECTURE.md`
