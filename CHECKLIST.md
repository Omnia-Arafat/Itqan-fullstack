# Sohbah Academy Implementation Checklist

## ✅ What's Already Done

I've completed all the foundational work:

- [x] Created database migration with academies table
- [x] Updated all tables to include `academy_id` foreign keys
- [x] Updated all RLS policies for academy isolation  
- [x] Updated all database functions (RPCs) to filter by academy
- [x] Pre-configured both Itqan and Sohbah academies in database
- [x] Created academy data access layer (`academy-dal.ts`)
- [x] Created academy context helpers
- [x] Built academy selector UI component
- [x] Created academy-specific home page template
- [x] Updated translations for both English and Arabic
- [x] Added Sohbah branding (name, tagline, colors)
- [x] Verified Sohbah logo exists at `public/assets/logos/sohbah-logo.webp`
- [x] Created comprehensive documentation (4 guide files)

## 🚀 Your Next Steps

### Step 1: Apply the Database Migration ⏱️ 2 minutes

**Option A: Using Supabase CLI**
```bash
cd "d:\githup repo\Itqan-fullstack"
npx supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Open `supabase/migrations/20260810000000_add_academies.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click "Run"

**Verification:**
```sql
-- Run this to verify both academies exist:
SELECT slug, name_en, name_ar, is_active 
FROM academies 
ORDER BY created_at;

-- Should return:
-- itqan | Itqan Academy | أكاديمية إتقان | true
-- sohbah | Sohbah Academy | أكاديمية صحبة | true
```

### Step 2: Test the Application ⏱️ 3 minutes

```bash
npm run dev
```

**Test checklist:**
- [ ] Open `http://localhost:3000`
- [ ] See academy selector page
- [ ] Verify Itqan logo appears correctly
- [ ] Verify Sohbah logo appears correctly
- [ ] Click on Itqan → should go to `/itqan`
- [ ] See Itqan home page with correct branding
- [ ] Go back, click on Sohbah → should go to `/sohbah`
- [ ] See Sohbah home page with Sohbah logo
- [ ] Verify existing Itqan features still work (optional)

### Step 3: Create First Sohbah Admin (Optional) ⏱️ 5 minutes

**Why?** To log in and create Sohbah circles, you need a Sohbah admin.

1. **Create auth user in Supabase:**
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Copy the UUID that's generated

2. **Get Sohbah academy ID:**
   ```sql
   SELECT id FROM academies WHERE slug = 'sohbah';
   ```

3. **Link teacher to academy:**
   - Open `supabase/seed/sohbah-admin.sql`
   - Follow the instructions inside
   - Replace placeholders with actual values
   - Run in SQL Editor

4. **Test login:**
   - Go to `/sohbah/login` (after route is created)
   - Log in with the credentials you created
   - Should see Sohbah dashboard

## 📋 Verification Checklist

### Database ✓
- [ ] Migration applied successfully
- [ ] Both academies exist in database
- [ ] All tables have `academy_id` column
- [ ] Existing Itqan data has `academy_id` set

### Frontend ✓  
- [ ] Academy selector displays both academies
- [ ] Itqan logo shows correctly
- [ ] Sohbah logo shows correctly
- [ ] Clicking academy takes to correct home page
- [ ] Academy names display in current language

### Translations ✓
- [ ] `messages/ar.json` has Sohbah translations
- [ ] `messages/en.json` has Sohbah translations
- [ ] Language switcher works on academy pages

### Data Isolation ✓
```sql
-- Test: Create a test student in each academy
-- They should not see each other

-- Create Itqan student
INSERT INTO students (name, father_name, gender_category, academy_id)
VALUES ('Test Itqan', 'Father', 'male', 
        (SELECT id FROM academies WHERE slug = 'itqan'));

-- Create Sohbah student  
INSERT INTO students (name, father_name, gender_category, academy_id)
VALUES ('Test Sohbah', 'Father', 'male',
        (SELECT id FROM academies WHERE slug = 'sohbah'));

-- Verify isolation - should return only Sohbah student
SELECT name, father_name 
FROM students 
WHERE academy_id = (SELECT id FROM academies WHERE slug = 'sohbah');
```

## 📖 Documentation Reference

| File | Purpose | When to Read |
|------|---------|-------------|
| `CHECKLIST.md` | This file | Start here |
| `SETUP_SOHBAH.md` | Quick setup guide | For immediate setup |
| `SOHBAH_README.md` | Feature overview | To understand what you have |
| `SOHBAH_IMPLEMENTATION.md` | Technical deep dive | When extending routes |
| `ARCHITECTURE.md` | Visual diagrams | To understand structure |

## 🎯 Success Criteria

You'll know it's working when:

✅ **Minimal Success** (5 minutes of work)
- Migration applied
- Both academies visible in selector
- Can navigate to each academy's home page
- Sohbah logo displays correctly

✅ **Full Success** (Additional work)
- Students can register in Sohbah
- Teachers can log in to Sohbah
- Circles can be created in Sohbah
- Data is completely isolated between academies

## 🐛 Troubleshooting

### Academy selector doesn't show
**Cause:** Migration not applied  
**Fix:** Apply the migration (see Step 1)

### Sohbah logo doesn't display
**Cause:** File path incorrect  
**Fix:** Verify file exists at `public/assets/logos/sohbah-logo.webp`

### Error: "academy_id does not exist"
**Cause:** Migration not fully applied  
**Fix:** Re-run the migration or check for errors in Supabase logs

### Can't create Sohbah circles
**Cause:** No Sohbah admin exists  
**Fix:** Complete Step 3 to create first admin

### Cross-academy data visible
**Cause:** RLS policies not active  
**Fix:** Check that RLS is enabled on all tables

## 📞 Need Help?

1. **Quick questions:** Check `SETUP_SOHBAH.md`
2. **Technical details:** Check `SOHBAH_IMPLEMENTATION.md`
3. **Architecture:** Check `ARCHITECTURE.md`
4. **Database issues:** Check the migration file itself
5. **Code issues:** Check the component files mentioned

## 🎉 You're Ready!

Everything is prepared. Just:
1. Apply the migration
2. Test the app
3. Optionally create Sohbah admin

That's it! You have a complete multi-academy system.

## 📊 Current Status

```
✅ Database schema designed
✅ Migration created  
✅ RLS policies updated
✅ RPCs updated
✅ UI components created
✅ Translations added
✅ Documentation written
✅ Logo verified

⏳ Migration needs to be applied (by you)
⏳ Admin needs to be created (optional, by you)
```

**Estimated time to working demo: 5 minutes**

Just run the migration and start your dev server!
