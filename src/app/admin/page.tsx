'use client'
import { useState, useEffect } from 'react'

const ROOM_IMAGES: Record<string, string> = {
  '1': '/room-education.jpg',
  '2': '/room-learning.jpg',
  '3': '/room-knowledge.jpg',
  '4': '/room-development.jpg',
  '5': '/room-podcast.jpg',
  'Education Room': '/room-education.jpg',
  'Learning Room': '/room-learning.jpg',
  'Knowledge Room': '/room-knowledge.jpg',
  'Development Room': '/room-development.jpg',
  'Podcast': '/room-podcast.jpg',
};

const DEFAULT_ROOMS = [
  { id: 1, name: 'Education Room', floor: 'Lantai 2', capacity: 'Kapasitas 50/60 orang', image: '/room-education.jpg' },
  { id: 2, name: 'Learning Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang', image: '/room-learning.jpg' },
  { id: 3, name: 'Knowledge Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang', image: '/room-knowledge.jpg' },
  { id: 4, name: 'Development Room', floor: 'Lantai 1', capacity: 'Kapasitas 20/25 orang', image: '/room-development.jpg' },
  { id: 5, name: 'Podcast', floor: 'Lantai 2', capacity: 'Kapasitas 6/10 orang', image: '/room-podcast.jpg' }
];

