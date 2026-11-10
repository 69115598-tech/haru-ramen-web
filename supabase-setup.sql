-- วางทั้งไฟล์นี้ใน Supabase → SQL Editor แล้วกด Run

-- 1) ตารางเก็บข้อมูลทั้งระบบ (ออเดอร์ เมนู สต็อก พนักงาน รายจ่าย ฯลฯ)
create table if not exists public.kv (
  col text not null,          -- ชื่อชุดข้อมูล เช่น orders, menu, stock, staff
  id text not null,           -- รหัสรายการ
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  primary key (col, id)
);
alter table public.kv replica identity full;
alter table public.kv enable row level security;

-- 2) สิทธิ์แบบ "ทดลอง": ทุกคนที่เปิดเว็บอ่าน/เขียนได้ (เหมาะกับการทดสอบ/นำเสนอ)
drop policy if exists "demo select" on public.kv;
drop policy if exists "demo insert" on public.kv;
drop policy if exists "demo update" on public.kv;
drop policy if exists "demo delete" on public.kv;
create policy "demo select" on public.kv for select using (true);
create policy "demo insert" on public.kv for insert with check (true);
create policy "demo update" on public.kv for update using (true) with check (true);
create policy "demo delete" on public.kv for delete using (true);

-- 3) เปิด Realtime ให้ข้อมูลซิงก์ข้ามเครื่องทันที
do $$ begin
  alter publication supabase_realtime add table public.kv;
exception when duplicate_object then null; end $$;

-- 4) ที่เก็บรูปอาหาร
insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;
drop policy if exists "img read" on storage.objects;
drop policy if exists "img upload" on storage.objects;
create policy "img read" on storage.objects for select using (bucket_id = 'menu-images');
create policy "img upload" on storage.objects for insert with check (bucket_id = 'menu-images');
