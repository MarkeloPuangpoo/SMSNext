-- สร้างตาราง schedules สำหรับเก็บตารางเรียน
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 8),
  subject TEXT,
  grade_level TEXT NOT NULL,
  is_lunch BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day, hour, grade_level)
);

-- สร้าง index เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_schedules_grade_level ON schedules(grade_level);
CREATE INDEX IF NOT EXISTS idx_schedules_day_hour ON schedules(day, hour);

-- สร้าง function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับอัปเดต updated_at อัตโนมัติ
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- อนุญาตให้ authenticated users อ่านและเขียนข้อมูล
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับอ่านข้อมูล (ทุกคนที่ authenticated)
CREATE POLICY "Allow authenticated users to read schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

-- Policy สำหรับเขียนข้อมูล (เฉพาะ superadmin)
-- หมายเหตุ: ต้องตรวจสอบ role ใน application layer หรือใช้ function
CREATE POLICY "Allow authenticated users to insert schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete schedules"
  ON schedules FOR DELETE
  TO authenticated
  USING (true);

