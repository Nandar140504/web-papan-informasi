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

  if (!now) return <div className="h-screen bg-slate-950"></div>;

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
                className="h-7 md:h-9 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
              />
              <div className="h-7 w-px bg-white/20 hidden sm:block"></div>
              <div>
                <h1 className="text-sm md:text-lg font-black text-white tracking-wide leading-tight drop-shadow">
                  Admin Dashboard
                </h1>
                <p className="text-amber-200 text-[9px] md:text-[11px] leading-none mt-0.5 font-semibold">Unit Learning & Development • PT Semen Tonasa</p>
              </div>
            </div>

            {/* Logo Semen Tonasa di Mobile (HP Android) */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="h-8 w-8 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] shrink-0 md:hidden ml-auto" 
            />
          </div>

          {/* Tombol TV, Jam, dan Logo Semen Tonasa (Desktop) */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            <a 
              href="/" 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-3 py-1 rounded-full text-[9px] md:text-[11px] font-black transition-all shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105 border border-red-400/40"
            >
              <span>📺</span>
              <span>Lihat Layar TV</span>
            </a>
            
            <div className="bg-black/40 text-amber-300 px-2.5 py-1 rounded-full text-[8.5px] md:text-[9.5px] font-bold border border-white/20 text-center truncate shadow-inner">
              {now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
            </div>

            {/* Logo PT Semen Tonasa di Desktop - Ukuran Lebih Besar */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="hidden md:block h-8 md:h-9 w-8 md:w-9 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ml-1.5 shrink-0 hover:scale-105 transition-transform" 
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
