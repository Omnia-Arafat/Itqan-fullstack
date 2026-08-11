# Multi-Academy Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Visits                         │
│                      http://localhost:3000                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │   Academy Selector      │
         │   (Multiple academies)  │
         └─────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  Itqan Academy  │         │ Sohbah Academy  │
│   /itqan        │         │   /sohbah       │
└─────────────────┘         └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   Itqan Data    │         │  Sohbah Data    │
│                 │         │                 │
│ • Students      │         │ • Students      │
│ • Teachers      │         │ • Teachers      │
│ • Circles       │         │ • Circles       │
│ • Attendance    │         │ • Attendance    │
└─────────────────┘         └─────────────────┘
```

## Database Schema

```
┌──────────────────────────────────────────────────────┐
│                    academies                         │
├──────────────────────────────────────────────────────┤
│ id (PK)                                              │
│ slug           (unique: 'itqan', 'sohbah')          │
│ name_ar                                              │
│ name_en                                              │
│ logo_path                                            │
│ primary_color                                        │
│ accent_color                                         │
│ is_active                                            │
└──────────────────────────────────────────────────────┘
         △                △                △
         │                │                │
         │                │                │
    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
    │         │      │         │      │         │
┌───┴──────┐  │  ┌───┴──────┐  │  ┌───┴──────┐  │
│ teachers │  │  │ students │  │  │ circles  │  │
├──────────┤  │  ├──────────┤  │  ├──────────┤  │
│ id (PK)  │  │  │ id (PK)  │  │  │ id (PK)  │  │
│ academy  ├──┘  │ academy  ├──┘  │ academy  ├──┘
│   _id(FK)│     │   _id(FK)│     │   _id(FK)│
│ name     │     │ name     │     │ name     │
│ gender   │     │ gender   │     │ gender   │
│ role     │     │ father   │     │ slug     │
│ ...      │     │ ...      │     │ ...      │
└──────────┘     └──────────┘     └──────────┘
                       │                 │
                       │                 │
                       └────────┬────────┘
                                │
                                ▼
                    ┌──────────────────┐
                    │ attendance       │
                    │   _records       │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ student_id (FK)  │
                    │ circle_id (FK)   │
                    │ session_date     │
                    │ queue_order      │
                    │ status           │
                    └──────────────────┘
```

## Data Flow

### Student Registration (Sohbah Example)

```
User visits /sohbah/register
         │
         ▼
    Register Form
         │
         ▼
    Submit with:
    • name
    • gender
    • academy_id = (sohbah UUID)
         │
         ▼
    Server Action
         │
         ▼
    Database Insert
    INSERT INTO students
    (name, gender, academy_id)
         │
         ▼
    RLS Policy Check:
    ✓ Can insert
    ✓ academy_id is valid
         │
         ▼
    Student Created
    (Linked to Sohbah only)
```

### Circle Join (With Academy Isolation)

```
Student opens /circle/tasheeh-morning
         │
         ▼
    Load circle data:
    • circle belongs to Sohbah
    • circle is female
         │
         ▼
    Student searches for name
         │
         ▼
    RPC: search_students(slug, query)
         │
         ▼
    Database filters:
    • students.academy_id = circle.academy_id ✓
    • students.gender = circle.gender ✓
         │
         ▼
    Returns only matching students
    (Cannot see Itqan students)
         │
         ▼
    Student selects their name
         │
         ▼
    RPC: join_circle(slug, student_id)
         │
         ▼
    Trigger: enforce_gender_match()
    • Check academy match ✓
    • Check gender match ✓
         │
         ▼
    Attendance record created
    (Student joins queue)
```

## Isolation Guarantees

### Database Level

```sql
-- Trigger prevents cross-academy joins
CREATE TRIGGER trg_attendance_gender_match
BEFORE INSERT ON attendance_records
FOR EACH ROW EXECUTE enforce_gender_match()

-- Inside the trigger:
IF v_circle_academy ≠ v_student_academy THEN
  RAISE EXCEPTION 'academy_mismatch'
