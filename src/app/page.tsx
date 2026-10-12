'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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

  // Ruangan Baris Atas: Education Room (kiri), Podcast (kanan), Tengah Kosong
  const educationRoom = rooms.find(r => r.name.toLowerCase().includes('education')) || rooms[0];
  const podcastRoom = rooms.find(r => r.name.toLowerCase().includes('podcast')) || rooms[4] || rooms[rooms.length - 1];

  // Ruangan Baris Bawah: Development Room, Knowledge Room, Learning Room (berjejer 3)
  const developmentRoom = rooms.find(r => r.name.toLowerCase().includes('development')) || rooms.find(r => String(r.id) === '4');
  const knowledgeRoom = rooms.find(r => r.name.toLowerCase().includes('knowledge')) || rooms.find(r => String(r.id) === '3');
  const learningRoom = rooms.find(r => r.name.toLowerCase().includes('learning')) || rooms.find(r => String(r.id) === '2');

  const bottomRoomsList = [developmentRoom, knowledgeRoom, learningRoom].filter(Boolean);
  const bottomList = bottomRoomsList.length === 3 ? bottomRoomsList : rooms.filter(r => r !== educationRoom && r !== podcastRoom);

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

    const roomImage = room.image || ROOM_IMAGES[String(room.id)] || ROOM_IMAGES[room.name];

    return (
      <div 
        key={room.id} 
        className="w-full lg:flex-1 lg:max-w-[32%] border border-white/30 rounded-2xl p-3 lg:p-4 shadow-2xl relative flex flex-col overflow-hidden group backdrop-blur-md"
      >
        {/* Background Foto Ruangan jika tersedia - Diberi sedikit blur agar estetik & tidak menghalangi foto gedung diklat */}
        {roomImage ? (
          <>
            <div 
              className="absolute -inset-2 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110 filter blur-[2px] opacity-85 scale-105"
              style={{ backgroundImage: `url("${roomImage}")` }}
            />
            {/* Gradien sangat lembut di tepi atas & bawah */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#121c33]/90 pointer-events-none" />
        )}

        {/* Indikator Status Warna di Pinggir Kiri */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderColor} rounded-l-xl z-20`}></div>

        {/* Header Ruangan */}
        <div className="relative z-10 flex justify-between items-start pl-2 mb-2 pb-2 border-b border-white/25 shrink-0">
          <div>
            <h3 className="text-sm lg:text-base font-extrabold text-white mb-0.5 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{room.name}</h3>
            <p className="text-[9px] md:text-[10px] text-amber-300 uppercase tracking-widest leading-none mb-1 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{room.floor}</p>
            <p className="text-[9px] md:text-[10px] text-slate-100 leading-none font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{room.capacity}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[8px] lg:text-[9px] font-extrabold tracking-wider border ${badgeColor} bg-black/50 whitespace-nowrap ml-2 shadow-lg`}>
            {badgeText}
          </span>
        </div>

        {/* Informasi Acara (Tengah) - Bersih Tanpa Kotak Hitam */}
        <div className="relative z-10 pl-2 flex-1 flex flex-col justify-center py-1">
          {displayBooking ? (
            <div className="space-y-1.5 lg:space-y-2">
              <div className="grid grid-cols-[60px_1fr] lg:grid-cols-[70px_1fr] gap-2 items-start">
                <span className="text-amber-300 text-[10px] lg:text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Diklat</span>
                <span className="text-white text-[10px] lg:text-xs font-extrabold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{displayBooking.diklat_acara}</span>
              </div>
              <div className="grid grid-cols-[60px_1fr] lg:grid-cols-[70px_1fr] gap-2 items-start">
                <span className="text-slate-200 text-[10px] lg:text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Instruktur</span>
                <span className="text-white text-[10px] lg:text-xs font-bold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{displayBooking.instruktur_pic || '-'}</span>
              </div>
              <div className="grid grid-cols-[60px_1fr] lg:grid-cols-[70px_1fr] gap-2 items-start">
                <span className="text-slate-200 text-[10px] lg:text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Materi</span>
                <span className="text-white text-[10px] lg:text-xs font-bold leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{displayBooking.materi || '-'}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
                <p className="text-emerald-300 text-[11px] lg:text-xs tracking-wider uppercase font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  Silakan Digunakan
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Jam Acara (Bawah) - Bersih Tanpa Kotak Hitam */}
        <div className="relative z-10 pl-2 mt-2 pt-2 border-t border-white/25 shrink-0">
          {displayBooking ? (
            <p className="text-white text-[10px] lg:text-xs font-extrabold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center gap-1.5">
              <span>⏰</span>
              <span>{format(new Date(displayBooking.start_time), 'HH:mm')} – {format(new Date(displayBooking.end_time), 'HH:mm')}</span>
            </p>
          ) : (
            <p className="text-slate-300 text-[10px] lg:text-xs font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
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
      
      {/* Logo SIG di Sebelah Kiri Atas - Digeser masuk tidak terlalu pojok */}
      <div className="fixed top-5 left-7 md:left-10 lg:left-12 z-50 flex items-center">
        <img src="/logo-sig-white.png" alt="Logo SIG" className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Simbol User Admin & Logo PT Semen Tonasa di Sebelah Kanan Atas - Digeser masuk tidak terlalu pojok */}
      <div className="fixed top-5 right-7 md:right-10 lg:right-12 z-50 flex items-center gap-3">
        <a 
          href="/admin" 
          className="bg-slate-900/75 hover:bg-indigo-600/80 text-slate-200 hover:text-white border border-white/25 hover:border-white/50 p-2 md:p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg flex items-center justify-center group"
          title="Buka Halaman Admin"
        >
          {/* Simbol Pengguna / Profil Admin */}
          <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-200 group-hover:text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
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
          
          {/* Baris Atas: Education Room di Kiri, Tengah KOSONG, Podcast di Kanan - Naik sedikit ke atas */}
          <div className="flex flex-col lg:flex-row justify-between gap-3 lg:gap-4 mb-3 lg:gap-4 lg:mb-4 lg:-translate-y-2">
            {educationRoom ? renderCard(educationRoom) : null}
            {/* Bagian tengah sengaja dikosongkan agar foto gedung Rumah Diklat terlihat jelas */}
            <div className="hidden lg:block lg:flex-1 lg:max-w-[32%] pointer-events-none"></div>
            {podcastRoom ? renderCard(podcastRoom) : null}
          </div>
          
          {/* Baris Bawah: Development Room, Learning Room, Knowledge Room berjejer 3 */}
          <div className="flex flex-col lg:flex-row justify-center gap-3 lg:gap-4">
            {bottomList.map(room => renderCard(room))}
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
