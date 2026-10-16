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

export default function AdminPage() {
  const [rooms, setRooms] = useState<any[]>(DEFAULT_ROOMS)
  const [bookings, setBookings] = useState<any[]>([])
  const [now, setNow] = useState<Date | null>(null)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [form, setForm] = useState({
    room_id: '', diklat_acara: '', instruktur_pic: '', materi: '', start_time: '', end_time: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setNow(new Date())
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

  const recentBookings = [...bookings].reverse().slice(0, 10)
  const [selectedPreviewRoom, setSelectedPreviewRoom] = useState<string>('1')

  // Sinkronkan preview foto ketika user memilih ruangan di form
  const handleRoomSelect = (roomId: string) => {
    setForm(prev => ({ ...prev, room_id: roomId }))
    if (roomId) setSelectedPreviewRoom(roomId)
  }

  if (!now) return <div className="h-screen bg-slate-950"></div>;

  const currentPreviewRoom = rooms.find(r => String(r.id) === String(selectedPreviewRoom)) || rooms[0]
  const previewImage = currentPreviewRoom?.image || ROOM_IMAGES[String(currentPreviewRoom?.id)] || '/room-education.jpg'
  const activeBookingPreview = bookings.find(b => 
    String(b.room_id) === String(currentPreviewRoom?.id) && 
    now && new Date(b.start_time) <= now && new Date(b.end_time) >= now
  )

  return (
    <div className="min-h-screen lg:h-screen text-white relative font-sans flex flex-col overflow-y-auto lg:overflow-hidden bg-[#090e1a]">
      
      {/* Background Gedung dengan overlay gelap solid agar tidak transparan & teks sangat jelas */}
      <div 
        className="absolute inset-0 bg-cover lg:bg-[length:100%_100%] bg-center bg-no-repeat opacity-20 pointer-events-none fixed"
        style={{ backgroundImage: 'url("/bg-building.png")' }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/90 to-slate-950/95 fixed pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-3 p-3 md:p-4 lg:p-4 min-h-0">
        
        {/* Header dengan Logo SIG Lebih Besar di Kiri & Logo Semen Tonasa Lebih Besar di Kanan */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 shadow-xl">
          
          {/* Logo SIG & Judul Admin */}
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-sig-white.png" 
                alt="Logo SIG" 
                className="h-8 md:h-11 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
              />
              <div className="h-7 w-px bg-slate-700 hidden sm:block"></div>
              <div>
                <h1 className="text-lg md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-indigo-400 tracking-tight leading-tight">
                  Admin Dashboard
                </h1>
                <p className="text-slate-300 text-[9px] md:text-xs leading-none mt-0.5 font-medium">Unit Learning & Development • PT Semen Tonasa</p>
              </div>
            </div>

            {/* Logo Semen Tonasa di Mobile (HP Android) */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] shrink-0 md:hidden ml-auto" 
            />
          </div>

          {/* Tombol TV, Jam, dan Logo Semen Tonasa (Desktop) */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
            <a 
              href="/" 
              className="bg-indigo-600/80 hover:bg-indigo-600 text-white px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105"
            >
              <span>📺</span>
              <span>Lihat Layar TV</span>
            </a>
            
            <div className="bg-slate-800 text-emerald-300 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold border border-slate-700 text-center truncate shadow-sm">
              {now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
            </div>

            {/* Logo PT Semen Tonasa di Desktop - Ukuran Lebih Besar */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="hidden md:block h-10 md:h-12 w-10 md:w-12 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ml-2 shrink-0 hover:scale-105 transition-transform" 
            />
          </div>

        </div>

        {/* Peringatan Supabase jika belum aktif di Vercel */}
        {supabaseConnected === false && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && (
          <div className="shrink-0 bg-amber-500/15 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span><strong>Database Cloud (Supabase) belum terhubung di Vercel.</strong> Masukkan Environment Variables di Vercel agar tersimpan online.</span>
          </div>
        )}

        {/* Live Status Mini Cards 5 Ruangan (Solid, Tidak Transparan) */}
        <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {rooms.map(room => {
            const roomBookings = bookings.filter(b => String(b.room_id) === String(room.id))
            const activeBooking = roomBookings.find(b => new Date(b.start_time) <= now && new Date(b.end_time) >= now)
            const nextBooking = roomBookings.filter(b => new Date(b.start_time) > now).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

            let statusColor = 'bg-slate-900 border-slate-700 text-emerald-400'
            let icon = '🟢'
            let desc = 'Kosong / Tersedia'

            if (activeBooking) {
              statusColor = 'bg-rose-950/40 border-rose-600/50 text-rose-300'
              icon = '🔴'
              desc = `Dipakai: ${activeBooking.diklat_acara}`
            } else if (nextBooking) {
              statusColor = 'bg-amber-950/40 border-amber-600/50 text-amber-300'
              icon = '🟡'
              desc = `Akan Datang: ${new Date(nextBooking.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`
            }

            const isSelected = String(currentPreviewRoom?.id) === String(room.id)

            return (
              <button 
                key={room.id} 
                type="button"
                onClick={() => setSelectedPreviewRoom(String(room.id))}
                className={`p-2 rounded-xl border flex flex-col justify-center text-left transition-all cursor-pointer ${statusColor} ${
                  isSelected ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-lg' : 'hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-[10px] md:text-xs text-white truncate pr-1">{room.name}</span>
                  <span className="text-[9px]">{icon}</span>
                </div>
                <div className="text-[9px] text-slate-300 truncate">{desc}</div>
              </button>
            )
          })}
        </div>

        {/* WORKSPACE DIBAGI 2 TAMPILAN DENGAN PEMBATAS: 40% FOTO DIKLAT : 60% DAFTAR & FORM */}
        <div className="flex-grow flex flex-col lg:flex-row gap-3 min-h-0">
          
          {/* ========================================================= */}
          {/* TAMPILAN KIRI (40%): LAYAR FOTO DIKLAT & PANTAUAN RUANGAN */}
          {/* ========================================================= */}
          <div className="lg:w-[40%] flex flex-col gap-3 min-h-0">
            
            {/* Layar Utama Foto Diklat */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-xl flex flex-col">
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <h3 className="text-xs md:text-sm font-bold text-white tracking-wide">
                    Layar Pantauan Foto Diklat
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-slate-800 text-blue-300 border border-slate-700 px-2 py-0.5 rounded-full">
                  {currentPreviewRoom.floor}
                </span>
              </div>

              {/* Frame Foto Diklat HD */}
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-800 group shadow-inner">
                <img 
                  src={previewImage} 
                  alt={currentPreviewRoom.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                
                {/* Overlay Info Ruangan pada Foto */}
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between pointer-events-none">
                  <div>
                    <p className="text-white font-extrabold text-sm md:text-base drop-shadow-md leading-tight">
                      {currentPreviewRoom.name}
                    </p>
                    <p className="text-amber-300 text-[10px] md:text-xs font-semibold drop-shadow">
                      {currentPreviewRoom.capacity}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                    activeBookingPreview 
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300' 
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  } shadow-md`}>
                    {activeBookingPreview ? 'SEDANG DIGUNAKAN' : 'KOSONG / TERSEDIA'}
                  </span>
                </div>
              </div>

              {/* Pemilih Tab Ruangan Cepat untuk Layar 40% */}
              <div className="mt-2.5 pt-2 border-t border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Pilih Ruangan Layar 40%:</p>
                <div className="grid grid-cols-5 gap-1">
                  {rooms.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedPreviewRoom(String(r.id))}
                      className={`py-1 px-1 text-[9px] font-bold rounded-lg border text-center transition-all truncate cursor-pointer ${
                        String(currentPreviewRoom.id) === String(r.id)
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {r.name.replace(' Room', '')}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Card Informasi Kilas Diklat PT Semen Tonasa */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">🏛️</span>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    Informasi Diklat PT Semen Tonasa
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Unit <strong>Learning & Development</strong> merupakan pusat keunggulan (*Corporate University*) PT Semen Tonasa & SIG Group dalam mencetak SDM industri semen berdaya saing global, mengedepankan aspek <em>Operational Excellence, K3, Efisiensi Energi,</em> dan <em>Green Industry</em>.
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>📍 Gedung Diklat, Biringere, Pangkep</span>
                <span className="text-emerald-400 font-semibold">● Layanan 24 Jam</span>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* PEMBATAS ANTARA LAYAR FOTO 40% DAN DAFTAR 60% */}
          {/* ========================================================= */}
          <div className="hidden lg:flex items-center justify-center px-0.5">
            <div className="w-[2px] h-full bg-gradient-to-b from-blue-500/20 via-indigo-500/50 to-blue-500/20 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]"></div>
          </div>

          {/* ========================================================= */}
          {/* TAMPILAN KANAN (60%): DAFTAR & FORM INPUT PEMINJAMAN */}
          {/* ========================================================= */}
          <div className="lg:w-[60%] flex flex-col gap-3 min-h-0">
            
            {/* Form Input Peminjaman (Masuk) - Solid & Tajam */}
            <div className="shrink-0 bg-slate-900 border border-slate-700/80 rounded-2xl p-3 md:p-3.5 shadow-xl">
              <h2 className="text-xs md:text-sm font-bold mb-2.5 flex items-center gap-2 text-white">
                <div className="bg-indigo-600 text-white w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shadow">
                  +
                </div>
                <span>Form Peminjaman & Tampilkan ke Layar TV</span>
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-2.5 mb-2.5">
                  
                  {/* Pilihan Ruangan */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Ruangan</label>
                    <select 
                      required 
                      value={form.room_id} 
                      onChange={e => handleRoomSelect(e.target.value)} 
                      className="w-full bg-slate-800 p-2 text-xs rounded-xl outline-none border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium cursor-pointer"
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
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Acara / Diklat</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Nama Acara" 
                      value={form.diklat_acara} 
                      onChange={e => setForm({...form, diklat_acara: e.target.value})} 
                      className="w-full bg-slate-800 p-2 text-xs rounded-xl outline-none border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* PIC / Instruktur */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">PIC / Instruktur</label>
                    <input 
                      type="text" 
                      placeholder="Instruktur" 
                      value={form.instruktur_pic} 
                      onChange={e => setForm({...form, instruktur_pic: e.target.value})} 
                      className="w-full bg-slate-800 p-2 text-xs rounded-xl outline-none border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* Materi */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Materi</label>
                    <input 
                      type="text" 
                      placeholder="Materi Pelatihan" 
                      value={form.materi} 
                      onChange={e => setForm({...form, materi: e.target.value})} 
                      className="w-full bg-slate-800 p-2 text-xs rounded-xl outline-none border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* Waktu Mulai */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Waktu Mulai</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={form.start_time} 
                      onChange={e => setForm({...form, start_time: e.target.value})} 
                      className="w-full bg-slate-800 p-2 text-xs rounded-xl outline-none border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                  {/* Waktu Selesai */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Waktu Selesai</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={form.end_time} 
                      onChange={e => setForm({...form, end_time: e.target.value})} 
                      className="w-full bg-slate-800 p-2 text-xs rounded-xl outline-none border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white font-medium" 
                    />
                  </div>
                  
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg text-xs tracking-wide w-full sm:w-auto cursor-pointer"
                  >
                    {loading ? 'Menyimpan...' : '🚀 Pinjam & Tampilkan'}
                  </button>
                </div>
              </form>
            </div>

            {/* TABEL DAFTAR & PANTAUAN MASUK / KELUAR (60%) */}
            <div className="flex-grow flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl p-3 md:p-3.5 shadow-xl min-h-0">
              
              <div className="shrink-0 flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h2 className="text-xs md:text-sm font-bold text-white">
                    Daftar Pantauan Masuk / Keluar ({bookings.length} Data)
                  </h2>
                </div>
                <a 
                  href="/api/download-excel" 
                  target="_blank" 
                  className="text-[10px] bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-bold hover:bg-emerald-600/50 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>📥</span> Unduh Excel
                </a>
              </div>

              <div className="flex-grow overflow-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead className="sticky top-0 bg-slate-950 z-10 shadow-sm border-b border-slate-800">
                    <tr className="text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-bold">Ruangan</th>
                      <th className="py-2.5 px-3 font-bold">Acara & Instruktur</th>
                      <th className="py-2.5 px-3 font-bold">Jadwal</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                      <th className="py-2.5 px-3 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">Belum ada daftar data peminjaman ruangan.</td>
                      </tr>
                    ) : (
                      recentBookings.map((b: any) => {
                        const r = rooms.find(room => String(room.id) === String(b.room_id))
                        
                        let status = 'Selesai';
                        let statusColor = 'bg-slate-800 text-slate-400 border-slate-700';
                        const start = new Date(b.start_time);
                        const end = new Date(b.end_time);
                        
                        if (now >= start && now <= end) { 
                          status = 'Sedang Dipakai'; 
                          statusColor = 'bg-rose-950 text-rose-300 border-rose-500/50'; 
                        } else if (now < start) { 
                          status = 'Akan Datang'; 
                          statusColor = 'bg-amber-950 text-amber-300 border-amber-500/50'; 
                        }

                        const rowRoomImage = r?.image || ROOM_IMAGES[String(b.room_id)] || ROOM_IMAGES[r?.name || ''];

                        return (
                          <tr key={b.id} className="border-b border-slate-800/80 hover:bg-slate-800/50 transition-colors text-xs">
                            <td className="py-2 px-3 text-indigo-300 font-bold">
                              <div className="flex items-center gap-2">
                                {rowRoomImage ? (
                                  <img 
                                    src={rowRoomImage} 
                                    alt={r?.name || ''} 
                                    className="w-8 h-5 rounded-md object-cover border border-slate-700 shrink-0 shadow-sm" 
                                  />
                                ) : null}
                                <span className="truncate">{r?.name || '-'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <p className="font-bold text-white leading-tight">{b.diklat_acara}</p>
                              <p className="text-slate-400 text-[10px]">{b.instruktur_pic ? `Oleh: ${b.instruktur_pic}` : ''} {b.materi ? `(${b.materi})` : ''}</p>
                            </td>
                            <td className="py-2 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                              {new Date(b.start_time).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })} 
                              {' - '} 
                              {new Date(b.end_time).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit'})}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColor} whitespace-nowrap shadow-sm`}>
                                {status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button 
                                onClick={() => handleDelete(b.id)} 
                                className="bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 px-2.5 py-1 rounded-lg transition-colors text-[10px] font-bold cursor-pointer"
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
            </div>

          </div>

        </div>

      </div>

      {/* Footer Running Text */}
      <div className="relative z-20 shrink-0 w-full bg-slate-950 border-t border-slate-800 py-2 flex items-center overflow-hidden mt-auto">
        <div className="whitespace-nowrap animate-marquee text-[10px] md:text-xs font-bold tracking-[0.2em] text-slate-400">
          UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • SIG CORPORATE UNIVERSITY •
        </div>
      </div>
    </div>
  )
}