END IF
```

### RLS Level

```sql
-- Students can only be seen by teachers from same academy
CREATE POLICY students_select_own_circles
ON students FOR SELECT
USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM attendance_records ar
    JOIN circles c ON c.id = ar.circle_id
    WHERE ar.student_id = students.id
      AND c.teacher_id = current_teacher_id()
      AND c.academy_id = students.academy_id  -- Academy match
  )
)
```

### Application Level

```typescript
// All queries include academy filter
const { data } = await supabase
  .from('circles')
  .select('*')
  .eq('academy_id', academyId)  // Always filtered

// All RPCs receive academy context
const students = await supabase.rpc('search_students', {
  p_slug: circleSlug,
  p_query: searchTerm,
  // p_academy_id implicitly derived from circle
})
```

## Route Structure

### Before (Single Academy)
```
/
├── register
├── login
├── dashboard
│   ├── new
│   └── circle/[id]
├── circle/[slug]
└── admin
    └── reports
```

### After (Multi-Academy)
```
/                           ← Academy Selector
├── itqan                   ← Itqan Home
│   ├── register
│   ├── login
│   ├── dashboard
│   ├── circle/[slug]
│   └── admin
└── sohbah                  ← Sohbah Home
    ├── register
    ├── login
    ├── dashboard
    ├── circle/[slug]
    └── admin
```

## Security Model

### Three Layers of Protection

```
┌─────────────────────────────────────────┐
│        Layer 1: Application             │
│  Academy param in routes                │
│  Academy context in components          │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        Layer 2: RLS Policies            │
│  Filter by academy_id                   │
│  Teacher can only see own academy       │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        Layer 3: Database Triggers       │
│  Enforce academy match on insert        │
│  Prevent cross-academy relationships    │
└─────────────────────────────────────────┘
```

### What Each Layer Prevents

**Layer 1 (Application)**
- Wrong academy showing in UI
- Incorrect routing
- Visual bugs

**Layer 2 (RLS)**
- Unauthorized data access
- Cross-academy queries
- Teacher seeing other academy

**Layer 3 (Triggers)**
- Data integrity violations
- Cross-academy joins
- Invalid foreign keys

Even if Layer 1 is bypassed (direct API call), Layers 2 and 3 still protect data.

## Scalability

### Adding a Third Academy

```sql
-- 1. Insert new academy (30 seconds)
INSERT INTO academies
(slug, name_ar, name_en, logo_path, primary_color, accent_color)
VALUES
('third-academy', 'الثالثة', 'Third Academy', 
 '/logo.webp', '#000000', '#FFFFFF');

-- 2. Done! Academy immediately available at /third-academy
```

No code changes needed. All features work automatically:
- Academy selector shows new academy
- Registration works
- Circles can be created
- Students can join
- Reports are filtered
- Data is isolated

### Performance Considerations

```
Single Academy:
  Query: SELECT * FROM students
  Rows scanned: 10,000
  
Multi-Academy (10 academies):
  Query: SELECT * FROM students WHERE academy_id = ?
  Rows scanned: 1,000 per academy
  Index: idx_students_academy (fast lookup)
```

Academy filtering actually **improves** performance by reducing scan size.

## Migration Strategy

### Phase 1: Foundation (DONE ✅)
- Database schema updated
- Academy table created
- Existing data assigned to Itqan
- RLS policies updated
- RPCs updated

### Phase 2: Routing (OPTIONAL)
- Academy parameter in routes
- Register/login per academy
- Dashboard per academy

### Phase 3: Features (FUTURE)
- Academy-specific theming
- Academy-specific features
- Cross-academy super admins
- Academy analytics

## Summary

**What you have:**
- ✅ Complete data isolation
- ✅ Database-level security
- ✅ Scalable architecture
- ✅ Both academies configured
- ✅ Visual academy selector
- ✅ No breaking changes to Itqan

**What's optional:**
- Extending all routes to include academy parameter
- Academy-specific theming beyond colors/logos
- Cross-academy admin capabilities

The foundation is solid. You can iterate from here!
