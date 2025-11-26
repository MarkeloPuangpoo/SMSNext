-- Add new columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS ethnicity TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_surname TEXT,
ADD COLUMN IF NOT EXISTS guardian_occupation TEXT,
ADD COLUMN IF NOT EXISTS guardian_relation TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS father_surname TEXT,
ADD COLUMN IF NOT EXISTS father_occupation TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS mother_surname TEXT,
ADD COLUMN IF NOT EXISTS mother_occupation TEXT,
ADD COLUMN IF NOT EXISTS disadvantage_status TEXT;

-- Comment on columns for clarity
COMMENT ON COLUMN students.weight IS 'น้ำหนัก (กก.)';
COMMENT ON COLUMN students.height IS 'ส่วนสูง (ซม.)';
COMMENT ON COLUMN students.blood_group IS 'กลุ่มเลือด';
COMMENT ON COLUMN students.religion IS 'ศาสนา';
COMMENT ON COLUMN students.ethnicity IS 'เชื้อชาติ';
COMMENT ON COLUMN students.nationality IS 'สัญชาติ';
COMMENT ON COLUMN students.guardian_name IS 'ชื่อผู้ปกครอง';
COMMENT ON COLUMN students.guardian_surname IS 'นามสกุลผู้ปกครอง';
COMMENT ON COLUMN students.guardian_occupation IS 'อาชีพของผู้ปกครอง';
COMMENT ON COLUMN students.guardian_relation IS 'ความเกี่ยวข้องของผู้ปกครอง';
COMMENT ON COLUMN students.father_name IS 'ชื่อบิดา';
COMMENT ON COLUMN students.father_surname IS 'นามสกุลบิดา';
COMMENT ON COLUMN students.father_occupation IS 'อาชีพของบิดา';
COMMENT ON COLUMN students.mother_name IS 'ชื่อมารดา';
COMMENT ON COLUMN students.mother_surname IS 'นามสกุลมารดา';
COMMENT ON COLUMN students.mother_occupation IS 'อาชีพของมารดา';
COMMENT ON COLUMN students.disadvantage_status IS 'ความด้อยโอกาส';
