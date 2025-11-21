// src/app/dashboard/behavior/[studentId]/EditScoreButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit, Award, Loader2 } from 'lucide-react'

interface EditScoreButtonProps {
  studentId: string
  currentScore: number
  studentName: string
}

export default function EditScoreButton({ 
  studentId, 
  currentScore, 
  studentName 
}: EditScoreButtonProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(currentScore.toString())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    const scoreValue = parseInt(score)
    
    if (isNaN(scoreValue) || scoreValue < 0) {
      setError('กรุณากรอกคะแนนที่ถูกต้อง (ต้องเป็นตัวเลขและไม่น้อยกว่า 0)')
      return
    }

    setIsSaving(true)

    try {
      // ตรวจสอบ role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('กรุณาเข้าสู่ระบบก่อน')
        setIsSaving(false)
        return
      }

      const userRole = user.user_metadata?.role
      if (userRole !== 'superadmin') {
        setError('คุณไม่มีสิทธิ์ในการแก้ไขคะแนน')
        setIsSaving(false)
        return
      }

      // อัปเดตคะแนน
      const { error: updateError } = await supabase
        .from('students')
        .update({ behavior_score: scoreValue })
        .eq('id', studentId)

      if (updateError) {
        console.error('Error updating score:', updateError)
        setError(updateError.message)
        setIsSaving(false)
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Error:', err)
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all"
        >
          <Edit className="w-4 h-4 mr-2" />
          แก้ไขคะแนน
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            แก้ไขคะแนนความประพฤติ
          </DialogTitle>
          <DialogDescription>
            แก้ไขคะแนนความประพฤติของ {studentName}
            <br />
            <span className="text-xs text-gray-500 mt-1 block">
              คะแนนต่ำ = ดี, คะแนนสูง = แย่ (เริ่มจาก 0)
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="score" className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              คะแนนความประพฤติ
            </Label>
            <Input
              id="score"
              type="number"
              min="0"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="text-lg font-semibold"
              placeholder="0"
            />
            <p className="text-xs text-gray-500">
              คะแนนปัจจุบัน: <span className="font-semibold">{currentScore}</span>
            </p>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">⚠️ {error}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setScore(currentScore.toString())
              setError(null)
            }}
            disabled={isSaving}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Award className="w-4 h-4 mr-2" />
                บันทึก
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

