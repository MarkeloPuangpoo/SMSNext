-- สร้างตาราง behavior_logs สำหรับบันทึกประวัติพฤติกรรม
CREATE TABLE IF NOT EXISTS behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  behavior_type TEXT NOT NULL CHECK (behavior_type IN ('good', 'bad')),
  points INTEGER NOT NULL, -- จำนวนคะแนน (บวก = ทำผิด, ลบ = ทำดี)
  description TEXT NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_behavior_logs_student_id ON behavior_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_created_at ON behavior_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_behavior_type ON behavior_logs(behavior_type);

-- สร้าง trigger สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_behavior_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_behavior_logs_updated_at
  BEFORE UPDATE ON behavior_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_behavior_logs_updated_at();

-- สร้าง function สำหรับอัปเดต behavior_score อัตโนมัติ
CREATE OR REPLACE FUNCTION update_student_behavior_score()
RETURNS TRIGGER AS $$
BEGIN
  -- อัปเดต behavior_score ของนักเรียน
  UPDATE students
  SET behavior_score = COALESCE(behavior_score, 0) + NEW.points
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger เมื่อเพิ่ม behavior_log
CREATE TRIGGER update_behavior_score_on_insert
  AFTER INSERT ON behavior_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_student_behavior_score();

-- ตั้งค่า RLS (Row Level Security)
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;

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

