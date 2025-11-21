-- แก้ไข RLS Policies สำหรับ behavior_logs
-- รัน script นี้ใน Supabase SQL Editor เพื่อแก้ไขปัญหา RLS

-- ลบ policies เก่าทั้งหมด
DROP POLICY IF EXISTS "Allow authenticated users to view behavior logs" ON behavior_logs;
DROP POLICY IF EXISTS "Allow superadmin to insert behavior logs" ON behavior_logs;
DROP POLICY IF EXISTS "Allow superadmin to update behavior logs" ON behavior_logs;
DROP POLICY IF EXISTS "Allow superadmin to delete behavior logs" ON behavior_logs;

-- สร้าง policies ใหม่
-- Policy สำหรับ SELECT (ทุกคนที่ authenticated)
CREATE POLICY "Allow authenticated users to view behavior logs"
  ON behavior_logs FOR SELECT
  TO authenticated
  USING (true);

-- Policy สำหรับ INSERT (ทุกคนที่ authenticated - ตรวจสอบ role ใน application layer)
CREATE POLICY "Allow authenticated users to insert behavior logs"
  ON behavior_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy สำหรับ UPDATE (ทุกคนที่ authenticated - ตรวจสอบ role ใน application layer)
CREATE POLICY "Allow authenticated users to update behavior logs"
  ON behavior_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy สำหรับ DELETE (ทุกคนที่ authenticated - ตรวจสอบ role ใน application layer)
CREATE POLICY "Allow authenticated users to delete behavior logs"
  ON behavior_logs FOR DELETE
  TO authenticated
  USING (true);

