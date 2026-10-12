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

  const recentBookings = [...bookings].reverse().slice(0, 7)

  if (!now) return <div className="h-screen bg-slate-950"></div>;

  return (
    <div className="h-screen text-white relative font-sans flex flex-col overflow-y-auto lg:overflow-hidden bg-cover lg:bg-[length:100%_100%] bg-center bg-no-repeat"
         style={{ backgroundImage: 'url("/bg-building.png")' }}>
      
      {/* Soft overlay tipis tanpa warna biru agar foto HD gedung terlihat luas dan jelas */}
      <div className="absolute inset-0 bg-black/35 z-0 fixed pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-3 md:gap-4 p-3 md:p-4 lg:p-5 min-h-0">
        
        {/* Header dengan Logo SIG di Kiri dan Logo Semen Tonasa Selalu di Pojok Kanan Atas (Desktop & Mobile HP) */}
        <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-white/10 gap-2">
          
          {/* Baris Utama: Logo SIG, Judul, dan di Mobile Logo Semen Tonasa langsung di Pojok Kanan Atas */}
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2.5 md:gap-3">
              <img src="/logo-sig-white.png" alt="Logo SIG" className="h-6 md:h-8 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
              <div>
                <h1 className="text-lg md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight leading-tight">
                  Admin Dashboard
                </h1>
                <p className="text-slate-300 text-[9px] md:text-xs leading-none mt-0.5">Corporate Learning Development Room Management</p>
              </div>
            </div>

            {/* Logo Semen Tonasa di Mobile (HP Android) - Tetap di Pojok Kanan Atas Sejajar Header */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo Semen Tonasa" 
              className="h-8 w-8 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] shrink-0 md:hidden ml-auto" 
            />
          </div>

          {/* Bagian Tombol, Jam, dan Logo Semen Tonasa (di Desktop) */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-2.5 w-full md:w-auto">
            <a 
              href="/" 
              className="bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>📺</span>
              <span>Lihat Layar TV</span>
            </a>
            <div className="bg-emerald-500/20 text-emerald-300 px-2.5 md:px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-semibold border border-emerald-500/30 text-center truncate">
              {now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
            </div>
            {/* Logo PT Semen Tonasa di Desktop (md ke atas) di Paling Pojok Kanan */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo Semen Tonasa" 
              className="hidden md:block h-8 md:h-9 w-8 md:w-9 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] ml-1 shrink-0" 
            />
          </div>

        </div>

        {/* Peringatan jika Supabase belum aktif di Vercel */}
        {supabaseConnected === false && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && (
          <div className="shrink-0 bg-amber-500/15 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span><strong>Database Cloud (Supabase) belum terhubung di Vercel.</strong> Data tidak akan tersimpan online sebelum Anda memasukkan <em>Environment Variables</em> di Vercel.</span>
          </div>
        )}

        {/* Live Status Mini Cards - 24 Jam Selalu Tampil untuk Admin */}
        <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
          {rooms.map(room => {
            const roomBookings = bookings.filter(b => String(b.room_id) === String(room.id))
            const activeBooking = roomBookings.find(b => new Date(b.start_time) <= now && new Date(b.end_time) >= now)
            const nextBooking = roomBookings.filter(b => new Date(b.start_time) > now).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

            let statusColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            let icon = '🟢'
            let desc = 'Kosong / Tersedia'

            if (activeBooking) {
              statusColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              icon = '🔴'
              desc = `Dipakai: ${activeBooking.diklat_acara}`
            } else if (nextBooking) {
              statusColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              icon = '🟡'
              desc = `Akan Datang: ${new Date(nextBooking.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`
            }

            const roomImage = room.image || ROOM_IMAGES[String(room.id)] || ROOM_IMAGES[room.name];

            return (
              <div key={room.id} className={`p-2 rounded-lg border flex flex-col justify-center relative overflow-hidden ${statusColor} backdrop-blur-sm group`}>
                 {roomImage && (
                   <div 
                     className="absolute inset-0 bg-cover bg-center opacity-45 group-hover:opacity-65 transition-opacity pointer-events-none"
                     style={{ backgroundImage: `url("${roomImage}")` }}
                   />
                 )}
                 <div className="relative z-10 flex justify-between items-center mb-0.5">
                    <span className="font-bold text-[10px] md:text-xs text-slate-100 truncate pr-1">{room.name}</span>
                    <span className="text-[8px] md:text-[10px]">{icon}</span>
                 </div>
                 <div className="relative z-10 text-[9px] opacity-90 truncate">{desc}</div>
              </div>
            )
          })}
        </div>

        {/* Card Form Input */}
        <div className="shrink-0 bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4 shadow-xl">
          <h2 className="text-sm md:text-base font-bold mb-3 flex items-center gap-2">
            <div className="bg-indigo-500 p-1 rounded-md"><span className="text-white text-[10px]">+</span></div>
            Form Input Peminjaman (Masuk)
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3 mb-3">
              
              <div className="space-y-1">
                <label className="text-[8px] md:text-[9px] font-semibold text-slate-300 uppercase tracking-wider">Ruangan</label>
                <select required value={form.room_id} onChange={e => setForm({...form, room_id: e.target.value})} 
                        className="w-full bg-slate-900/50 p-1.5 md:p-2 text-[10px] md:text-xs rounded-lg outline-none border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200">
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
              
              <div className="space-y-1">
                <label className="text-[8px] md:text-[9px] font-semibold text-slate-300 uppercase tracking-wider">Acara</label>
                <input required type="text" placeholder="Nama Acara" value={form.diklat_acara} onChange={e => setForm({...form, diklat_acara: e.target.value})} 
                       className="w-full bg-slate-900/50 p-1.5 md:p-2 text-[10px] md:text-xs rounded-lg outline-none border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] md:text-[9px] font-semibold text-slate-300 uppercase tracking-wider">PIC</label>
                <input type="text" placeholder="Instruktur" value={form.instruktur_pic} onChange={e => setForm({...form, instruktur_pic: e.target.value})} 
                       className="w-full bg-slate-900/50 p-1.5 md:p-2 text-[10px] md:text-xs rounded-lg outline-none border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] md:text-[9px] font-semibold text-slate-300 uppercase tracking-wider">Materi</label>
                <input type="text" placeholder="Materi" value={form.materi} onChange={e => setForm({...form, materi: e.target.value})} 
                       className="w-full bg-slate-900/50 p-1.5 md:p-2 text-[10px] md:text-xs rounded-lg outline-none border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] md:text-[9px] font-semibold text-slate-300 uppercase tracking-wider">Mulai</label>
                <input required type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} 
                       className="w-full bg-slate-900/50 p-1.5 md:p-2 text-[10px] md:text-xs rounded-lg outline-none border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] md:text-[9px] font-semibold text-slate-300 uppercase tracking-wider">Selesai</label>
                <input required type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} 
                       className="w-full bg-slate-900/50 p-1.5 md:p-2 text-[10px] md:text-xs rounded-lg outline-none border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200" />
              </div>
              
            </div>

            <div className="flex flex-col sm:flex-row justify-end pt-2 border-t border-white/5">
              <button type="submit" disabled={loading} 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold py-1.5 md:py-2 px-5 rounded-lg transition-all shadow-lg text-[10px] md:text-xs tracking-wide w-full sm:w-auto">
                {loading ? 'Menyimpan...' : '🚀 Pinjam & Tampilkan'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabel Riwayat */}
        <div className="flex-grow flex flex-col bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4 shadow-xl min-h-0">
          
          <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h2 className="text-sm md:text-base font-bold flex items-center gap-2">
              📊 Pantauan Masuk / Keluar
            </h2>
            <a href="/api/download-excel" target="_blank" className="text-[9px] md:text-[10px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded hover:bg-emerald-600/40 transition-colors">
              📥 Unduh Excel
            </a>
          </div>

          <div className="flex-grow overflow-auto rounded-md border border-white/5">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-[#0f172a] z-10 shadow-sm">
                <tr className="border-b border-slate-700 text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide">
                  <th className="py-2 px-3 font-semibold">Ruangan</th>
                  <th className="py-2 px-3 font-semibold">Acara & Instruktur</th>
                  <th className="py-2 px-3 font-semibold">Jadwal</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 text-[10px]">Belum ada data masuk.</td>
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
                      statusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30'; 
                    } else if (now < start) { 
                      status = 'Akan Datang'; 
                      statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30'; 
                    }

                      const rowRoomImage = r?.image || ROOM_IMAGES[String(b.room_id)] || ROOM_IMAGES[r?.name || ''];

                      return (
                        <tr key={b.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors text-[9px] md:text-[10px]">
                          <td className="py-2 px-3 text-indigo-300 font-medium">
                            <div className="flex items-center gap-2">
                              {rowRoomImage ? (
                                <img 
                                  src={rowRoomImage} 
                                  alt={r?.name || ''} 
                                  className="w-7 h-5 rounded object-cover border border-white/20 shrink-0 shadow-sm" 
                                />
                              ) : null}
                              <span>{r?.name || '-'}</span>
                            </div>
                          </td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-200">{b.diklat_acara}</p>
                          <p className="text-slate-400 text-[8px] md:text-[9px]">Oleh: {b.instruktur_pic || '-'}</p>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {new Date(b.start_time).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })} 
                          {' - '} 
                          {new Date(b.end_time).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-[8px] md:text-[9px] border ${statusColor} whitespace-nowrap`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button onClick={() => handleDelete(b.id)} className="bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 px-2 py-1 rounded transition-colors text-[8px] md:text-[9px]">
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

      {/* Footer Running Text */}
      <div className="relative z-20 shrink-0 w-full bg-slate-950/80 backdrop-blur-lg border-t border-white/10 py-2.5 md:py-3 flex items-center overflow-hidden mt-auto">
        <div className="whitespace-nowrap animate-marquee text-[9px] md:text-xs font-bold tracking-[0.2em] text-slate-300">
          UNIT LEARNING & DEVELOPMENT • UNIT LEARNING & DEVELOPMENT •
        </div>
      </div>
    </div>
  )
}
