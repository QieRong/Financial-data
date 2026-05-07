"use client"

import { Suspense } from "react"
import ROEAnalysis from "@/app/dashboard/_components/analysis/roe"

export default function ComprehensiveAnalysis() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">综合分析</h2>
      </div>
      <div className="grid gap-4">
        <Suspense fallback={null}>
          <ROEAnalysis />
        </Suspense>
      </div>
    </div>
  )
} 
