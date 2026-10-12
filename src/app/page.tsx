'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const DEFAULT_ROOMS = [
  { id: 1, name: 'Education Room', floor: 'Lantai 2', capacity: 'Kapasitas 50/60 orang' },
  { id: 2, name: 'Learning Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang' },
  { id: 3, name: 'Knowledge Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang' },
  { id: 4, name: 'Development Room', floor: 'Lantai 1', capacity: 'Kapasitas 20/25 orang' },
  { id: 5, name: 'Podcast', floor: 'Lantai 2', capacity: 'Kapasitas 6/10 orang' }
];

export default function TVDisplay() {
  const [time, setTime] = useState<Date | null>(null)
  // Inisialisasi langsung dengan 5 ruangan default agar selalu tampil 24 jam dan tidak pernah kosong
  const [rooms, setRooms] = useState<any[]>(DEFAULT_ROOMS)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    
    fetchRooms()
    const dataTimer = setInterval(() => fetchRooms(), 2000)

    return () => { 
      clearInterval(timer)
      clearInterval(dataTimer)
    }
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/data?t=' + new Date().getTime(), { cache: 'no-store' })
      const db = await res.json()
      
      const rawRooms = (db.rooms && db.rooms.length > 0) ? db.rooms : DEFAULT_ROOMS;
      const rawBookings = db.bookings || [];

      const mappedRooms = rawRooms.map((room: any) => ({
        ...room,
        bookings: rawBookings.filter((b: any) => String(b.room_id) === String(room.id))
      }))
      setRooms(mappedRooms)
    } catch (e) {
      console.error("Gagal menarik data, tetap menampilkan ruangan default:", e)
    }
  }

  if (!time) return <div className="min-h-screen bg-[#0a1128]"></div>

  const topRooms = rooms.slice(0, 3)
  const bottomRooms = rooms.slice(3, 5)

  const renderCard = (room: any) => {
    const activeBooking = room.bookings?.find((b: any) => 
      new Date(b.start_time) <= time && new Date(b.end_time) >= time
    )
    const nextBooking = room.bookings
      ?.filter((b: any) => new Date(b.start_time) > time)
      ?.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

    let state = 'AVAILABLE';
    let displayBooking = null;
    let borderColor = 'bg-emerald-500';
    let badgeColor = 'border-emerald-500 text-emerald-400';
    let badgeText = 'AVAILABLE';

    if (activeBooking) {
      state = 'IN_USE';
      displayBooking = activeBooking;
      borderColor = 'bg-rose-500';
      badgeColor = 'border-rose-500 text-rose-400';
      badgeText = 'IN USE';
    } else if (nextBooking) {
      state = 'UPCOMING';
      displayBooking = nextBooking;
      borderColor = 'bg-[#fbbf24]'; 
      badgeColor = 'border-[#fbbf24] text-[#fbbf24]';
      badgeText = 'UPCOMING';
    }

    return (
      <div key={room.id} className="w-full lg:flex-1 lg:max-w-[32%] bg-[#121c33]/95 border border-slate-700/30 rounded-xl p-3 lg:p-4 shadow-xl relative flex flex-col">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderColor} rounded-l-xl`}></div>

        {/* Header Ruangan */}
        <div className="flex justify-between items-start pl-2 mb-2 pb-2 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-sm lg:text-base font-bold text-white mb-0.5 leading-tight">{room.name}</h3>
            <p className="text-[9px] md:text-[10px] text-blue-300 uppercase tracking-widest leading-none mb-1">{room.floor}</p>
            <p className="text-[9px] md:text-[10px] text-slate-400 leading-none">{room.capacity}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[8px] lg:text-[9px] font-extrabold tracking-wider border ${badgeColor} whitespace-nowrap ml-2`}>
            {badgeText}
          </span>
        </div>

        {/* Informasi Acara (Tengah) */}
        <div className="pl-2 flex-1 flex flex-col justify-center py-1">
          {displayBooking ? (
            <div className="space-y-1.5 lg:space-y-2">
              <div className="grid grid-cols-[60px_1fr] lg:grid-cols-[70px_1fr] gap-2 items-start">
                <span className="text-slate-400 text-[10px] lg:text-xs">Diklat</span>
                <span className="text-white text-[10px] lg:text-xs font-semibold leading-snug">{displayBooking.diklat_acara}</span>
              </div>
              <div className="grid grid-cols-[60px_1fr] lg:grid-cols-[70px_1fr] gap-2 items-start">
                <span className="text-slate-400 text-[10px] lg:text-xs">Instruktur</span>
                <span className="text-white text-[10px] lg:text-xs font-semibold leading-snug">{displayBooking.instruktur_pic || '-'}</span>
              </div>
              <div className="grid grid-cols-[60px_1fr] lg:grid-cols-[70px_1fr] gap-2 items-start">
                <span className="text-slate-400 text-[10px] lg:text-xs">Materi</span>
                <span className="text-white text-[10px] lg:text-xs font-semibold leading-snug">{displayBooking.materi || '-'}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-2">
              <p className="text-slate-300 text-[10px] lg:text-xs tracking-widest uppercase font-medium">Silakan Digunakan</p>
            </div>
          )}
        </div>

        {/* Jam Acara (Bawah) */}
        <div className="pl-2 mt-2 pt-2 border-t border-white/5 shrink-0">
          {displayBooking ? (
            <p className="text-slate-300 text-[10px] lg:text-xs font-medium tracking-wide">
              {format(new Date(displayBooking.start_time), 'HH:mm')} – {format(new Date(displayBooking.end_time), 'HH:mm')}
            </p>
          ) : (
            <p className="text-slate-600 text-[10px] lg:text-xs font-medium tracking-wide">
              -
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen text-white relative flex flex-col overflow-y-auto lg:overflow-hidden bg-cover lg:bg-[length:100%_100%] bg-center bg-no-repeat" 
         style={{ backgroundImage: 'url("/bg-building.png")' }}>
      
      {/* Logo SIG di Sebelah Kiri Atas - Tanpa Background Putih */}
      <div className="fixed top-4 left-5 z-50 flex items-center">
        <img src="/logo-sig-white.png" alt="Logo SIG" className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Tombol Admin & Logo PT Semen Tonasa di Sebelah Kanan Atas - Tanpa Background Putih */}
      <div className="fixed top-4 right-5 z-50 flex items-center gap-3">
        <a 
          href="/admin" 
          className="bg-slate-900/80 hover:bg-indigo-600/80 text-slate-200 hover:text-white border border-white/20 hover:border-indigo-400 px-3.5 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 group"
          title="Buka Halaman Admin"
        >
          <span className="text-xs group-hover:rotate-45 transition-transform duration-300">⚙️</span>
          <span>Admin</span>
        </a>
        <img src="/logo-semen-tonasa.png" alt="Logo Semen Tonasa" className="h-9 md:h-11 w-9 md:w-11 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Soft overlay tipis tanpa warna biru agar foto HD gedung terlihat luas dan jelas */}
      <div className="absolute inset-0 z-0 bg-black/25 fixed pointer-events-none"></div>

      <div className="relative z-10 flex-1 flex flex-col justify-between w-full min-h-0">
        
        {/* Header Layar */}
        <div className="shrink-0 text-center pt-3 lg:pt-4 pb-1 lg:pb-2">
          <h1 className="text-xl md:text-2xl lg:text-2xl font-bold tracking-widest text-slate-300">AVAILABLE ROOMS</h1>
          <h2 className="text-[9px] md:text-[10px] tracking-widest text-slate-400 mb-0.5 mt-1">CORPORATE LEARNING DEVELOPMENT</h2>
          <div className="text-5xl md:text-6xl lg:text-6xl font-bold text-white tracking-wider mb-1 mt-2 drop-shadow-lg">
            {format(time, 'HH:mm')}
          </div>
          <div className="text-xs md:text-sm lg:text-sm text-slate-300 mt-1">
            {format(time, 'EEEE, d MMMM yyyy', { locale: id })}
          </div>
        </div>

        {/* Zona Kartu Ruangan - Selalu Tampil 24 Jam */}
        <div className="flex-1 min-h-0 flex flex-col justify-center w-full max-w-[98%] xl:max-w-[90%] mx-auto px-2 lg:px-0 py-2">
          
          <div className="flex flex-col lg:flex-row justify-center gap-3 lg:gap-4 mb-3 lg:gap-4 lg:mb-4">
            {topRooms.map(room => renderCard(room))}
          </div>
          
          <div className="flex flex-col lg:flex-row justify-center gap-3 lg:gap-4">
            {bottomRooms.map(room => renderCard(room))}
          </div>

        </div>

        {/* Footer Running Text */}
        <div className="shrink-0 w-full bg-[#0a1128]/95 border-t border-slate-700 py-2.5 lg:py-3 mt-2 lg:mt-0 flex items-center overflow-hidden">
          <div className="whitespace-nowrap animate-marquee text-[10px] md:text-xs lg:text-sm font-bold tracking-[0.3em] text-slate-300">
            UNIT LEARNING & DEVELOPMENT • UNIT LEARNING & DEVELOPMENT •
          </div>
        </div>

      </div>
    </div>
  )
}
