// ===== ตั้งค่าการเชื่อมต่อ Supabase =====
// ใส่ค่าจาก Supabase → Project Settings → API
// ใช้ "anon public key" เท่านั้น ห้ามใส่ service_role key เด็ดขาด
window.HARU_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT-ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY"
};
