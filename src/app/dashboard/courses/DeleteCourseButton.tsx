// src/app/dashboard/courses/DeleteCourseButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface DeleteCourseButtonProps {
  courseId: string
  courseName: string
}

export default function DeleteCourseButton({ courseId, courseName }: DeleteCourseButtonProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

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
      setShowConfirm(false)
      return
    }

    if (enrollments && enrollments.length > 0) {
      alert('ไม่สามารถลบวิชานี้ได้ เนื่องจากมีนักเรียนลงทะเบียนเรียนอยู่')
      setIsDeleting(false)
      setShowConfirm(false)
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
      setShowConfirm(false)
    } else {
      router.refresh()
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          ยกเลิก
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      ลบ
    </Button>
  )
}

