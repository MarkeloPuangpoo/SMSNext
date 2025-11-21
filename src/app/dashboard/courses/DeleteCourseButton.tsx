// src/app/dashboard/courses/DeleteCourseButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteCourseButtonProps {
  courseId: string
  courseName: string
}

export default function DeleteCourseButton({ courseId, courseName }: DeleteCourseButtonProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    // ตรวจสอบว่ามี enrollments ที่อ้างอิงถึง course นี้หรือไม่
    const { data: enrollments, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .limit(1)

    if (checkError) {
      console.error('Error checking enrollments:', checkError)
      alert('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล')
      setIsDeleting(false)
      setOpen(false)
      return
    }

    if (enrollments && enrollments.length > 0) {
      alert('ไม่สามารถลบวิชานี้ได้ เนื่องจากมีนักเรียนลงทะเบียนเรียนอยู่')
      setIsDeleting(false)
      setOpen(false)
      return
    }

    // ลบ course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('Error deleting course:', error)
      alert('เกิดข้อผิดพลาดในการลบวิชา: ' + error.message)
      setIsDeleting(false)
      setOpen(false)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="hover:bg-red-600 transition-all"
        >
          <Trash2 className="w-3 h-3 mr-1 sm:mr-0" />
          <span className="hidden sm:inline ml-1">ลบ</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            ยืนยันการลบวิชา
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            คุณแน่ใจหรือไม่ว่าต้องการลบวิชา <span className="font-semibold text-gray-900">"{courseName}"</span>?
            <br />
            <span className="text-red-600 font-medium">การกระทำนี้ไม่สามารถยกเลิกได้</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                ยืนยันลบ
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
