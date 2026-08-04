/**
 * Hand-written to match supabase/migrations/0001_init.sql.
 *
 * Once the migration is applied you can regenerate this file instead of
 * maintaining it by hand:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type GenderCategory = "male" | "female";
export type CircleType = "tasheeh" | "tajweed" | "free_recitation";
export type AttendanceStatus = "pending" | "present" | "absent";
export type RecitationStatus = "waiting" | "reciting" | "done";
export type TeacherRole = "teacher" | "admin";

export type Teacher = {
  id: string;
  auth_user_id: string | null;
  name: string;
  gender_category: GenderCategory;
  role: TeacherRole;
  is_active: boolean;
  created_at: string;
};

export type Student = {
  id: string;
  name: string;
  father_name: string;
  phone: string | null;
  gender_category: GenderCategory;
  search_key: string;
  created_at: string;
};

export type Circle = {
  id: string;
  teacher_id: string;
  name: string;
  type: CircleType;
  gender_category: GenderCategory;
  session_link: string;
  timezone: string;
  start_time: string;
  duration_minutes: number;
  /** PostgreSQL dow convention: 0 = Sunday … 6 = Saturday. */
  days_of_week: number[];
  registration_slug: string;
  is_active: boolean;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  circle_id: string;
  session_date: string;
  queue_order: number;
  joined_at: string;
  attendance_status: AttendanceStatus;
  recitation_status: RecitationStatus;
  created_at: string;
};

export type CirclePublicInfo = {
  id: string;
  name: string;
  type: CircleType;
  gender_category: GenderCategory;
  session_link: string;
  start_time: string;
  timezone: string;
  session_date: string;
  meets_today: boolean;
};

export type StudentSearchResult = {
  id: string;
  name: string;
  father_name: string;
};

export type JoinCircleResult = {
  attendance_id: string;
  session_date: string;
  queue_order: number;
  already_joined: boolean;
};

export type QueueEntry = {
  attendance_id: string;
  student_id: string;
  name: string;
  father_name: string;
  queue_order: number;
  attendance_status: AttendanceStatus;
  recitation_status: RecitationStatus;
  joined_at: string;
};

export type TeacherTodayCircle = {
  id: string;
  name: string;
  type: CircleType;
  gender_category: GenderCategory;
  start_time: string;
  timezone: string;
  registration_slug: string;
  session_date: string;
  joined_count: number;
};

export type AttendanceReportRow = {
  student_id: string;
  student_name: string;
  father_name: string;
  gender_category: GenderCategory;
  sessions_present: number;
  sessions_absent: number;
  sessions_unmarked: number;
  sessions_joined: number;
};

type Insert<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: Teacher;
        Insert: Insert<Teacher, "id" | "created_at" | "role" | "is_active" | "auth_user_id">;
        Update: Partial<Teacher>;
      };
      students: {
        Row: Student;
        Insert: Insert<Student, "id" | "created_at" | "search_key" | "phone">;
        Update: Partial<Student>;
      };
      circles: {
        Row: Circle;
        Insert: Insert<
          Circle,
          "id" | "created_at" | "is_active" | "timezone" | "duration_minutes" | "days_of_week"
        >;
        Update: Partial<Circle>;
      };
      attendance_records: {
        Row: AttendanceRecord;
        // Inserted only through join_circle(); never written directly.
        Insert: never;
        Update: Partial<
          Pick<AttendanceRecord, "attendance_status" | "recitation_status" | "queue_order">
        >;
      };
    };
    Views: Record<string, never>;
    Functions: {
      circle_public_info: {
        Args: { p_slug: string };
        Returns: CirclePublicInfo[];
      };
      search_students: {
        Args: { p_slug: string; p_query: string };
        Returns: StudentSearchResult[];
      };
      find_similar_students: {
        Args: { p_name: string; p_father_name: string; p_gender: GenderCategory };
        Returns: StudentSearchResult[];
      };
      join_circle: {
        Args: { p_slug: string; p_student_id: string };
        Returns: JoinCircleResult[];
      };
      circle_queue: {
        Args: { p_slug: string };
        Returns: QueueEntry[];
      };
      teacher_today_circles: {
        Args: Record<string, never>;
        Returns: TeacherTodayCircle[];
      };
      reorder_queue: {
        Args: {
          p_circle_id: string;
          p_session_date: string;
          p_student_ids: string[];
        };
        Returns: undefined;
      };
      attendance_report: {
        Args: {
          p_from: string;
          p_to: string;
          p_gender?: GenderCategory | null;
          p_circle_id?: string | null;
          p_teacher_id?: string | null;
        };
        Returns: AttendanceReportRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
