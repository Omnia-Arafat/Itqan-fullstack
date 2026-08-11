# 🔑 How to Create Sohbah Admin Account

## Step-by-Step Instructions

### Step 1: Create Auth User in Supabase Dashboard

1. **Go to your Supabase project**
   - Visit: https://supabase.com/dashboard
   - Select your Itqan project

2. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Users" tab

3. **Add New User**
   - Click "Add user" button (top right)
   - Click "Create new user"

4. **Enter Credentials**
   ```
   Email: sohbah-admin@example.com
   Password: YourSecurePassword123!
   ```
   (Or use your own email and password)

5. **Confirm Email (Optional)**
   - Check "Auto Confirm User" if you want immediate access
   - Or uncheck and verify via email

6. **Click "Create user"**

7. **Copy the User ID**
   - After creating, you'll see a UUID like: `12345678-abcd-1234-abcd-123456789012`
   - **COPY THIS!** You'll need it in the next step

### Step 2: Get Sohbah Academy ID

1. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

2. **Run this query:**
   ```sql
   SELECT id, slug, name_en FROM academies WHERE slug = 'sohbah';
   ```

3. **Copy the `id` value**
   - You'll see something like: `87654321-1234-5678-90ab-cdef12345678`
   - **COPY THIS!**

### Step 3: Link Teacher to Sohbah Academy

1. **Still in SQL Editor, run this:**

   ```sql
   -- Replace the placeholders with your actual values:
   
   INSERT INTO teachers (
     auth_user_id,
     academy_id,
     name,
     gender_category,
     role,
     is_active
   )
   VALUES (
     'PASTE_YOUR_AUTH_USER_ID_HERE',     -- From Step 1
     'PASTE_YOUR_SOHBAH_ACADEMY_ID_HERE', -- From Step 2
     'Sohbah Admin',                       -- Admin name
     'female',                             -- or 'male'
     'admin',                              -- Role: admin
     true                                  -- Active
   )
   RETURNING id, name, role;
   ```

2. **Example (with fake IDs):**
   ```sql
   INSERT INTO teachers (
     auth_user_id,
     academy_id,
     name,
     gender_category,
     role,
     is_active
   )
   VALUES (
     '12345678-abcd-1234-abcd-123456789012',
     '87654321-1234-5678-90ab-cdef12345678',
     'Sohbah Admin',
     'female',
     'admin',
     true
   )
   RETURNING id, name, role;
   ```

3. **Click RUN**
   - You should see success message with the teacher ID

### Step 4: Verify It Worked

Run this query to verify:

```sql
SELECT 
  t.id as teacher_id,
  t.name as teacher_name,
  t.role,
  a.name_en as academy_name,
  au.email as auth_email
FROM teachers t
JOIN academies a ON a.id = t.academy_id
JOIN auth.users au ON au.id = t.auth_user_id
WHERE a.slug = 'sohbah'
  AND t.role = 'admin';
```

You should see your new Sohbah admin!

### Step 5: Test Login

1. **Go to Sohbah login page:**
   ```
   http://localhost:3000/sohbah/login
   ```

2. **Enter credentials:**
   - Email: `sohbah-admin@example.com` (or whatever you used)
   - Password: `YourSecurePassword123!` (or whatever you used)

3. **Click "Sign in"**
   - You should be redirected to: `/sohbah/dashboard`
   - You'll see the Sohbah branding!

## 🎉 Done!

You now have a Sohbah admin account that can:
- ✅ Create Sohbah circles
- ✅ Manage Sohbah students
- ✅ View Sohbah attendance
- ✅ Access Sohbah admin panel
- ❌ Cannot access Itqan data (isolated!)

## 📋 Quick Reference

### Your Credentials
```
Email: sohbah-admin@example.com
Password: [The password you chose]
Login URL: http://localhost:3000/sohbah/login
```

### Useful SQL Queries

**See all academies:**
```sql
SELECT * FROM academies;
```

**See all teachers:**
```sql
SELECT t.name, t.role, a.name_en as academy 
FROM teachers t 
JOIN academies a ON a.id = t.academy_id;
```

**See Sohbah admin:**
```sql
SELECT * FROM teachers 
WHERE academy_id = (SELECT id FROM academies WHERE slug = 'sohbah')
  AND role = 'admin';
```

## 🔒 Security Notes

- Never commit real passwords to git
- Use strong passwords in production
- The auth_user_id links the Supabase Auth user to the teacher record
- Teachers are academy-specific - one teacher = one academy
- Admins can only manage their own academy's data

## ❓ Troubleshooting

**"Cannot insert into teachers"**
- Make sure RLS policies are correct
- Make sure the migration was applied
- Check that academy_id and auth_user_id are valid UUIDs

**"Auth user not found"**
- Make sure you created the user in Supabase Auth first
- Copy the exact UUID from the users list

**"Academy not found"**
- Run: `SELECT * FROM academies WHERE slug = 'sohbah'`
- Make sure the migration created the Sohbah academy

**Login redirects to 404**
- The dashboard routes might not be copied yet
- Check that `/sohbah/dashboard` exists
- See the main documentation for route setup

## 🚀 Next Steps

After logging in:
1. Create your first Sohbah circle
2. Register Sohbah students
3. Test the circle page
4. Verify data isolation (Sohbah students don't see Itqan data)

See `SOHBAH_COMPLETE.md` for more details!
