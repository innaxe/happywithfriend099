// โครงสร้างข้อมูลหลักของแอป "เป้าเงิน"

/** คนในคลังรายชื่อกลาง (ใช้ข้ามทุกเป้า) */
export interface Person {
  id: string;
  nick: string; // ชื่อเล่น (โชว์ในแอป)
  real: string; // ชื่อจริงตามสลิป (ใช้ตอนแจ้ง Discord)
  auth_id?: string | null; // Discord auth.uid() ที่ผูกกับชื่อนี้ (null = ยังไม่ถูก claim)
  discord_id?: string | null; // provider id ของ Discord
  avatar_url?: string | null; // รูปโปรไฟล์ Discord
}

/** รายการโอน/ออม 1 ครั้ง */
export interface Contribution {
  id: string;
  goal_id?: string;
  name: string; // ชื่อเล่นของคนที่โอน
  month: string; // YYYY-MM
  amount: number;
  note: string;
  slip_url: string;
  created_at?: string; // ISO timestamp (ใช้โชว์เวลาในรายการล่าสุด)
}

/** เป้าหมายการออม (รวม contributions ของเป้านั้นไว้ด้วยหลัง map) */
export interface Goal {
  id: string;
  name: string;
  emoji: string;
  accent: string; // สีธีม hex
  currency: string;
  target: number;
  start: string; // YYYY-MM
  end: string; // YYYY-MM
  members: string[]; // ชื่อเล่นของสมาชิก
  contributions: Contribution[];
}

/** payload ตอนบันทึก/แก้ไขเป้า (ก่อนแปลงเป็น snake_case ลง DB) */
export interface GoalDraft {
  name: string;
  emoji: string;
  accent: string;
  currency: string;
  target: number;
  start: string;
  end: string;
  members: string[];
}

/** อิโมจิรีแอกชัน 1 ครั้ง (คน 1 คน กด 1 อิโมจิ ต่อ 1 อัพเดท) */
export interface Reaction {
  id: string;
  update_id?: string;
  author: string; // ชื่อเล่นของคนกด
  emoji: string;
}

/** คอมเมนต์ใต้อัพเดท 1 รายการ */
export interface Comment {
  id: string;
  update_id?: string;
  author: string; // ชื่อเล่นของคนคอมเมนต์
  text: string;
  created_at?: string;
}

/** โพสต์ไดอารี่กลุ่ม 1 รายการ (เล่าว่าไปไหนทำอะไร + รูป) */
export interface Update {
  id: string;
  goal_id?: string;
  author: string; // ชื่อเล่นของคนโพสต์
  text: string;
  image_url: string;
  created_at?: string;
  reactions: Reaction[]; // ผูกเข้ามาหลัง map
  comments: Comment[]; // ผูกเข้ามาหลัง map
}

// ---------- แถวดิบจากฐานข้อมูล (snake_case) ----------
export interface PersonRow {
  id: string;
  nick: string;
  real: string | null;
  auth_id?: string | null;
  discord_id?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export interface GoalRow {
  id: string;
  name: string;
  emoji: string | null;
  accent: string | null;
  currency: string | null;
  target: number | string;
  start_month: string;
  end_month: string;
  members: string[] | null;
  created_at?: string;
}

export interface ContributionRow {
  id: string;
  goal_id: string;
  name: string;
  month: string;
  amount: number | string;
  note: string | null;
  slip_url: string | null;
  created_at?: string;
}

export interface UpdateRow {
  id: string;
  goal_id: string;
  author: string;
  text: string | null;
  image_url: string | null;
  created_at?: string;
}

export interface ReactionRow {
  id: string;
  update_id: string;
  author: string;
  emoji: string;
  created_at?: string;
}

export interface CommentRow {
  id: string;
  update_id: string;
  author: string;
  text: string;
  created_at?: string;
}
