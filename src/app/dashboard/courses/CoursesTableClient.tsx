'use client'

import { useMemo, useState } from 'react'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Library, BookOpen, Search, Edit, User, Hash, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DeleteCourseButton from './DeleteCourseButton'

type Course = {
  id: string
  course_name: string
  course_code: string | null
  description: string | null
  teacher: {
    id: string
    first_name: string
    last_name: string
  } | null
}

export default function CoursesTableClient({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'code' | 'teacher'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter((c) => {
      const name = c.course_name?.toLowerCase() || ''
      const code = c.course_code?.toLowerCase() || ''
      const desc = c.description?.toLowerCase() || ''
      const teacher = c.teacher ? `${c.teacher.first_name} ${c.teacher.last_name}`.toLowerCase() : ''
      return (
        name.includes(q) ||
        code.includes(q) ||
        desc.includes(q) ||
        teacher.includes(q)
      )
    })
  }, [query, courses])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const getVal = (c: Course) => {
        if (sortKey === 'name') return c.course_name?.toLowerCase() || ''
        if (sortKey === 'code') return c.course_code?.toLowerCase() || ''
        if (sortKey === 'teacher') return c.teacher ? `${c.teacher.first_name} ${c.teacher.last_name}`.toLowerCase() : ''
        return ''
      }
      const va = getVal(a)
      const vb = getVal(b)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const paged = sorted.slice(start, start + pageSize)

  const toggleSort = (key: 'name' | 'code' | 'teacher') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Library className="w-5 h-5 text-indigo-600" />
              รายการวิชา
            </h2>
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ค้นหาวิชา ครู คำอธิบาย หรือรหัสวิชา..."
                aria-label="ค้นหารายวิชา"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <TableHead 
                  role="columnheader" 
                  aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="font-semibold text-gray-700 cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  <span className="inline-flex items-center gap-1">
                    ชื่อวิชา {sortKey === 'name' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </TableHead>
                <TableHead 
                  role="columnheader" 
                  aria-sort={sortKey === 'code' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="font-semibold text-gray-700 cursor-pointer select-none"
                  onClick={() => toggleSort('code')}
                >
                  <span className="inline-flex items-center gap-1">
                    รหัสวิชา {sortKey === 'code' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </TableHead>
                <TableHead 
                  role="columnheader" 
                  aria-sort={sortKey === 'teacher' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className="font-semibold text-gray-700 hidden md:table-cell cursor-pointer select-none"
                  onClick={() => toggleSort('teacher')}
                >
                  <span className="inline-flex items-center gap-1">
                    ครูผู้สอน {sortKey === 'teacher' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">คำอธิบาย</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    ไม่พบผลลัพธ์ที่ตรงกับคำค้น
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((course: Course) => (
                  <TableRow 
                    key={course.id} 
                    className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-blue-50/50 transition-colors border-b border-gray-100"
                  >
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span>{course.course_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.course_code ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200">
                          <Hash className="w-3 h-3 mr-1" />
                          {course.course_code}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {course.teacher ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                            {course.teacher.first_name.charAt(0)}{course.teacher.last_name.charAt(0)}
                          </div>
                          <span className="text-gray-700">
                            {course.teacher.first_name} {course.teacher.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600 max-w-xs">
                      <div className="truncate" title={course.description || undefined}>
                        {course.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all"
                        >
                          <Link href={`/dashboard/courses/${course.id}/edit`} className="flex items-center gap-2">
                            <Edit className="w-3 h-3" />
                            <span className="hidden sm:inline">แก้ไข</span>
                          </Link>
                        </Button>
                        <DeleteCourseButton courseId={course.id} courseName={course.course_name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t">
          <p className="text-sm text-gray-600">
            หน้า {currentPage} จาก {totalPages} • ทั้งหมด {sorted.length} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="หน้าก่อนหน้า"
            >
              ก่อนหน้า
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="หน้าถัดไป"
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}