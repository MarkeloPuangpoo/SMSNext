// src/app/dashboard/students/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Papa from 'papaparse'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import Receipt from '@/components/shared/Receipt'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from 'lucide-react'

// Schema สำหรับ Validate ข้อมูลนักเรียนใหม่
const studentFormSchema = z.object({
  first_name: z.string().min(2, {
    message: 'ชื่อจริงต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  last_name: z.string().min(1, {
    message: 'นามสกุลต้องมีอย่างน้อย 1 ตัวอักษร',
  }),
  national_id: z.string().min(13, {
    message: 'เลขบัตรประชาชนต้องมี 13 หลัก',
  }).max(13, {
    message: 'เลขบัตรประชาชนต้องมี 13 หลัก',
  }),
  student_number: z.string().min(1, {
    message: 'กรุณากรอกเลขนักเรียน',
  }),
  address: z.string().min(5, {
    message: 'กรุณากรอกที่อยู่',
  }),
  birth_date: z.string().min(1, {
    message: 'กรุณาเลือกวันเกิด',
  }),
  grade_level: z.string().min(1, {
    message: 'กรุณากรอกชั้นเรียน (เช่น 1/1, 2/3)',
  }),
  behavior_score: z.coerce.number().min(0).max(100).optional(),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  blood_group: z.string().optional(),
  religion: z.string().optional(),
  ethnicity: z.string().optional(),
  nationality: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_surname: z.string().optional(),
  guardian_occupation: z.string().optional(),
  guardian_relation: z.string().optional(),
  father_name: z.string().optional(),
  father_surname: z.string().optional(),
  father_occupation: z.string().optional(),
  mother_name: z.string().optional(),
  mother_surname: z.string().optional(),
  mother_occupation: z.string().optional(),
  disadvantage_status: z.string().optional(),
})

// ฟังก์ชันสร้างรหัสผ่านอัตโนมัติ
function generatePassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

type BulkResult = {
  status: 'success' | 'error'
  name: string
  studentNumber: string
  email?: string
  password?: string
  message?: string
}

