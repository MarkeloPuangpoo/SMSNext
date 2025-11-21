'use client'

import ReactECharts from 'echarts-for-react'

interface TeachersByDepartmentChartProps {
  data: { department: string; count: number }[]
}

export default function TeachersByDepartmentChart({ data }: TeachersByDepartmentChartProps) {
  const option = {
    title: {
      text: 'จำนวนครูแต่ละแผนก',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} คน ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: {
        color: '#64748b',
        fontSize: 12
      }
    },
    series: [
      {
        name: 'แผนก',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#0f172a'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          value: item.count,
          name: item.department,
          itemStyle: {
            color: [
              '#0ea5e9',
              '#06b6d4',
              '#14b8a6',
              '#10b981',
              '#22c55e',
              '#84cc16',
              '#eab308',
              '#f59e0b'
            ][index % 8]
          }
        }))
      }
    ]
  }

  return <ReactECharts option={option} style={{ height: '350px' }} />
}

