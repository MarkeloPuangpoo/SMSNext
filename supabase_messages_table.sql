-- สร้างตาราง messages สำหรับระบบแชท
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- สร้าง function สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับ updated_at
DROP TRIGGER IF EXISTS messages_updated_at ON messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- สร้าง RLS policies
-- ผู้ใช้สามารถดูข้อความที่ตัวเองส่งหรือรับได้
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- ผู้ใช้สามารถส่งข้อความได้
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ผู้ใช้สามารถอัปเดตข้อความของตัวเองได้ (เช่น mark as read)
DROP POLICY IF EXISTS "Users can update received messages" ON messages;
CREATE POLICY "Users can update received messages" ON messages
  FOR UPDATE
  USING (auth.uid() = receiver_id);

-- ผู้ใช้สามารถลบข้อความที่ส่งได้
DROP POLICY IF EXISTS "Users can delete their sent messages" ON messages;
CREATE POLICY "Users can delete their sent messages" ON messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- สร้าง view สำหรับการนับข้อความที่ยังไม่ได้อ่าน
CREATE OR REPLACE VIEW unread_message_counts AS
SELECT 
  receiver_id,
  sender_id,
  COUNT(*) as unread_count
FROM messages
WHERE is_read = FALSE
GROUP BY receiver_id, sender_id;

-- Grant permissions
GRANT SELECT ON unread_message_counts TO authenticated;

COMMENT ON TABLE messages IS 'ตารางเก็บข้อความระหว่างครูและนักเรียน';
COMMENT ON COLUMN messages.sender_id IS 'ID ของผู้ส่ง';
COMMENT ON COLUMN messages.receiver_id IS 'ID ของผู้รับ';
COMMENT ON COLUMN messages.message IS 'เนื้อหาข้อความ';
COMMENT ON COLUMN messages.is_read IS 'สถานะการอ่านข้อความ';

