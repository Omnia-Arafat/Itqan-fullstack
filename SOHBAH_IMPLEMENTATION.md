# Sohbah Academy Implementation Guide

## Overview
This document describes the multi-academy architecture that enables both Itqan and Sohbah academies to coexist in the same application with complete separation of students, teachers, circles, and data.

## Database Changes

### New Migration: `20260810000000_add_academies.sql`
**Status**: ✅ Created

This migration adds:
1. **`academies` table** - stores academy metadata (name, logo, colors, etc.)
2. **Academy foreign keys** - adds `academy_id` to `teachers`, `circles`, and `students` tables
3. **Updated RLS policies** - ensures data isolation between academies
4. **Updated RPCs** - all public functions now filter by academy
5. **Pre-populated data** - both Itqan and Sohbah academies are created

### To Apply:
```bash
npx supabase db push
```

## Routing Structure

### Before (Single Academy):
```
/                    → Home
/register            → Student registration
/login               → Teacher login
/dashboard           → Teacher dashboard
/circle/[slug]       → Public circle page
/admin               → Admin dashboard
```

### After (Multi-Academy):
```
/                    → Academy selector (if multiple academies exist)
                        OR redirect to single academy

/[academy]           → Academy home page
/[academy]/register  → Student registration for this academy
/[academy]/login     → Teacher login
/[academy]/dashboard → Teacher dashboard (filtered by academy)
/[academy]/circle/[slug]  → Public circle page
/[academy]/admin     → Admin dashboard (filtered by academy)
```

## Files Created

### 1. Database Migration
- ✅ `supabase/migrations/20260810000000_add_academies.sql`

### 2. Data Access Layer
- ✅ `src/lib/academy-dal.ts` - Academy CRUD operations
- ✅ `src/lib/academy-context.ts` - Helper to get academy from slug

### 3. UI Components
- ✅ `src/components/academy-selector.tsx` - Shows all available academies

### 4. Page Structure
- ✅ `src/app/[locale]/page.tsx` - Updated to show academy selector
- ✅ `src/app/[locale]/[academy]/page.tsx` - Academy-specific home page

## Next Steps to Complete

### 1. Update Existing Routes
The following routes need to be moved/copied under `/[locale]/[academy]/`:

```
register/
  ├── page.tsx
  ├── register-form.tsx
  ├── actions.ts (needs academy_id)
  └── state.ts

login/
  ├── page.tsx
  ├── login-form.tsx
  ├── actions.ts
  └── state.ts

dashboard/
  ├── page.tsx (needs academy filter)
  ├── new/
  │   ├── page.tsx
  │   ├── circle-form.tsx
  │   ├── actions.ts (needs academy_id)
  │   └── state.ts
  └── circle/[id]/
      ├── page.tsx (needs academy filter)
      └── session-client.tsx

circle/[slug]/
  ├── page.tsx (already has academy via circle)
  └── circle-client.tsx

admin/
  ├── page.tsx (needs academy filter)
  ├── reports/
  │   └── page.tsx (needs academy filter)
  └── circle/[id]/
      ├── page.tsx (needs academy filter)
      └── edit-form.tsx (needs academy_id)
```

### 2. Update Server Actions

All server actions that create records need to include `academy_id`:

**register/actions.ts**:
```typescript
const { error } = await supabase.from("students").insert({
  name: values.name,
  father_name: fatherName,
  phone: values.phone || null,
  gender_category: gender,
  academy_id: academyId, // ADD THIS
});
```

**dashboard/new/actions.ts**:
```typescript
const { error } = await supabase.from("circles").insert({
  teacher_id: teacherId,
  name: values.name,
  // ... other fields
  academy_id: academyId, // ADD THIS
});
```

### 3. Update RPC Calls

Update RPC calls to pass academy_id:

```typescript
// Before
const { data } = await supabase.rpc("find_similar_students", {
  p_name: name,
  p_father_name: fatherName,
  p_gender: gender,
});

// After
const { data } = await supabase.rpc("find_similar_students", {
  p_name: name,
  p_father_name: fatherName,
  p_gender: gender,
  p_academy_id: academyId,
});
```

### 4. Update Translation Keys

Translations have been updated in `messages/ar.json` and `messages/en.json` with:
- `academy.itqan.name`
- `academy.itqan.tagline`
- `academy.sohbah.name`
- `academy.sohbah.tagline`
- `academy.select`
- `academy.switchAcademy`

### 5. Add Sohbah Logo

The migration references `/assets/logos/sohbah-logo.webp`. Ensure this file exists at:
```
public/assets/logos/sohbah-logo.webp
```

## Academy Isolation

### Data Separation
- Each student belongs to ONE academy (via `students.academy_id`)
- Each teacher belongs to ONE academy (via `teachers.academy_id`)
- Each circle belongs to ONE academy (via `circles.academy_id`)
- Students can only join circles from their own academy (enforced in database trigger)
- Teachers can only see/manage circles from their own academy (enforced in RLS)

### Gender Separation (Existing)
- Still enforced at database level
- Works independently of academy separation
- Both constraints are checked in the `enforce_gender_match()` trigger

## Testing Checklist

After completing the implementation:

- [ ] Apply database migration
- [ ] Verify both academies appear in academy selector
- [ ] Register a student in Sohbah academy
- [ ] Register a student in Itqan academy
- [ ] Verify students are isolated (search in one academy shouldn't find students from another)
- [ ] Create a circle in each academy
- [ ] Verify circle slugs work correctly
- [ ] Verify teacher dashboard shows only their academy's circles
- [ ] Verify admin can see both academies (if they have access)
- [ ] Test attendance reports filtered by academy

## Architecture Benefits

1. **Complete Isolation**: Each academy operates independently
2. **Shared Infrastructure**: Both academies use the same codebase
3. **Easy Expansion**: Adding a third academy requires only database insert
4. **Branded Experience**: Each academy can have its own logo and colors
5. **Scalable**: No code changes needed to add more academies

## Migration Path

For existing Itqan data:
1. The migration automatically assigns all existing records to Itqan academy
2. All existing functionality continues to work
3. New Sohbah academy starts with clean slate
4. No data loss or disruption

## Academy Configuration

To add a new academy in the future:

```sql
insert into public.academies (
  slug, name_ar, name_en,
  description_ar, description_en,
  logo_path, primary_color, accent_color
)
values (
  'new-academy',
  'الاسم بالعربية',
  'Name in English',
  'الوصف',
  'Description',
  '/path/to/logo.webp',
  '#HEX_COLOR',
  '#HEX_COLOR'
);
```

Then the academy immediately appears in the selector and users can access it at `/new-academy`.
