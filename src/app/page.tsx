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
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false)
  const [activeInfoTab, setActiveInfoTab] = useState<'profil' | 'ruangan' | 'program'>('profil')
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

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
        className="w-full lg:flex-1 lg:max-w-[31%] border border-white/30 rounded-2xl p-3 lg:p-4 shadow-2xl relative flex flex-col overflow-hidden group backdrop-blur-md"
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
      
      {/* Pojok Kiri Atas: Tombol Garis Tiga (Menu) & Logo SIG */}
      <div className="fixed top-4 md:top-5 left-4 md:left-7 lg:left-8 z-50 flex items-center gap-3">
        
        {/* Tombol Garis Tiga (Hamburger Menu) */}
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-slate-900/85 hover:bg-slate-800 text-white p-2.5 md:p-3 rounded-2xl border border-white/20 hover:border-amber-400/50 backdrop-blur-md shadow-2xl transition-all cursor-pointer flex items-center justify-center group hover:scale-105"
            title="Menu Utama (Info Diklat & Admin)"
            aria-label="Menu Navigasi"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-200 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Dropdown Menu Saat Garis Tiga Diklik */}
          {menuOpen && (
            <div className="absolute top-full left-0 mt-2.5 w-60 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 backdrop-blur-xl z-50 flex flex-col gap-1.5 animate-fadeIn">
              
              {/* Opsi 1: Info Diklat */}
              <button 
                onClick={() => {
                  setShowInfoModal(true);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-amber-300 hover:text-white hover:bg-gradient-to-r hover:from-amber-500/25 hover:to-red-600/30 transition-all cursor-pointer border border-transparent hover:border-amber-500/40 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🏛️</span>
                <div>
                  <p className="leading-tight">Info Diklat</p>
                  <p className="text-[10px] text-slate-400 font-normal">Profil & Fasilitas Ruangan</p>
                </div>
              </button>

              {/* Opsi 2: Admin Dashboard */}
              <a 
                href="/admin"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-slate-200 hover:text-white hover:bg-indigo-600/30 transition-all border border-transparent hover:border-indigo-500/40 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">👤</span>
                <div>
                  <p className="leading-tight">Admin Dashboard</p>
                  <p className="text-[10px] text-slate-400 font-normal">Kelola Peminjaman Ruangan</p>
                </div>
              </a>

            </div>
          )}
        </div>

        {/* Logo SIG - Ukuran Besar & Tajam */}
        <img 
          src="/logo-sig-white.png" 
          alt="Logo SIG" 
          className="h-10 md:h-12 lg:h-14 w-auto object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform duration-300" 
        />
      </div>

      {/* Pojok Kanan Atas: HANYA Logo PT Semen Tonasa (Bersih tanpa tombol berserakan) */}
      <div className="fixed top-4 md:top-5 right-5 md:right-8 lg:right-10 z-50 flex items-center">
        <img 
          src="/logo-semen-tonasa.png" 
          alt="Logo PT Semen Tonasa" 
          className="h-11 md:h-14 lg:h-16 w-11 md:w-14 lg:w-16 object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform duration-300" 
        />
      </div>

      {/* Soft overlay tipis tanpa warna biru agar foto HD gedung terlihat luas dan jelas */}
      <div className="absolute inset-0 z-0 bg-black/25 fixed pointer-events-none"></div>

      <div className="relative z-10 flex-1 flex flex-col justify-between w-full min-h-0">
        
        {/* Header Layar */}
        <div className="shrink-0 text-center pt-3 lg:pt-4 pb-1 lg:pb-2">
          <h1 className="text-xl md:text-2xl lg:text-2xl font-bold tracking-widest text-slate-300 drop-shadow-md">AVAILABLE ROOMS</h1>
          <h2 className="text-[9px] md:text-[10px] tracking-widest text-slate-400 mb-0.5 mt-1 font-semibold">CORPORATE LEARNING DEVELOPMENT • PT SEMEN TONASA</h2>
          <div className="text-5xl md:text-6xl lg:text-6xl font-extrabold text-white tracking-wider mb-1 mt-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            {format(time, 'HH:mm')}
          </div>
          <div className="text-xs md:text-sm lg:text-sm text-slate-300 mt-1 font-medium drop-shadow">
            {format(time, 'EEEE, d MMMM yyyy', { locale: id })}
          </div>
        </div>

        {/* Zona Kartu Ruangan - Selalu Tampil 24 Jam */}
        <div className="flex-1 min-h-0 flex flex-col justify-center w-full max-w-[98%] xl:max-w-[96%] mx-auto px-2 lg:px-4 py-2">
          
          {/* Baris Atas: Education Room (Pojok Kiri), Tengah KOSONG, Podcast (Pojok Kanan) - Naik sedikit ke atas */}
          <div className="flex flex-col lg:flex-row justify-between gap-3 lg:gap-4 mb-3 lg:gap-4 lg:mb-4 lg:-translate-y-2">
            {educationRoom ? renderCard(educationRoom) : null}
            {/* Bagian tengah sengaja dikosongkan agar foto gedung Rumah Diklat terlihat jelas */}
            <div className="hidden lg:block lg:flex-1 lg:max-w-[31%] pointer-events-none"></div>
            {podcastRoom ? renderCard(podcastRoom) : null}
          </div>
          
          {/* Baris Bawah: Development Room (Pojok Kiri), Knowledge Room (TETAP DI TENGAH), Learning Room (Pojok Kanan) */}
          <div className="flex flex-col lg:flex-row justify-between gap-3 lg:gap-4">
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

      {/* MODAL INTERAKTIF: Informasi Diklat PT SEMEN TONASA */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
              <div className="flex items-center gap-3">
                <img src="/logo-sig-white.png" alt="SIG" className="h-8 md:h-10 w-auto" />
                <div className="h-8 w-px bg-slate-700"></div>
                <img src="/logo-semen-tonasa.png" alt="Semen Tonasa" className="h-9 md:h-11 w-9 md:w-11 object-contain" />
                <div>
                  <h2 className="text-base md:text-xl font-bold text-white tracking-wide">
                    Pusat Pendidikan & Pelatihan (Diklat)
                  </h2>
                  <p className="text-xs text-amber-400 font-medium">Unit Learning & Development • PT Semen Tonasa</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Navigasi Tab */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
              <button 
                onClick={() => setActiveInfoTab('profil')}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-t-lg transition-all cursor-pointer ${
                  activeInfoTab === 'profil' 
                    ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-500' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏛️ Profil & Visi L&D
              </button>
              <button 
                onClick={() => setActiveInfoTab('ruangan')}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-t-lg transition-all cursor-pointer ${
                  activeInfoTab === 'ruangan' 
                    ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏢 Fasilitas Ruangan
              </button>
              <button 
                onClick={() => setActiveInfoTab('program')}
                className={`px-4 py-2 text-xs md:text-sm font-bold rounded-t-lg transition-all cursor-pointer ${
                  activeInfoTab === 'program' 
                    ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎯 Program & Sertifikasi
              </button>
            </div>

            {/* Isi Konten Tab */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 text-slate-300 text-xs md:text-sm leading-relaxed">
              
              {activeInfoTab === 'profil' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/30 p-4 rounded-xl border border-blue-800/30">
                    <h3 className="text-sm md:text-base font-bold text-white mb-1 flex items-center gap-2">
                      <span>🌟</span>
                      <span>Bagian dari SIG Corporate University</span>
                    </h3>
                    <p className="text-slate-300">
                      Unit <strong>Learning & Development (L&D) PT Semen Tonasa</strong> terintegrasi dengan ekosistem <em>SIG Corporate University</em>, yang berperan strategis menjembatani kesenjangan kompetensi (*competency gap*) karyawan menuju standar industri semen berkelas dunia (*World-Class Cement Manufacturer*).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                      <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                        <span>🎯</span> Visi Pembelajaran
                      </h4>
                      <p className="text-xs text-slate-300">
                        Menjadi pusat keunggulan (*Center of Excellence*) pengembangan kapabilitas SDM yang adaptif, inovatif, berdaya saing global, serta berorientasi pada keberlanjutan (*Green Industry & Decarbonization*).
                      </p>
                    </div>

                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                      <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                        <span>⚡</span> Nilai Utama
                      </h4>
                      <p className="text-xs text-slate-300">
                        Menanamkan core values <strong>AKHLAK BUMN</strong> (Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif) pada setiap insan Semen Tonasa demi operational excellence.
                      </p>
                    </div>
                  </div>

                  {/* Lokasi & Peta Google Maps Gedung Diklat PT Semen Tonasa */}
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">📍</span>
                        <div>
                          <p className="font-bold text-white text-xs md:text-sm">Lokasi Gedung Diklat PT Semen Tonasa</p>
                          <p className="text-[11px] text-slate-300">Kompleks Pabrik PT Semen Tonasa, Biringere, Kec. Bungoro, Kab. Pangkep, Sulawesi Selatan</p>
                        </div>
                      </div>
                      <a 
                        href="https://maps.google.com/?q=Gedung+Diklat+PT+Semen+Tonasa+Biringere+Pangkep" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
                      >
                        <span>🗺️ Buka Google Maps</span>
                        <span>↗</span>
                      </a>
                    </div>

                    {/* Google Maps Embed Iframe */}
                    <div className="w-full h-48 md:h-56 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner bg-slate-950">
                      <iframe
                        title="Google Maps Gedung Diklat PT Semen Tonasa"
                        src="https://maps.google.com/maps?q=Gedung+Diklat+PT+Semen+Tonasa+Biringere+Bungoro+Pangkep&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full filter contrast-[1.05]"
                      ></iframe>
                    </div>
                  </div>
                </div>
              )}

              {activeInfoTab === 'ruangan' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Gedung Diklat PT Semen Tonasa dilengkapi 5 sarana ruang pembelajaran berteknologi modern dengan pendingin udara, Smart TV interaktif, dan sound system profesional:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Education Room */}
                    <div className="bg-slate-800/70 rounded-xl overflow-hidden border border-slate-700/60 flex flex-col">
                      <img src="/room-education.jpg" alt="Education Room" className="h-28 w-full object-cover" />
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">Lantai 2</span>
                          <h4 className="font-bold text-white text-sm mt-1">Education Room</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kapasitas 50/60 orang. Aula utama untuk seminar akbar, pelatihan teori skala besar, dan pertemuan direksi.</p>
                        </div>
                      </div>
                    </div>

                    {/* Learning Room */}
                    <div className="bg-slate-800/70 rounded-xl overflow-hidden border border-slate-700/60 flex flex-col">
                      <img src="/room-learning.jpg" alt="Learning Room" className="h-28 w-full object-cover" />
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Lantai 1</span>
                          <h4 className="font-bold text-white text-sm mt-1">Learning Room</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kapasitas 30/40 orang. Dilengkapi Smart TV interaktif untuk kelas teknis, sertifikasi, dan lokakarya operasional.</p>
                        </div>
                      </div>
                    </div>

                    {/* Knowledge Room */}
                    <div className="bg-slate-800/70 rounded-xl overflow-hidden border border-slate-700/60 flex flex-col">
                      <img src="/room-knowledge.jpg" alt="Knowledge Room" className="h-28 w-full object-cover" />
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Lantai 1</span>
                          <h4 className="font-bold text-white text-sm mt-1">Knowledge Room</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kapasitas 30/40 orang. Suasana modern berpanel kayu untuk sharing session ilmu dan transfer pengetahuan ahli.</p>
                        </div>
                      </div>
                    </div>

                    {/* Development Room */}
                    <div className="bg-slate-800/70 rounded-xl overflow-hidden border border-slate-700/60 flex flex-col">
                      <img src="/room-development.jpg" alt="Development Room" className="h-28 w-full object-cover" />
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">Lantai 1</span>
                          <h4 className="font-bold text-white text-sm mt-1">Development Room</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kapasitas 20/25 orang. Dinding hijau modern untuk pelatihan kepemimpinan intensif, FGD, dan problem solving.</p>
                        </div>
                      </div>
                    </div>

                    {/* Podcast Room */}
                    <div className="bg-slate-800/70 rounded-xl overflow-hidden border border-slate-700/60 flex flex-col sm:col-span-2 lg:col-span-1">
                      <img src="/room-podcast.jpg" alt="Podcast Room" className="h-28 w-full object-cover" />
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">Lantai 2</span>
                          <h4 className="font-bold text-white text-sm mt-1">Podcast Room</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Kapasitas 6/10 orang. Studio rekaman profesional, mic condenser, acoustic treatment untuk konten edukasi digital.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeInfoTab === 'program' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400 text-lg">🏭</span>
                        <h4 className="font-bold text-white text-sm">Technical Cement Training</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Pelatihan keahlian teknis pemeliharaan mesin pabrik, operasi kiln, penggilingan semen (*finish mill*), kimia semen, efisiensi energi thermal, dan teknologi otomatisasi industri 4.0.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-lg">🦺</span>
                        <h4 className="font-bold text-white text-sm">Keselamatan & K3 (HSE)</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Pembinaan komprehensif Keselamatan dan Kesehatan Kerja, sertifikasi K3 umum, penanganan bahan B3, tanggap darurat, serta standar perlindungan lingkungan ISO 14001 dan ISO 45001.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-lg">👑</span>
                        <h4 className="font-bold text-white text-sm">Leadership & Assessment</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Pelatihan *Leadership Assessment & Evaluation*, pembentukan karakter manajerial, kepemimpinan transformasional, dan persiapan kader pimpinan di seluruh lini unit kerja.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-lg">🎓</span>
                        <h4 className="font-bold text-white text-sm">Kemitraan Akademik & Magang</h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Kolaborasi riset industri dengan universitas terkemuka (Unhas dll), Program Magang Mahasiswa Bersertifikat (PMMB) BUMN, serta beasiswa vokasi bagi masyarakat sekitar.
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div className="p-3 md:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">© PT Semen Tonasa • SIG Group • Papan Informasi Diklat Online</span>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
