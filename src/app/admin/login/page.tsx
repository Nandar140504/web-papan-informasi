'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin')
  }, [router])

  return (
    <div className="min-h-screen bg-[#120204] flex items-center justify-center text-white font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-red-200 tracking-wider">Mengarahkan ke Portal Masuk Admin Diklat...</p>
      </div>
    </div>
  )
}