export default function NewStudentPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{
    email: string
    password: string
    name: string
    studentNumber: string
  } | null>(null)

  // Bulk Import States
  const [isUploading, setIsUploading] = useState(false)
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      national_id: '',
      student_number: '',
      address: '',
      birth_date: '',
      grade_level: '',
      behavior_score: 0,
    },
  })

  async function createStudent(values: z.infer<typeof studentFormSchema>) {
    // สร้างรหัสผ่านอัตโนมัติ
    const password = generatePassword(10)

    // สร้าง email จากเลขนักเรียน
    const email = `student${values.student_number}@bbv.ac.th`

    // 1. สร้าง user account ใหม่
    const createUserResponse = await fetch('/api/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        userMetadata: {
          role: 'student',
          student_number: values.student_number,
        },
      }),
    })

    const createUserData = await createUserResponse.json()

    if (!createUserResponse.ok) {
      throw new Error(createUserData.error || 'ไม่สามารถสร้าง user account ได้')
    }

    const newUserId = createUserData.user.id

    // 2. เพิ่มข้อมูลนักเรียน
    const { error } = await supabase
      .from('students')
      .insert([
        {
          user_id: newUserId,
          first_name: values.first_name,
          last_name: values.last_name,
          national_id: values.national_id,
          student_number: values.student_number,
          address: values.address,
          birth_date: values.birth_date,
          grade_level: values.grade_level,
          behavior_score: values.behavior_score || 0,
          weight: values.weight || null,
          height: values.height || null,
          blood_group: values.blood_group || null,
          religion: values.religion || null,
          ethnicity: values.ethnicity || null,
          nationality: values.nationality || null,
          guardian_name: values.guardian_name || null,
          guardian_surname: values.guardian_surname || null,
          guardian_occupation: values.guardian_occupation || null,
          guardian_relation: values.guardian_relation || null,
          father_name: values.father_name || null,
          father_surname: values.father_surname || null,
          father_occupation: values.father_occupation || null,
          mother_name: values.mother_name || null,
          mother_surname: values.mother_surname || null,
          mother_occupation: values.mother_occupation || null,
          disadvantage_status: values.disadvantage_status || null,
        },
      ])

    if (error) {
      throw error
    }

    return {
      email,
      password,
      name: `${values.first_name} ${values.last_name}`,
      studentNumber: values.student_number,
    }
  }

  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    setErrorMessage(null)
    setSuccessData(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage('กรุณาเข้าสู่ระบบก่อน')
      return
    }

    try {
      const result = await createStudent(values)
      setSuccessData(result)

      setTimeout(() => {
        router.push('/dashboard/students')
        router.refresh()
      }, 10000)

    } catch (error: any) {
      console.error('Error:', error)
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล')
    }
  }

  const handleBulkUpload = async () => {
    if (!csvFile) return

    setIsUploading(true)
    setBulkResults([])

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        const rows = results.data as any[]
        const newResults: BulkResult[] = []

        for (const row of rows) {
          try {
            // Map CSV fields to schema
            // Expecting CSV headers: first_name, last_name, national_id, student_number, address, birth_date, grade_level
            // Helper to parse date
            const parseDate = (dateStr: string) => {
              if (!dateStr) return ''
              const parts = dateStr.split(/[\/\-]/)
              if (parts.length === 3) {
                // If first part is 4 digits, assume YYYY-MM-DD or YYYY/MM/DD
                if (parts[0].length === 4) {
                  return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
                }
                // If last part is 4 digits, assume DD/MM/YYYY or DD-MM-YYYY
                if (parts[2].length === 4) {
                  const day = parts[0].padStart(2, '0')
                  const month = parts[1].padStart(2, '0')
                  const year = parts[2]
                  return `${year}-${month}-${day}`
                }
              }
              return dateStr
            }

            const studentData = {
              first_name: row.first_name,
              last_name: row.last_name,
              national_id: row.national_id,
              student_number: row.student_number,
              address: row.address,
              birth_date: parseDate(row.birth_date), // Format: YYYY-MM-DD
              grade_level: row.grade_level,
              behavior_score: 0,
              weight: row.weight,
              height: row.height,
              blood_group: row.blood_group,
              religion: row.religion,
              ethnicity: row.ethnicity,
              nationality: row.nationality,
              guardian_name: row.guardian_name,
              guardian_surname: row.guardian_surname,
              guardian_occupation: row.guardian_occupation,
              guardian_relation: row.guardian_relation,
              father_name: row.father_name,
              father_surname: row.father_surname,
              father_occupation: row.father_occupation,
              mother_name: row.mother_name,
              mother_surname: row.mother_surname,
              mother_occupation: row.mother_occupation,
              disadvantage_status: row.disadvantage_status,
            }

            // Validate with Zod
            const validatedData = studentFormSchema.parse(studentData)

            // Create student
            const result = await createStudent(validatedData)

            newResults.push({
              status: 'success',
              name: result.name,
              studentNumber: result.studentNumber,
              email: result.email,
              password: result.password,
            })

          } catch (error: any) {
            console.error('Error processing row:', row, error)
            newResults.push({
              status: 'error',
              name: `${row.first_name || '?'} ${row.last_name || '?'}`,
              studentNumber: row.student_number || '?',
              message: error.message || 'ข้อมูลไม่ถูกต้อง',
            })
          }
        }

        setBulkResults(newResults)
        setIsUploading(false)
      },
      error: (error) => {
        console.error('CSV Parse Error:', error)
        setErrorMessage('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV')
        setIsUploading(false)
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={mode === 'single' ? 'default' : 'outline'}
          onClick={() => setMode('single')}
        >
          เพิ่มรายคน
        </Button>
        <Button
          variant={mode === 'bulk' ? 'default' : 'outline'}
          onClick={() => setMode('bulk')}
        >
          นำเข้าไฟล์ CSV (หลายคน)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {mode === 'single' ? 'เพิ่มนักเรียนใหม่' : 'นำเข้าข้อมูลนักเรียน (CSV)'}
          </CardTitle>
          <CardDescription>
            {mode === 'single'
              ? 'กรอกข้อมูลนักเรียนเพื่อเพิ่มเข้าสู่ระบบ'
              : 'อัปโหลดไฟล์ CSV เพื่อเพิ่มนักเรียนทีละหลายคน (ต้องมีหัวตาราง: first_name, last_name, national_id, student_number, address, birth_date, grade_level และข้อมูลเพิ่มเติมอื่นๆ)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'single' ? (
            successData ? (
              <>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                      เพิ่มนักเรียนสำเร็จ!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      กรุณาพิมพ์ใบเสร็จด้านล่าง
                    </p>
                  </div>
                </div>
                <Receipt
                  email={successData.email}
                  password={successData.password}
                  name={successData.name}
                  role="student"
                  studentNumber={successData.studentNumber}
                />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setSuccessData(null)}>เพิ่มคนต่อไป</Button>
                </div>
              </>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อจริง</FormLabel>
                          <FormControl>
                            <Input placeholder="สมชาย" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>นามสกุล</FormLabel>
                          <FormControl>
                            <Input placeholder="ใจดี" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="national_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เลขบัตรประชาชน</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890123" maxLength={13} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="student_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เลขนักเรียน</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>วันเกิด</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grade_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชั้นเรียน</FormLabel>
                          <FormControl>
                            <Input placeholder="1/1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ที่อยู่</FormLabel>
                        <FormControl>
                          <Input placeholder="123 ถนน..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="behavior_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>คะแนนความประพฤติ (0-100)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-6 pt-6 border-t">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">ข้อมูลเพิ่มเติม</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>น้ำหนัก (กก.)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>ส่วนสูง (ซม.)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="blood_group" render={({ field }) => (<FormItem><FormLabel>กลุ่มเลือด</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />

                        <FormField control={form.control} name="religion" render={({ field }) => (<FormItem><FormLabel>ศาสนา</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="ethnicity" render={({ field }) => (<FormItem><FormLabel>เชื้อชาติ</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>สัญชาติ</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />

                        <FormField control={form.control} name="disadvantage_status" render={({ field }) => (<FormItem><FormLabel>ความด้อยโอกาส</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">ข้อมูลผู้ปกครอง</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="guardian_name" render={({ field }) => (<FormItem><FormLabel>ชื่อผู้ปกครอง</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="guardian_surname" render={({ field }) => (<FormItem><FormLabel>นามสกุลผู้ปกครอง</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="guardian_occupation" render={({ field }) => (<FormItem><FormLabel>อาชีพผู้ปกครอง</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="guardian_relation" render={({ field }) => (<FormItem><FormLabel>ความเกี่ยวข้อง</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">ข้อมูลบิดา</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="father_name" render={({ field }) => (<FormItem><FormLabel>ชื่อบิดา</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="father_surname" render={({ field }) => (<FormItem><FormLabel>นามสกุลบิดา</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="father_occupation" render={({ field }) => (<FormItem><FormLabel>อาชีพบิดา</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">ข้อมูลมารดา</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="mother_name" render={({ field }) => (<FormItem><FormLabel>ชื่อมารดา</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="mother_surname" render={({ field }) => (<FormItem><FormLabel>นามสกุลมารดา</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="mother_occupation" render={({ field }) => (<FormItem><FormLabel>อาชีพมารดา</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="text-sm font-medium text-red-500">
                      {errorMessage}
                    </p>
                  )}

                  <div className="flex justify-end gap-4">
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/students">ยกเลิก</Link>
                    </Button>

                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                    </Button>
                  </div>
                </form>
              </Form>
            )
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-gray-50 dark:bg-gray-900/50">
                <FileUp className="h-10 w-10 text-gray-400 mb-4" />
                <Input
                  type="file"
                  accept=".csv"
                  className="max-w-xs mb-4"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500 text-center max-w-2xl">
                  อัปโหลดไฟล์ CSV ที่มีคอลัมน์: first_name, last_name, national_id, student_number, address, birth_date, grade_level, weight, height, blood_group, religion, ethnicity, nationality, guardian_name, guardian_surname, guardian_occupation, guardian_relation, father_name, father_surname, father_occupation, mother_name, mother_surname, mother_occupation, disadvantage_status
                </p>
              </div>

              {csvFile && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleBulkUpload}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? 'กำลังประมวลผล...' : 'เริ่มนำเข้าข้อมูล'}
                  </Button>
                </div>
              )}

              {bulkResults.length > 0 && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">ผลการนำเข้าข้อมูล</h3>
                    <Button onClick={() => window.print()} variant="outline" className="gap-2">
                      <FileUp className="h-4 w-4" />
                      พิมพ์รายงานผล
                    </Button>
                  </div>

                  {/* Screen View */}
                  <div className="border rounded-lg overflow-hidden print:hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>สถานะ</TableHead>
                          <TableHead>ชื่อ-นามสกุล</TableHead>
                          <TableHead>เลขนักเรียน</TableHead>
                          <TableHead>รายละเอียด</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkResults.map((result, index) => (
                          <TableRow key={index} className={result.status === 'success' ? 'bg-green-50/50' : 'bg-red-50/50'}>
                            <TableCell>
                              {result.status === 'success' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              )}
                            </TableCell>
                            <TableCell>{result.name}</TableCell>
                            <TableCell>{result.studentNumber}</TableCell>
                            <TableCell>
                              {result.status === 'success' ? (
                                <div className="text-sm">
                                  <span className="font-medium">Email:</span> {result.email}<br />
                                  <span className="font-medium">Pass:</span> {result.password}
                                </div>
                              ) : (
                                <span className="text-red-500 text-sm">{result.message}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Print View */}
                  <div className="hidden bulk-print-container">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold mb-2">รายงานผลการเพิ่มนักเรียน (Bulk Import)</h1>
                      <p className="text-gray-600">วันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left">ลำดับ</th>
                          <th className="border border-gray-300 p-2 text-left">ชื่อ-นามสกุล</th>
                          <th className="border border-gray-300 p-2 text-left">เลขนักเรียน</th>
                          <th className="border border-gray-300 p-2 text-left">Email</th>
                          <th className="border border-gray-300 p-2 text-left">Password</th>
                          <th className="border border-gray-300 p-2 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResults.map((result, index) => (
                          <tr key={index} className="border-b border-gray-300">
                            <td className="border border-gray-300 p-2">{index + 1}</td>
                            <td className="border border-gray-300 p-2">{result.name}</td>
                            <td className="border border-gray-300 p-2">{result.studentNumber}</td>
                            <td className="border border-gray-300 p-2">{result.email || '-'}</td>
                            <td className="border border-gray-300 p-2 font-mono">{result.password || '-'}</td>
                            <td className="border border-gray-300 p-2 text-center">
                              {result.status === 'success' ? 'สำเร็จ' : 'ไม่สำเร็จ'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
