'use client'

import ReactECharts from 'echarts-for-react'

interface MonthlyTrendChartProps {
  studentCount: number
  teacherCount: number
  courseCount: number
}

export default function MonthlyTrendChart({ studentCount, teacherCount, courseCount }: MonthlyTrendChartProps) {
  // สร้างข้อมูล mock สำหรับแนวโน้ม 6 เดือนย้อนหลัง
  const months = ['ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.']
  
  const option = {
    title: {
      text: 'สถิติภาพรวมระบบ',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['นักเรียน', 'ครู', 'วิชา'],
      bottom: 10,
      textStyle: {
        color: '#64748b'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
      axisLabel: {
        color: '#64748b'
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b'
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9'
        }
      }
    },
    series: [
      {
        name: 'นักเรียน',
        type: 'line',
        smooth: true,
        data: [
          Math.round(studentCount * 0.85),
          Math.round(studentCount * 0.88),
          Math.round(studentCount * 0.92),
          Math.round(studentCount * 0.95),
          Math.round(studentCount * 0.98),
          studentCount
        ],
        itemStyle: {
          color: '#0ea5e9'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(14, 165, 233, 0.3)' },
              { offset: 1, color: 'rgba(14, 165, 233, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'ครู',
        type: 'line',
        smooth: true,
        data: [
          Math.round(teacherCount * 0.90),
          Math.round(teacherCount * 0.92),
          Math.round(teacherCount * 0.94),
          Math.round(teacherCount * 0.96),
          Math.round(teacherCount * 0.98),
          teacherCount
        ],
        itemStyle: {
          color: '#06b6d4'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6, 182, 212, 0.3)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'วิชา',
        type: 'line',
        smooth: true,
        data: [
          Math.round(courseCount * 0.80),
          Math.round(courseCount * 0.85),
          Math.round(courseCount * 0.88),
          Math.round(courseCount * 0.92),
          Math.round(courseCount * 0.96),
          courseCount
        ],
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  return <ReactECharts option={option} style={{ height: '350px' }} />
}