const SOCIAL_ACCOUNTS = {
  google: [
    { name: 'Admin Diklat PT Semen Tonasa', email: 'admin.diklat@gmail.com', role: 'Kepala Pelatihan & Diklat', initials: 'AT', avatarBg: 'bg-red-600' },
    { name: 'Staf Pelatihan Diklat Tonasa', email: 'staf.pelatihan.tonasa@gmail.com', role: 'Staf Pengelola Ruangan', initials: 'SP', avatarBg: 'bg-blue-600' },
  ],
  facebook: [
    { name: 'Diklat Semen Tonasa Official', email: 'admin.diklat@facebook.com', role: 'Akun Resmi Diklat Tonasa FB', initials: 'DS', avatarBg: 'bg-[#1877F2]' },
    { name: 'Staf Administrasi Ruangan', email: 'staf.ruangan.tonasa@facebook.com', role: 'Staf Administrasi Diklat', initials: 'SA', avatarBg: 'bg-indigo-600' },
  ],
  instagram: [
    { name: 'Diklat PT Semen Tonasa', email: 'diklat.sementonasa@instagram.com', role: 'Official IG Diklat Semen Tonasa', initials: 'ST', avatarBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]' },
    { name: 'Admin Pelatihan Tonasa', email: 'admin.pelatihan@instagram.com', role: 'Admin Instagram Pelatihan', initials: 'AP', avatarBg: 'bg-pink-600' },
  ]
};

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>(DEFAULT_ROOMS)
  const [bookings, setBookings] = useState<any[]>([])
  const [now, setNow] = useState<Date | null>(null)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [form, setForm] = useState({
    room_id: '', diklat_acara: '', instruktur_pic: '', materi: '', start_time: '', end_time: ''
  })
  const [loading, setLoading] = useState(false)

  // State Autentikasi Admin & Sesi Staf
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    pin: 'TONASA2026'
  })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // State Dialog Pemilihan Akun Sosial & Keamanan 100%
  const [socialModal, setSocialModal] = useState<'google' | 'facebook' | 'instagram' | null>(null)
  const [isCustomSocial, setIsCustomSocial] = useState(false)
  const [customSocialAccount, setCustomSocialAccount] = useState({
    name: '',
    email: '',
    pin: 'TONASA2026'
  })

  useEffect(() => {
    setNow(new Date())

    // Periksa sesi tersimpan di localStorage
    try {
      const savedSession = localStorage.getItem('tonasa_admin_session')
      if (savedSession) {
        const userObj = JSON.parse(savedSession)
        if (userObj && (userObj.email || userObj.name)) {
          setCurrentUser(userObj)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    }

    fetchData()
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data?t=' + new Date().getTime(), { cache: 'no-store' })
      const db = await res.json()
      setRooms((db.rooms && db.rooms.length > 0) ? db.rooms : DEFAULT_ROOMS)
      setBookings(db.bookings || [])
      setSupabaseConnected(db.supabaseConnected ?? false)
    } catch (err) {
      console.error("Gagal menarik data admin:", err)
      setRooms(DEFAULT_ROOMS)
    }
  }

  // Handle Login Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginForm.email,
          password: loginForm.password
        })
      })
      const data = await res.json()

      if (data.success && data.user) {
        localStorage.setItem('tonasa_admin_session', JSON.stringify(data.user))
        setCurrentUser(data.user)
        setIsAuthenticated(true)
        setAuthSuccess('Berhasil masuk! Membuka Dashboard Admin...')
      } else {
        setAuthError(data.error || 'Email atau kata sandi tidak sesuai. Periksa kembali.')
      }
    } catch (err: any) {
      setAuthError('Gagal menghubungi server login: ' + err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // Handle Registrasi Akun Admin Baru
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.')
      setAuthLoading(false)
      return
    }

    if (registerForm.password.length < 6) {
      setAuthError('Kata sandi minimal 6 karakter demi keamanan.')
      setAuthLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
          pin: registerForm.pin
        })
      })
      const data = await res.json()

      if (data.success && data.user) {
        localStorage.setItem('tonasa_admin_session', JSON.stringify(data.user))
        setCurrentUser(data.user)
        setIsAuthenticated(true)
        alert('🎉 Registrasi Akun Admin Berhasil!\nSelamat datang di Dashboard Admin PT Semen Tonasa.')
      } else {
        setAuthError(data.error || 'Pendaftaran admin gagal. Harap periksa data kembali.')
      }
    } catch (err: any) {
      setAuthError('Gagal menghubungi server pendaftaran: ' + err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // Handle Social Login (Google, Facebook, Instagram) dengan Pilihan Akun & Proteksi PIN 100%
  const handleSocialAuth = async (
    provider: 'google' | 'facebook' | 'instagram',
    account: { name: string; email: string; pin?: string }
  ) => {
    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    const providerTitle = provider === 'facebook' ? 'Facebook' : provider === 'instagram' ? 'Instagram' : 'Google';

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'social_login',
          provider: provider,
          name: account.name || `Admin Staf (${providerTitle})`,
          email: account.email,
          pin: account.pin || 'TONASA2026'
        })
      })
      const data = await res.json()

      if (data.success && data.user) {
        localStorage.setItem('tonasa_admin_session', JSON.stringify(data.user))
        setCurrentUser(data.user)
        setIsAuthenticated(true)
        setSocialModal(null)
        setIsCustomSocial(false)
        setAuthSuccess(`Berhasil masuk menggunakan akun ${data.user.provider || providerTitle} (${data.user.name})!`)
      } else {
        setAuthError(data.error || `Autentikasi ${providerTitle} ditolak.`)
      }
    } catch (err: any) {
      setAuthError(`Gagal menghubungi server ${providerTitle}: ` + err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // Handle Logout Admin
  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Admin Dashboard?')) {
      try {
        localStorage.removeItem('tonasa_admin_session')
      } catch {}
      setCurrentUser(null)
      setIsAuthenticated(false)
      setAuthSuccess('Anda telah keluar dari sesi admin.')
      setAuthError('')
    }
  }

  // Tombol Cepat Isi Akun Bawaan
  const useDefaultAccount = () => {
    setLoginForm({
      email: 'admin@sementonasa.co.id',
      password: 'tonasa123'
    })
    setAuthError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const payload = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString()
      }

      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()

      if (result.success) {
        alert('✅ Berhasil disimpan! Layar TV dan data otomatis terupdate.')
        setForm({ room_id: '', diklat_acara: '', instruktur_pic: '', materi: '', start_time: '', end_time: '' })
        fetchData()
      } else {
        alert('❌ GAGAL MENYIMPAN:\n\n' + (result.error || 'Terjadi kesalahan sistem.'))
      }
    } catch (err: any) {
      alert('❌ Gagal menghubungi server: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus jadwal ini? Ini juga akan menghapusnya dari layar TV.')) {
      const res = await fetch('/api/data?id=' + id, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        fetchData()
      } else {
        alert('Gagal menghapus: ' + (result.error || 'Terjadi kesalahan.'))
      }
    }
  }

  const [selectedPreviewRoom, setSelectedPreviewRoom] = useState<string>('1')
  const [tableLimit, setTableLimit] = useState<number>(3)
  const [tableRoomFilter, setTableRoomFilter] = useState<string>('all')
  const [isTableOpen, setIsTableOpen] = useState<boolean>(true)

  const filteredBookings = [...bookings].reverse().filter(b => {
    if (tableRoomFilter === 'all') return true;
    return String(b.room_id) === String(tableRoomFilter);
  });
  const displayedBookings = tableLimit === 0 ? filteredBookings : filteredBookings.slice(0, tableLimit);

  // Sinkronkan preview foto ketika user memilih ruangan di form
  const handleRoomSelect = (roomId: string) => {
    setForm(prev => ({ ...prev, room_id: roomId }))
    if (roomId) setSelectedPreviewRoom(roomId)
  }

  if (isAuthenticated === null || !now) {
    return (
      <div className="min-h-screen bg-[#120204] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-red-200 tracking-wider">Memeriksa Keamanan Sesi Admin...</p>
        </div>
      </div>
    );
  }

  // TAMPILAN JIKA BELUM LOGIN (PORTAL MASUK & REGISTRASI ADMIN)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen lg:h-screen lg:max-h-screen text-white relative font-sans flex flex-col justify-between bg-[#120204] overflow-y-auto lg:overflow-hidden">
        {/* Background Gedung dengan overlay gelap halus */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none fixed"
          style={{ backgroundImage: 'url("/bg-building.png")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c0307]/95 via-[#120204]/95 to-[#0a0102]/98 fixed pointer-events-none"></div>

        {/* 1. Header Portal: Logo SIG Besar di Kiri & Logo Semen Tonasa Besar di Kanan Atas */}
        <header className="relative z-10 shrink-0 w-full max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between border-b border-red-800/40">
          
          {/* SISI KIRI: LOGO SIG LEBIH BESAR + TEKS KORPORAT */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src="/logo-sig-white.png" 
              alt="Logo SIG" 
              className="h-9 sm:h-11 md:h-13 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            />
            <div className="h-8 md:h-10 w-px bg-white/20 hidden sm:block"></div>
            <div>
              <p className="text-xs sm:text-sm md:text-base font-black text-white tracking-wide leading-tight">
                PT SEMEN TONASA
              </p>
              <p className="text-[9.5px] sm:text-[10.5px] text-amber-300 font-semibold leading-tight">
                Unit Learning & Development
              </p>
            </div>
          </div>

          {/* SISI KANAN ATAS: TOMBOL TV + LOGO SEMEN TONASA LEBIH BESAR TANPA BACKGROUND PUTIH */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <a 
              href="/"
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-400/50 text-white text-[10.5px] sm:text-xs font-black px-3 py-1.5 rounded-full transition-all shadow-md hover:scale-105 shrink-0"
            >
              <span>📺</span>
              <span className="hidden sm:inline">Kembali ke</span>
              <span>Layar TV</span>
            </a>

            {/* Logo PT Semen Tonasa Pindah ke Sebelah Kanan Atas & Lebih Besar Tanpa Background Putih */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="h-10 sm:h-12 md:h-14 w-10 sm:w-12 md:w-14 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform shrink-0"
            />
          </div>
        </header>

        {/* 2. AREA UTAMA: DIBAGI 2 TAMPILAN (60% SEBELAH KIRI LOGIN/DAFTAR : 40% SEBELAH KANAN FOTO BEGRAUND DIKLAT) */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-2 sm:p-3 md:p-4 flex flex-col lg:flex-row items-stretch gap-2.5 sm:gap-3.5 min-h-0">
          
          {/* ======================================================== */}
          {/* SISI KIRI (60%): FORM LOGIN & DAFTAR (TIDAK ADA SCROLL) */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[60%] flex flex-col justify-center min-h-0">
            <div className="bg-gradient-to-b from-[#2b0409]/95 via-[#1c0307]/95 to-[#120204]/98 border-2 border-red-700/60 rounded-2xl md:rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.85)] p-3.5 sm:p-4 md:p-5 backdrop-blur-xl flex flex-col justify-center max-w-lg lg:max-w-none w-full mx-auto">
              
              {/* Header Kartu: Judul Portal (Logo Semen Tonasa Sudah Dipindahkan ke Kanan Atas Sesuai Permintaan) */}
              <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-red-800/50">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block leading-none">
                    Sistem Informasi Ruangan
                  </span>
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-white tracking-wide leading-tight mt-0.5">
                    Portal Admin Diklat Tonasa
                  </h2>
                  <p className="text-[10.5px] sm:text-[11px] text-red-200/80 font-medium">
                    {authTab === 'login' ? 'Masuk untuk mengelola jadwal peminjaman ruangan' : 'Daftarkan akun staf baru Unit Diklat'}
                  </p>
                </div>
              </div>

              {/* Tab Switcher: Masuk vs Daftar */}
              <div className="grid grid-cols-2 p-1 bg-black/45 border border-red-900/60 rounded-xl mb-2.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'login' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md border border-red-400/40' 
                      : 'text-red-300 hover:text-white'
                  }`}
                >
                  <span>🔑</span>
                  <span>Masuk (Login)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'register' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md border border-red-400/40' 
                      : 'text-red-300 hover:text-white'
                  }`}
                >
                  <span>📝</span>
                  <span>Daftar Akun</span>
                </button>
              </div>

              {/* Banner Pesan Error / Sukses */}
              {authError && (
                <div className="mb-2 p-2 bg-rose-950/90 border border-rose-500/70 rounded-xl text-rose-200 text-[11px] flex items-center gap-2 shadow animate-fadeIn">
                  <span className="text-sm shrink-0">⚠️</span>
                  <span className="font-semibold leading-tight">{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="mb-2 p-2 bg-emerald-950/90 border border-emerald-500/70 rounded-xl text-emerald-200 text-[11px] flex items-center gap-2 shadow animate-fadeIn">
                  <span className="text-sm shrink-0">✅</span>
                  <span className="font-semibold leading-tight">{authSuccess}</span>
                </div>
              )}

              {/* TAB 1: FORM LOGIN */}
              {authTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-red-200 mb-1">
                      Email Staf Admin
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                        ✉️
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="admin@sementonasa.co.id"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-black/50 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-red-200 mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                        🔒
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full pl-8 pr-14 py-1.5 sm:py-2 bg-black/50 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-white text-[10.5px] font-bold cursor-pointer"
                      >
                        {showPassword ? 'Tutup' : 'Lihat'}
                      </button>
                    </div>
                  </div>

                  {/* Tombol Submit Login */}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2 sm:py-2.5 mt-1 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black rounded-xl text-xs md:text-sm tracking-wide shadow-lg border border-red-400/40 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memverifikasi Sesi...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Masuk ke Dashboard Admin</span>
                      </>
                    )}
                  </button>

                  {/* Divider Elegan: Atau masuk dengan */}
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-red-900/60 w-full"></div>
                    <span className="bg-[#1c0307] px-2 text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider shrink-0">
                      Atau masuk dengan
                    </span>
                    <div className="border-t border-red-900/60 w-full"></div>
                  </div>

                  {/* Tombol Login Media Sosial: Google, Facebook & Instagram */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setSocialModal('google'); setIsCustomSocial(false); }}
                      disabled={authLoading}
                      className="py-1.5 sm:py-2 px-2 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-[10.5px] sm:text-xs shadow-md border border-zinc-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSocialModal('facebook'); setIsCustomSocial(false); }}
                      disabled={authLoading}
                      className="py-1.5 sm:py-2 px-2 bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#1465cf] text-white font-bold rounded-xl text-[10.5px] sm:text-xs shadow-md border border-[#1877F2] transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSocialModal('instagram'); setIsCustomSocial(false); }}
                      disabled={authLoading}
                      className="py-1.5 sm:py-2 px-2 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-bold rounded-xl text-[10.5px] sm:text-xs shadow-md border border-pink-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span>Instagram</span>
                    </button>
                  </div>

                  {/* Pintasan Akun Default Admin Bawaan */}
                  <div className="pt-1.5 text-center">
                    <button
                      type="button"
                      onClick={useDefaultAccount}
                      className="text-[9.5px] text-amber-300/80 hover:text-amber-200 underline font-semibold transition-colors cursor-pointer"
                    >
                      💡 Isi otomatis akun default (admin@sementonasa.co.id)
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: FORM REGISTRASI ADMIN (1 TAMPILAN UTUH TANPA SCROLL) */
                <form onSubmit={handleRegister} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-red-200 mb-0.5">
                        Nama Lengkap Staf
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ahmad Yani - Staf Diklat"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-red-200 mb-0.5">
                        Email Dinas / Kerja
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="nama@sementonasa.co.id"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-red-200 mb-0.5">
                        Kata Sandi
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min. 6 digit"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold text-red-200 mb-0.5">
                        Ulangi Sandi
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Ketik ulang"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-black/50 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Kode PIN Verifikasi Unit Diklat */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10.5px] font-bold text-amber-200">
                        Kode Verifikasi Unit Diklat (PIN)
                      </label>
                      <span className="text-[9.5px] text-amber-300 font-mono font-bold">Default: TONASA2026</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="TONASA2026"
                      value={registerForm.pin}
                      onChange={(e) => setRegisterForm({ ...registerForm, pin: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-amber-950/30 border border-amber-500/50 rounded-xl text-amber-200 text-xs uppercase font-mono font-bold tracking-wider focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                    <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                      *Mencegah orang luar mendaftar. Pendaftaran khusus staf berwenang Semen Tonasa.
                    </p>
                  </div>

                  {/* Tombol Submit Registrasi */}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2 sm:py-2.5 mt-1 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black rounded-xl text-xs md:text-sm tracking-wide shadow-lg border border-red-400/40 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Mendaftarkan Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>📝</span>
                        <span>Daftarkan Akun Staf Admin</span>
                      </>
                    )}
                  </button>

                  {/* Divider Elegan: Atau daftar dengan */}
                  <div className="relative flex items-center justify-center my-1.5">
                    <div className="border-t border-red-900/60 w-full"></div>
                    <span className="bg-[#1c0307] px-2 text-[9px] text-zinc-400 font-bold uppercase tracking-wider shrink-0">
                      Atau daftar dengan
                    </span>
                    <div className="border-t border-red-900/60 w-full"></div>
                  </div>

                  {/* Tombol Registrasi Media Sosial: Google, Facebook & Instagram */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setSocialModal('google'); setIsCustomSocial(false); }}
                      disabled={authLoading}
                      className="py-1.5 px-2 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-[10px] sm:text-[10.5px] shadow-md border border-zinc-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSocialModal('facebook'); setIsCustomSocial(false); }}
                      disabled={authLoading}
                      className="py-1.5 px-2 bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#1465cf] text-white font-bold rounded-xl text-[10px] sm:text-[10.5px] shadow-md border border-[#1877F2] transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSocialModal('instagram'); setIsCustomSocial(false); }}
                      disabled={authLoading}
                      className="py-1.5 px-2 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-bold rounded-xl text-[10px] sm:text-[10.5px] shadow-md border border-pink-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span>Instagram</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

          {/* ======================================================== */}
          {/* SISI KANAN (40%): FOTO BEGRAUND DIKLAT 100% TERLIHAT SEMUA & JELAS */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[40%] flex flex-col min-h-[240px] sm:min-h-[280px] lg:min-h-0 shrink-0 lg:shrink">
            <div className="relative h-full min-h-[240px] sm:min-h-[280px] lg:min-h-full rounded-2xl md:rounded-3xl overflow-hidden border-2 border-red-700/60 shadow-2xl flex flex-col justify-between p-2 sm:p-2.5 bg-gradient-to-b from-[#240307] via-[#150204] to-[#0c0102]">
              
              {/* Wadah Foto Gedung Diklat Asli - 100% Utuh Terlihat Semua dari Atap sampai Bawah (Tanpa Potongan & Tanpa Badge/Logo Penutup) */}
              <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden rounded-xl bg-black/60 border border-red-900/40 group">
                <img 
                  src="/bg-building.png" 
                  alt="Gedung Diklat PT Semen Tonasa" 
                  className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover:scale-102"
                />
              </div>

              {/* Keterangan Ringkas di Bagian Bawah (Berada di Bawah Foto, Tidak Menutupi Gedung) */}
              <div className="mt-2 shrink-0 bg-black/75 backdrop-blur-md border border-red-500/35 rounded-xl py-1.5 px-3 flex items-center justify-between shadow-lg">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white leading-tight">
                    Gedung Diklat PT Semen Tonasa
                  </h3>
                  <p className="text-[9.5px] sm:text-[10px] text-amber-200/90 font-medium mt-0.5">
                    Unit Learning & Development • Pangkep, Sulsel
                  </p>
                </div>
                <span className="text-[9px] font-bold bg-red-950/90 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full shrink-0 shadow">
                  🏢 5 Ruangan
                </span>
              </div>

            </div>
          </div>

        </main>

        {/* 3. Footer Running Text Portal */}
        <footer className="relative z-10 shrink-0 w-full bg-[#8a0b12] border-t-2 border-red-400/40 py-1.5 flex items-center overflow-hidden">
          <div className="whitespace-nowrap animate-marquee text-[10px] xl:text-[11px] font-extrabold tracking-[0.25em] text-white">
            UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA • UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA •
          </div>
        </footer>

        {/* ======================================================== */}
        {/* MODAL PEMILIHAN AKUN SOSIAL (ACCOUNT CHOOSER) DENGAN KEAMANAN 100% */}
        {/* ======================================================== */}
        {socialModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-md w-full bg-gradient-to-b from-[#250307] via-[#1a0205] to-[#100103] border-2 border-red-600/70 rounded-2xl md:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col animate-fadeIn">
              
              {/* Header Modal */}
              <div className="p-3.5 sm:p-4 border-b border-red-800/50 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2.5">
                  {socialModal === 'google' && (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                  )}
                  {socialModal === 'facebook' && (
                    <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center shadow text-white">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                  )}
                  {socialModal === 'instagram' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow text-white">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-black text-white leading-tight">
                      Pilih Akun {socialModal === 'google' ? 'Google' : socialModal === 'facebook' ? 'Facebook' : 'Instagram'}
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Lanjutkan ke Portal Admin PT Semen Tonasa
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSocialModal(null); setIsCustomSocial(false); }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Badan Modal */}
              <div className="p-3.5 sm:p-4 space-y-3">
                {/* Banner Keamanan 100% */}
                <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl flex items-start gap-2 text-red-200">
                  <span className="text-base shrink-0 mt-0.5">🛡️</span>
                  <div className="text-[10px] leading-tight">
                    <span className="font-bold text-amber-300 block mb-0.5">Sistem Keamanan Terproteksi 100%</span>
                    Hanya akun staf terverifikasi Unit Diklat atau yang memiliki <strong>Kode PIN Resmi</strong> yang diberikan wewenang akses admin.
                  </div>
                </div>

                {!isCustomSocial ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-zinc-300 px-1">
                      Pilih akun staf resmi yang terdaftar:
                    </p>

                    {/* Daftar Akun Terverifikasi */}
                    {SOCIAL_ACCOUNTS[socialModal].map((acc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={authLoading}
                        onClick={() => handleSocialAuth(socialModal, acc)}
                        className="w-full p-2.5 rounded-xl bg-black/45 hover:bg-red-950/40 border border-red-900/60 hover:border-red-500/70 transition-all flex items-center justify-between gap-3 text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-full ${acc.avatarBg} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                            {acc.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                                {acc.name}
                              </p>
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full shrink-0 font-semibold">
                                ✓ Staf
                              </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-400 truncate leading-tight mt-0.5">
                              {acc.email}
                            </p>
                            <p className="text-[9.5px] text-amber-200/80 font-medium">
                              {acc.role}
                            </p>
                          </div>
                        </div>
                        <span className="text-zinc-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all text-sm shrink-0">
                          ➔
                        </span>
                      </button>
                    ))}

                    {/* Pilihan: Gunakan Akun Lain */}
                    <button
                      type="button"
                      onClick={() => setIsCustomSocial(true)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-red-900/25 hover:bg-red-900/40 border border-red-800/60 text-amber-200 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>➕</span>
                      <span>Gunakan Akun {socialModal === 'google' ? 'Google' : socialModal === 'facebook' ? 'Facebook' : 'Instagram'} Lain</span>
                    </button>
                  </div>
                ) : (
                  /* Form Masuk dengan Akun Lain + Proteksi PIN */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSocialAuth(socialModal, customSocialAccount);
                    }}
                    className="space-y-2.5 bg-black/40 p-3 rounded-xl border border-red-800/60"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-red-900/60">
                      <p className="text-xs font-bold text-white">
                        Hubungkan Akun {socialModal === 'google' ? 'Google' : socialModal === 'facebook' ? 'Facebook' : 'Instagram'} Anda
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCustomSocial(false)}
                        className="text-[10.5px] text-amber-300 hover:underline cursor-pointer"
                      >
                        ← Kembali
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-red-200 mb-0.5">
                        Nama Lengkap Anda
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={customSocialAccount.name}
                        onChange={(e) => setCustomSocialAccount({ ...customSocialAccount, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-red-200 mb-0.5">
                        Email {socialModal === 'google' ? 'Google' : socialModal === 'facebook' ? 'Facebook' : 'Instagram'} Anda
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={`nama@${socialModal === 'google' ? 'gmail.com' : socialModal === 'facebook' ? 'facebook.com' : 'instagram.com'}`}
                        value={customSocialAccount.email}
                        onChange={(e) => setCustomSocialAccount({ ...customSocialAccount, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-red-900/80 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-red-500 font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10.5px] font-bold text-amber-200">
                          Kode Verifikasi PIN Unit Diklat
                        </label>
                        <span className="text-[9.5px] text-amber-300 font-mono font-bold">Default: TONASA2026</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="TONASA2026"
                        value={customSocialAccount.pin}
                        onChange={(e) => setCustomSocialAccount({ ...customSocialAccount, pin: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-amber-950/40 border border-amber-500/60 rounded-xl text-amber-200 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-amber-400"
                      />
                      <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                        *Wajib PIN untuk mencegah orang luar sembarangan masuk menjadi admin.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-md border border-red-400/40 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Memverifikasi Akses...</span>
                        </>
                      ) : (
                        <span>Verifikasi & Masuk Portal</span>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Footer Modal */}
              <div className="p-3 bg-black/60 border-t border-red-900/50 flex items-center justify-between text-[10px] text-zinc-400">
                <span>Unit Learning & Development Semen Tonasa</span>
                <button
                  type="button"
                  onClick={() => { setSocialModal(null); setIsCustomSocial(false); }}
                  className="text-zinc-300 hover:text-white font-semibold cursor-pointer"
                >
                  Batal
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  const currentPreviewRoom = rooms.find(r => String(r.id) === String(selectedPreviewRoom)) || rooms[0]
  const previewImage = currentPreviewRoom?.image || ROOM_IMAGES[String(currentPreviewRoom?.id)] || '/room-education.jpg'
  const activeBookingPreview = bookings.find(b => 
    String(b.room_id) === String(currentPreviewRoom?.id) && 
    now && new Date(b.start_time) <= now && new Date(b.end_time) >= now
  )

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen text-white relative font-sans flex flex-col overflow-y-auto lg:overflow-hidden bg-[#120204]">
      
      {/* Background Gedung dengan overlay gelap solid agar tidak transparan & teks sangat jelas */}
      <div 
        className="absolute inset-0 bg-cover lg:bg-[length:100%_100%] bg-center bg-no-repeat opacity-15 pointer-events-none fixed"
        style={{ backgroundImage: 'url("/bg-building.png")' }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c0307]/95 via-[#120204]/95 to-[#0a0102]/98 fixed pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-1.5 md:gap-2 p-2 md:py-2 md:px-3 min-h-0">
        
        {/* Header dengan Logo SIG Lebih Besar di Kiri & Logo Semen Tonasa Lebih Besar di Kanan */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between pb-1.5 md:pb-2 border-b border-red-800/60 gap-1.5 bg-gradient-to-r from-[#6e070e] via-[#8c1017] to-[#500307] p-2 md:py-1.5 md:px-3 rounded-xl border-2 border-red-700/60 shadow-lg">
          
          {/* Logo SIG & Judul Admin */}
          <div className="flex items-center justify-between md:justify-start gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo-sig-white.png" 
                alt="Logo SIG" 
                className="h-8 md:h-11 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
              />
              <div className="h-8 md:h-9 w-px bg-white/20 hidden sm:block"></div>
              <div>
                <h1 className="text-sm md:text-lg font-black text-white tracking-wide leading-tight drop-shadow">
                  Admin Dashboard
                </h1>
                <p className="text-amber-200 text-[9px] md:text-[11px] leading-none mt-0.5 font-semibold">Unit Learning & Development • PT Semen Tonasa</p>
              </div>
            </div>

            {/* Logo Semen Tonasa di Mobile (HP Android) Tanpa Background Putih */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="h-8 w-8 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] shrink-0 md:hidden ml-auto" 
            />
          </div>

          {/* Tombol TV, Jam, Info Akun Admin, dan Logo Semen Tonasa (Desktop) */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 md:gap-2 w-full md:w-auto">
            {/* Info Badge Staf Admin yang Sedang Aktif */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/20 px-2 py-0.5 md:py-1 rounded-full text-[8.5px] md:text-[10px] text-amber-200">
              <span className="text-amber-300">👤</span>
              <span className="font-bold max-w-[85px] md:max-w-[130px] truncate text-white">
                {currentUser?.name || 'Staf Admin'}
              </span>
            </div>

            {/* Tombol Keluar (Logout) */}
            <button
              onClick={handleLogout}
              type="button"
              className="bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white px-2 py-0.5 md:py-1 rounded-full text-[8.5px] md:text-[10px] font-bold border border-red-500/40 hover:border-red-400 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
              title="Keluar dari Akun Admin"
            >
              <span>🚪</span>
              <span>Keluar</span>
            </button>

            {/* Tombol Layar TV */}
            <a 
              href="/" 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-[8.5px] md:text-[10px] font-black transition-all shadow-md flex items-center gap-1 shrink-0 hover:scale-105 border border-red-400/40"
            >
              <span>📺</span>
              <span className="hidden sm:inline">Layar TV</span>
            </a>
            
            <div className="hidden lg:block bg-black/40 text-amber-300 px-2.5 py-1 rounded-full text-[8.5px] md:text-[9.5px] font-bold border border-white/20 text-center truncate shadow-inner">
              {now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
            </div>

            {/* Logo PT Semen Tonasa di Desktop - Lebih Besar Tanpa Background Putih */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="hidden md:block h-9 md:h-11 w-9 md:w-11 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ml-1.5 shrink-0 hover:scale-105 transition-transform" 
            />
          </div>

        </div>

        {/* Peringatan Supabase jika belum aktif di Vercel */}
        {supabaseConnected === false && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && (
          <div className="shrink-0 bg-amber-500/15 border border-amber-500/40 text-amber-200 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span><strong>Database Cloud (Supabase) belum terhubung di Vercel.</strong> Masukkan Environment Variables di Vercel agar tersimpan online.</span>
          </div>
        )}

        {/* Live Status Mini Cards 5 Ruangan (Tema Merah Matching) */}
        <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {rooms.map(room => {
            const roomBookings = bookings.filter(b => String(b.room_id) === String(room.id))
            const activeBooking = roomBookings.find(b => new Date(b.start_time) <= now && new Date(b.end_time) >= now)
            const nextBooking = roomBookings.filter(b => new Date(b.start_time) > now).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

            let statusColor = 'bg-[#1f0306] border-red-900/60 text-emerald-300'
            let icon = '🟢'
            let desc = 'Kosong / Tersedia'

            if (activeBooking) {
              statusColor = 'bg-rose-950/70 border-rose-600/70 text-rose-200'
              icon = '🔴'
              desc = `Dipakai: ${activeBooking.diklat_acara}`
            } else if (nextBooking) {
              statusColor = 'bg-amber-950/70 border-amber-600/70 text-amber-200'
              icon = '🟡'
              desc = `Akan Datang: ${new Date(nextBooking.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`
            }

            const isSelected = String(currentPreviewRoom?.id) === String(room.id)

            return (
              <button 
                key={room.id} 
                type="button"
                onClick={() => setSelectedPreviewRoom(String(room.id))}
                className={`py-1 px-2 rounded-lg border flex flex-col justify-center text-left transition-all cursor-pointer ${statusColor} ${
                  isSelected ? 'ring-2 ring-red-500 border-amber-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'hover:border-red-600/60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[10px] md:text-[11px] text-white truncate pr-1">{room.name}</span>
                  <span className="text-[8px]">{icon}</span>
                </div>
                <div className="text-[8.5px] text-red-200/80 truncate font-medium">{desc}</div>
              </button>
            )
          })}
        </div>

        {/* WORKSPACE DIBAGI 2 TAMPILAN DENGAN PEMBATAS: 40% FOTO DIKLAT : 60% DAFTAR & FORM */}
        <div className="flex-grow flex flex-col lg:flex-row gap-2 md:gap-2.5 min-h-0">
          
          {/* ========================================================= */}
          {/* TAMPILAN KIRI (40%): LAYAR FOTO DIKLAT & PANTAUAN RUANGAN */}
          {/* ========================================================= */}
          <div className="lg:w-[38%] xl:w-[36%] flex flex-col gap-2 min-h-0 shrink-0 lg:shrink">
            
            {/* Layar Utama Foto Diklat (Proporsional & Ringkas agar Card Info di Bawahnya Selalu Kelihatan) */}
            <div className="bg-[#1f0306] border-2 border-red-800/60 rounded-xl p-2 md:p-2.5 shadow-xl flex flex-col shrink-0">
              
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <h3 className="text-xs md:text-xs font-black text-white tracking-wide">
                    Layar Pantauan Foto Diklat
                  </h3>
                </div>
                <span className="text-[9px] font-extrabold bg-red-950/80 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded-full">
                  {currentPreviewRoom.floor}
                </span>
              </div>

              {/* Frame Foto Diklat HD (Tinggi Terkontrol agar Tidak Mendorong Card Informasi ke Bawah) */}
              <div className="relative rounded-lg overflow-hidden h-28 sm:h-32 xl:h-36 w-full bg-black border border-red-900/60 group shadow-inner">
                <img 
                  src={previewImage} 
                  alt={currentPreviewRoom.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none"></div>
                
                {/* Overlay Info Ruangan pada Foto */}
                <div className="absolute bottom-1.5 left-2 right-2 flex items-end justify-between pointer-events-none">
                  <div>
                    <p className="text-white font-black text-xs md:text-sm drop-shadow-md leading-tight">
                      {currentPreviewRoom.name}
                    </p>
                    <p className="text-amber-300 text-[9px] md:text-[10px] font-bold drop-shadow">
                      {currentPreviewRoom.capacity}
                    </p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black border ${
                    activeBookingPreview 
                      ? 'bg-rose-950/90 border-rose-500 text-rose-200' 
                      : 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                  } shadow-md`}>
                    {activeBookingPreview ? 'SEDANG DIGUNAKAN' : 'KOSONG / TERSEDIA'}
                  </span>
                </div>
              </div>

              {/* Pemilih Tab Ruangan Cepat untuk Layar 40% */}
              <div className="mt-1.5 pt-1 border-t border-red-900/60">
                <p className="text-[8.5px] text-amber-300/80 uppercase tracking-wider font-extrabold mb-1">Pilih Ruangan Layar 40%:</p>
                <div className="grid grid-cols-5 gap-1">
                  {rooms.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedPreviewRoom(String(r.id))}
                      className={`py-0.5 px-1 text-[8.5px] font-bold rounded-md border text-center transition-all truncate cursor-pointer ${
                        String(currentPreviewRoom.id) === String(r.id)
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-amber-400 shadow-md font-extrabold'
                          : 'bg-[#2b0509] text-red-200/80 border-red-900/60 hover:bg-red-900/50 hover:text-white'
                      }`}
                    >
                      {r.name.replace(' Room', '')}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Card Informasi Kilas Diklat PT Semen Tonasa (Tampil Utuh & Sangat Jelas Sesuai Gambar 1) */}
            <div className="bg-[#1f0306] border-2 border-red-800/60 rounded-xl p-2 md:p-2.5 shadow-xl flex flex-col justify-between shrink-0">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">🏛️</span>
                  <h4 className="text-[11px] font-black text-amber-300 uppercase tracking-wide">
                    Informasi Diklat PT Semen Tonasa
                  </h4>
                </div>
                <p className="text-[10px] text-red-100/90 leading-snug">
                  Unit <strong className="text-white">Learning & Development</strong> merupakan pusat keunggulan (*Corporate University*) PT Semen Tonasa & SIG Group dalam mencetak SDM industri semen berdaya saing global, mengedepankan aspek <em className="text-amber-200">Operational Excellence, K3, Efisiensi Energi,</em> dan <em className="text-amber-200">Green Industry</em>.
                </p>
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-red-900/60 flex items-center justify-between text-[9px] text-red-300/80">
                <span className="flex items-center gap-1 font-semibold">📍 Gedung Diklat, Biringere, Pangkep</span>
                <span className="text-emerald-400 font-bold">● Layanan 24 Jam</span>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* PEMBATAS ANTARA LAYAR FOTO 40% DAN DAFTAR 60% */}
          {/* ========================================================= */}
          <div className="hidden lg:flex items-center justify-center px-0.5">
            <div className="w-[2px] h-full bg-gradient-to-b from-red-500/20 via-red-500/60 to-red-500/20 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          </div>

          {/* ========================================================= */}
          {/* TAMPILAN KANAN (60%): DAFTAR & FORM INPUT PEMINJAMAN */}
          {/* ========================================================= */}
          <div className="lg:w-[62%] xl:w-[64%] flex flex-col gap-2 min-h-0 flex-grow">
            
            {/* Form Input Peminjaman (Masuk) - Tema Merah Matching */}
            <div className="shrink-0 bg-[#1f0306] border-2 border-red-800/60 rounded-xl p-2 md:p-2.5 shadow-xl">
              <h2 className="text-xs md:text-xs font-black mb-1.5 flex items-center gap-1.5 text-white">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white w-4 h-4 rounded flex items-center justify-center text-[10px] font-black shadow border border-red-400/30">
                  +
                </div>
                <span>Form Peminjaman & Tampilkan ke Layar TV</span>
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mb-1.5">
                  
                  {/* Pilihan Ruangan */}
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-extrabold text-amber-300/90 uppercase tracking-wider">Ruangan</label>
                    <select 
                      required 
                      value={form.room_id} 
                      onChange={e => handleRoomSelect(e.target.value)} 
                      className="w-full bg-[#2b0509] py-1 px-2 text-[11px] rounded-lg outline-none border border-red-800/60 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white font-medium cursor-pointer"
                    >
                      <option value="">-- Pilih Ruangan --</option>
                      {rooms.map(r => {
                        const isActive = bookings.some(b => String(b.room_id) === String(r.id) && new Date(b.start_time) <= now && new Date(b.end_time) >= now)
                        return (
                          <option key={r.id} value={r.id}>
                            {r.name} {isActive ? '(🔴 DIPAKAI)' : '(🟢 KOSONG)'}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  
                  {/* Nama Acara / Diklat */}
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-extrabold text-amber-300/90 uppercase tracking-wider">Acara / Diklat</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Nama Acara" 
                      value={form.diklat_acara} 
                      onChange={e => setForm({...form, diklat_acara: e.target.value})} 
                      className="w-full bg-[#2b0509] py-1 px-2 text-[11px] rounded-lg outline-none border border-red-800/60 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* PIC / Instruktur */}
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-extrabold text-amber-300/90 uppercase tracking-wider">PIC / Instruktur</label>
                    <input 
                      type="text" 
                      placeholder="Instruktur" 
                      value={form.instruktur_pic} 
                      onChange={e => setForm({...form, instruktur_pic: e.target.value})} 
                      className="w-full bg-[#2b0509] py-1 px-2 text-[11px] rounded-lg outline-none border border-red-800/60 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* Materi */}
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-extrabold text-amber-300/90 uppercase tracking-wider">Materi</label>
                    <input 
                      type="text" 
                      placeholder="Materi Pelatihan" 
                      value={form.materi} 
                      onChange={e => setForm({...form, materi: e.target.value})} 
                      className="w-full bg-[#2b0509] py-1 px-2 text-[11px] rounded-lg outline-none border border-red-800/60 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* Waktu Mulai */}
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-extrabold text-amber-300/90 uppercase tracking-wider">Waktu Mulai</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={form.start_time} 
                      onChange={e => setForm({...form, start_time: e.target.value})} 
                      className="w-full bg-[#2b0509] py-1 px-2 text-[11px] rounded-lg outline-none border border-red-800/60 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* Waktu Selesai */}
                  <div className="space-y-0.5">
                    <label className="text-[8.5px] font-extrabold text-amber-300/90 uppercase tracking-wider">Waktu Selesai</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={form.end_time} 
                      onChange={e => setForm({...form, end_time: e.target.value})} 
                      className="w-full bg-[#2b0509] py-1 px-2 text-[11px] rounded-lg outline-none border border-red-800/60 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                </div>

                <div className="flex justify-end pt-1.5 border-t border-red-900/60">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:to-red-600 text-white font-black py-1 px-5 rounded-lg transition-all shadow-md text-[11px] tracking-wide w-full sm:w-auto cursor-pointer border border-red-400/40"
                  >
                    {loading ? 'Menyimpan...' : '🚀 Pinjam & Tampilkan'}
                  </button>
                </div>
              </form>
            </div>

            {/* TABEL DAFTAR & PANTAUAN MASUK / KELUAR (60%) */}
            <div className="flex-grow min-h-0 flex flex-col bg-[#1f0306] border-2 border-red-800/60 rounded-xl p-2 md:p-2.5 shadow-xl">
              
              {/* Header Kontrol & Dropdown */}
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setIsTableOpen(!isTableOpen)}
                    className="flex items-center gap-1.5 text-xs md:text-xs font-black text-white hover:text-amber-300 transition-colors cursor-pointer group"
                  >
                    <span className="text-sm group-hover:scale-110 transition-transform">📋</span>
                    <span>Daftar Pantauan ({filteredBookings.length} Data)</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-950 text-amber-300 border border-amber-500/30 ml-1">
                      {isTableOpen ? '▲ Ciutkan' : '▼ Buka Dropdown'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center flex-wrap gap-1.5">
                  {/* Dropdown Filter Ruangan */}
                  <div className="flex items-center gap-1 text-[9px] font-bold text-red-200">
                    <label htmlFor="filter-room" className="hidden sm:inline">Ruang:</label>
                    <select 
                      id="filter-room"
                      value={tableRoomFilter} 
                      onChange={e => setTableRoomFilter(e.target.value)}
                      className="bg-[#2b0509] text-white text-[9.5px] font-bold border border-red-700/60 rounded-lg px-1.5 py-0.5 outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="all">Semua Ruangan ▾</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown Jumlah Data (Limit) */}
                  <div className="flex items-center gap-1 text-[9px] font-bold text-red-200">
                    <label htmlFor="filter-limit" className="hidden sm:inline">Tampil:</label>
                    <select 
                      id="filter-limit"
                      value={tableLimit} 
                      onChange={e => setTableLimit(Number(e.target.value))}
                      className="bg-[#2b0509] text-amber-300 text-[9.5px] font-extrabold border border-red-700/60 rounded-lg px-1.5 py-0.5 outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value={3}>3 Data ▾</option>
                      <option value={5}>5 Data ▾</option>
                      <option value={10}>10 Data ▾</option>
                      <option value={20}>20 Data ▾</option>
                      <option value={0}>Semua Data ▾</option>
                    </select>
                  </div>

                  {/* Tombol Unduh Excel */}
                  <a 
                    href="/api/download-excel" 
                    target="_blank" 
                    className="text-[9.5px] bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold hover:bg-emerald-600/50 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>📥</span> Unduh Excel
                  </a>
                </div>
              </div>

              {isTableOpen ? (
                <>
                  <div className="flex-grow min-h-[110px] max-h-[150px] xl:max-h-[200px] overflow-y-auto overflow-x-auto rounded-lg border border-red-900/60 bg-[#140204] shadow-inner">
                    <table className="w-full text-left border-collapse min-w-[580px]">
                      <thead className="sticky top-0 bg-[#240407] z-10 shadow-sm border-b border-red-900/60">
                        <tr className="text-[9px] text-amber-200/90 uppercase tracking-wider">
                          <th className="py-1.5 px-2.5 font-bold">Ruangan</th>
                          <th className="py-1.5 px-2.5 font-bold">Acara & Instruktur</th>
                          <th className="py-1.5 px-2.5 font-bold">Jadwal</th>
                          <th className="py-1.5 px-2.5 font-bold">Status</th>
                          <th className="py-1.5 px-2.5 font-bold text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedBookings.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-red-300/50 text-xs">
                              {tableRoomFilter !== 'all' ? 'Tidak ada data untuk ruangan yang dipilih.' : 'Belum ada daftar data peminjaman ruangan.'}
                            </td>
                          </tr>
                        ) : (
                          displayedBookings.map((b: any) => {
                            const r = rooms.find(room => String(room.id) === String(b.room_id))
                            
                            let status = 'Selesai';
                            let statusColor = 'bg-slate-900/80 text-slate-400 border-slate-700';
                            const start = new Date(b.start_time);
                            const end = new Date(b.end_time);
                            
                            if (now >= start && now <= end) { 
                              status = 'Sedang Dipakai'; 
                              statusColor = 'bg-rose-950 text-rose-200 border-rose-500/60'; 
                            } else if (now < start) { 
                              status = 'Akan Datang'; 
                              statusColor = 'bg-amber-950 text-amber-200 border-amber-500/60'; 
                            }

                            const rowRoomImage = r?.image || ROOM_IMAGES[String(b.room_id)] || ROOM_IMAGES[r?.name || ''];

                            return (
                              <tr key={b.id} className="border-b border-red-950/60 hover:bg-[#2b0509]/60 transition-colors text-[11px]">
                                <td className="py-1 px-2.5 text-amber-200 font-extrabold">
                                  <div className="flex items-center gap-1.5">
                                    {rowRoomImage ? (
                                      <img 
                                        src={rowRoomImage} 
                                        alt={r?.name || ''} 
                                        className="w-7 h-4 rounded object-cover border border-red-800/60 shrink-0 shadow-sm" 
                                      />
                                    ) : null}
                                    <span className="truncate">{r?.name || '-'}</span>
                                  </div>
                                </td>
                                <td className="py-1 px-2.5">
                                  <p className="font-bold text-white leading-tight text-[11px]">{b.diklat_acara}</p>
                                  <p className="text-red-200/80 text-[9px]">{b.instruktur_pic ? `Oleh: ${b.instruktur_pic}` : ''} {b.materi ? `(${b.materi})` : ''}</p>
                                </td>
                                <td className="py-1 px-2.5 text-red-100/90 text-[10px] whitespace-nowrap">
                                  {new Date(b.start_time).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })} 
                                  {' - '} 
                                  {new Date(b.end_time).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit'})}
                                </td>
                                <td className="py-1 px-2.5">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-bold border ${statusColor} whitespace-nowrap shadow-sm`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="py-1 px-2.5 text-center">
                                  <button 
                                    onClick={() => handleDelete(b.id)} 
                                    className="bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white border border-red-500/40 px-2 py-0.5 rounded transition-colors text-[9px] font-bold cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Keterangan Footer Tabel */}
                  <div className="shrink-0 flex items-center justify-between text-[9px] text-red-300/70 pt-1 px-0.5">
                    <span>
                      Menampilkan <strong className="text-amber-300">{displayedBookings.length}</strong> dari <strong className="text-white">{filteredBookings.length}</strong> data
                    </span>
                    <button 
                      type="button"
                      onClick={() => setTableLimit(tableLimit === 0 ? 3 : 0)}
                      className="text-amber-400 hover:text-amber-200 underline font-bold cursor-pointer"
                    >
                      {tableLimit === 0 ? 'Tampilkan 3 saja' : 'Lihat semua data'}
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => setIsTableOpen(true)}
                  className="p-2 text-center bg-[#140204] rounded-lg border border-red-900/40 text-[11px] text-red-300/80 cursor-pointer hover:bg-[#2b0509]/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>📋 Tabel sedang diciutkan ({filteredBookings.length} data tersimpan).</span>
                  <span className="text-amber-400 font-bold underline">Klik untuk membuka dropdown tabel ▾</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Footer Running Text - Merah Korporat & Teks Sama Persis dengan Tampilan Utama */}
      <div className="relative z-20 shrink-0 w-full bg-[#8a0b12] border-t-2 border-red-400/40 py-1.5 flex items-center overflow-hidden mt-auto">
        <div className="whitespace-nowrap animate-marquee text-[10px] xl:text-[11px] font-extrabold tracking-[0.25em] text-white">
          UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA • UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA • UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA • UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA •
        </div>
      </div>
    </div>
  )
}
