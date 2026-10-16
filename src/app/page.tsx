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
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)

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

  // 5 Ruangan Asli PT Semen Tonasa
  const educationRoom = rooms.find(r => r.name.toLowerCase().includes('education')) || DEFAULT_ROOMS[0];
  const learningRoom = rooms.find(r => r.name.toLowerCase().includes('learning')) || DEFAULT_ROOMS[1];
  const knowledgeRoom = rooms.find(r => r.name.toLowerCase().includes('knowledge')) || DEFAULT_ROOMS[2];
  const developmentRoom = rooms.find(r => r.name.toLowerCase().includes('development')) || DEFAULT_ROOMS[3];
  const podcastRoom = rooms.find(r => r.name.toLowerCase().includes('podcast')) || DEFAULT_ROOMS[4];

  const orderedRooms = [educationRoom, learningRoom, knowledgeRoom, developmentRoom, podcastRoom];

  // Hitung jumlah ruangan tersedia & terpakai secara real-time
  const availableRoomsCount = rooms.filter(r => {
    const activeBooking = r.bookings?.find((b: any) => new Date(b.start_time) <= time && new Date(b.end_time) >= time);
    return !activeBooking;
  }).length;

  const inUseRoomsCount = rooms.filter(r => {
    return r.bookings?.some((b: any) => new Date(b.start_time) <= time && new Date(b.end_time) >= time);
  }).length;

  const renderMockupCard = (room: any) => {
    const activeBooking = room.bookings?.find((b: any) => 
      new Date(b.start_time) <= time && new Date(b.end_time) >= time
    )
    const nextBooking = room.bookings
      ?.filter((b: any) => new Date(b.start_time) > time)
      ?.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

    let badgeText = 'TERSEDIA';
    let badgeBg = 'bg-[#cc1823]'; // Warna merah brand persis seperti di mockup

    if (activeBooking) {
      badgeText = 'DIGUNAKAN';
      badgeBg = 'bg-rose-700 animate-pulse';
    } else if (nextBooking) {
      badgeText = 'TERJADWAL';
      badgeBg = 'bg-amber-600';
    }

    const roomImage = room.image || ROOM_IMAGES[String(room.id)] || ROOM_IMAGES[room.name] || '/room-education.jpg';

    return (
      <div 
        key={room.id}
        onClick={() => setSelectedRoom(room)}
        className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-200 overflow-hidden flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 h-full min-h-0 cursor-pointer"
      >
        {/* Foto Ruangan Asli Tajam 100% Tanpa Efek Buram */}
        <div className="relative h-[48%] min-h-[125px] w-full overflow-hidden bg-slate-100 shrink-0">
          <img 
            src={roomImage} 
            alt={room.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          
          {/* Badge Status di Pojok Kanan Atas Foto persis seperti Mockup */}
          <div className="absolute top-2.5 right-2.5">
            <span className={`${badgeBg} text-white text-[10px] xl:text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              {badgeText}
            </span>
          </div>
        </div>

        {/* Detail Ruangan di Bagian Bawah Persis Mockup */}
        <div className="p-3 xl:p-3.5 flex-1 flex flex-col justify-between bg-white text-slate-800 min-h-0">
          <div>
            {/* Nama Ruangan Asli */}
            <h3 className="font-extrabold text-sm xl:text-base text-slate-900 group-hover:text-red-700 transition-colors leading-snug truncate">
              {room.name}
            </h3>

            {/* Lantai & Kapasitas dengan Icon Merah */}
            <div className="space-y-1 mt-1.5">
              <div className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 font-semibold">
                <span className="text-red-600 font-bold text-sm">📍</span>
                <span>{room.floor}</span>
              </div>
              <div className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 font-semibold">
                <span className="text-red-600 font-bold text-sm">👥</span>
                <span>{room.capacity}</span>
              </div>
            </div>
          </div>

          {/* Tombol Chevron Lingkaran Merah di Pojok Kanan Bawah persis Mockup */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1 shrink-0">
            <span className={`text-[10px] xl:text-[11px] font-bold ${activeBooking ? 'text-rose-600' : 'text-slate-400'}`}>
              {activeBooking ? '● Sedang Digunakan' : '● Ruangan Bebas'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRoom(room);
              }}
              className="w-7 h-7 xl:w-8 xl:h-8 rounded-full border border-red-500 text-red-600 flex items-center justify-center text-xs font-bold group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm hover:scale-110 cursor-pointer"
              title="Lihat Detail Peminjaman Ruangan"
            >
              ➔
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen text-slate-800 relative flex flex-col justify-between overflow-y-auto lg:overflow-hidden bg-[#f8fafc]">
      
      {/* 1. HEADER BAR MERAH KORPORAT: LOGO SIG DI KIRI, PT SEMEN TONASA DI KANAN */}
      <div className="shrink-0 h-[68px] bg-gradient-to-r from-[#6e070e] via-[#8c1017] to-[#6e070e] border-b border-red-900/60 px-4 lg:px-6 flex items-center justify-between shadow-md relative z-30">
        
        {/* SISI KIRI: Menu Garis Tiga (☰) + Logo SIG (SESUAI PERMINTAAN USER: SIG DI KIRI) */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Popover */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-xl border border-white/20 transition-all cursor-pointer flex items-center justify-center group hover:scale-105"
              title="Menu Navigasi"
              aria-label="Menu Navigasi"
            >
              <svg className="w-5 h-5 text-white group-hover:text-amber-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-slate-900/98 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 flex flex-col gap-1.5 animate-fadeIn">
                <button 
                  onClick={() => {
                    setShowInfoModal(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-amber-300 hover:text-white hover:bg-red-700/40 transition-all cursor-pointer border border-transparent hover:border-amber-500/40 group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🏛️</span>
                  <div>
                    <p className="leading-tight">Info Diklat</p>
                    <p className="text-[10px] text-slate-400 font-normal">Profil & Fasilitas Ruangan</p>
                  </div>
                </button>

                <a 
                  href="/admin"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs md:text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-slate-600 group"
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

          {/* LOGO SIG LEBIH BESAR & JERNIH DI SEBELAH KIRI */}
          <img 
            src="/logo-sig-white.png" 
            alt="Logo SIG" 
            className="h-11 md:h-13 lg:h-14 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
          />
        </div>

        {/* SISI TENGAH: Weather Widget */}
        <div className="hidden md:flex items-center gap-4 text-white">
          <div className="h-8 w-px bg-white/20"></div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">⛅</span>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-extrabold">32°C</span>
                <span className="text-xs text-white/90 font-medium">Berawan</span>
              </div>
              <p className="text-[10px] text-amber-200 font-medium mt-0.5">Pangkep, Sulsel</p>
            </div>
          </div>
        </div>

        {/* SISI KANAN: LOGO PT SEMEN TONASA DI KANAN SESUAI PERMINTAAN USER */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <h2 className="text-sm lg:text-base font-black text-white tracking-wider leading-tight">
                PT SEMEN TONASA
              </h2>
              <p className="text-[10px] lg:text-[11px] text-amber-200 font-semibold tracking-wide">
                Kokoh Membangun Negeri
              </p>
            </div>
            {/* Logo PT Semen Tonasa Bulat Merah */}
            <img 
              src="/logo-semen-tonasa.png" 
              alt="Logo PT Semen Tonasa" 
              className="h-11 md:h-13 w-11 md:w-13 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
            />
          </div>

          <div className="h-9 w-px bg-white/20 hidden sm:block"></div>

          {/* Jam & Tanggal Lengkap */}
          <div className="text-right">
            <p className="text-[10px] md:text-xs text-white/90 font-medium tracking-wide">
              {format(time, 'EEEE, d MMMM yyyy', { locale: id })}
            </p>
            <div className="text-2xl md:text-3xl font-black font-mono tracking-wider text-white leading-tight flex items-baseline justify-end">
              <span>{format(time, 'HH:mm')}</span>
              <span className="text-xs md:text-sm text-amber-300 font-bold ml-1 opacity-90">:{String(time.getSeconds()).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. HERO BANNER: KURVA MERAH DI KIRI & FOTO GEDUNG DIKLAT PERSIS GAMBAR 2 */}
      <div className="shrink-0 h-[36vh] xl:h-[38vh] w-full relative overflow-hidden bg-[#6e070e] border-b border-red-800/40">
        
        {/* Foto Gedung Diklat Asli Tajam 100% Membentang Menyeluruh - Tanpa Batasan Kotak Kaku */}
        <div 
          className="absolute inset-0 bg-cover bg-[68%_25%] md:bg-[72%_28%]"
          style={{ backgroundImage: 'url("/bg-building.png")' }}
        />

        {/* Gelombang Kurva Merah Dinamis (SVG Wave & Swoosh persis seperti Referensi Gambar 2) */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
          viewBox="0 0 1440 360" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradien Merah Korporat Utama */}
            <linearGradient id="mainRedWave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60050b" />
              <stop offset="45%" stopColor="#8a0b12" />
              <stop offset="100%" stopColor="#60050b" />
            </linearGradient>

            {/* Gradien Merah Transparan Pembaur ke Pepohonan */}
            <linearGradient id="transRedWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8a0b12" stopOpacity="0.98" />
              <stop offset="60%" stopColor="#9e1b22" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#9e1b22" stopOpacity="0" />
            </linearGradient>

            {/* Gradien Highlight Garis Gelombang Berkilau */}
            <linearGradient id="waveHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.7" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Layer 1: Gelombang Pembaur Halus ke Pepohonan */}
          <path d="M 0,0 L 700,0 C 600,110 500,230 360,360 L 0,360 Z" fill="url(#transRedWave)" />

          {/* Layer 2: Gelombang Merah Solid Melengkung Organik */}
          <path d="M 0,0 L 590,0 C 500,110 410,230 260,360 L 0,360 Z" fill="url(#mainRedWave)" />

          {/* Layer 3: Garis Aksen Berkilau Sepanjang Kurva Gelombang */}
          <path d="M 590,0 C 500,110 410,230 260,360" fill="none" stroke="url(#waveHighlight)" strokeWidth="3" />

          {/* Layer 4: Aksen Melengkung Bawah Kanan (Bottom-Right Swoosh) persis Gambar 2 */}
          <path d="M 1160,360 C 1260,295 1360,250 1440,210 L 1440,360 Z" fill="url(#mainRedWave)" />
          <path d="M 1160,360 C 1260,295 1360,250 1440,210" fill="none" stroke="url(#waveHighlight)" strokeWidth="2.5" />
        </svg>

        {/* Konten Hero Informasi Ruang dengan Garis Pembatas Putih Tipis persis Gambar 2 */}
        <div className="relative z-10 h-full w-full max-w-[500px] flex flex-col justify-center px-6 md:px-10 lg:px-12 select-none">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-[34px] font-black text-white tracking-wide leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              Informasi Ruang
            </h1>
            <h2 className="text-lg md:text-xl lg:text-[22px] font-bold text-amber-200 tracking-wider mt-0.5 drop-shadow-sm">
              PT Semen Tonasa
            </h2>
          </div>

          {/* Garis Horizontal Tipis persis seperti di Referensi Gambar 2 */}
          <div className="w-full max-w-[340px] h-[1.5px] bg-white/40 my-2.5 rounded-full shadow-sm"></div>

          <p className="text-xs md:text-sm text-white/95 font-medium leading-relaxed max-w-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            Lihat ketersediaan dan informasi ruangan yang tersedia untuk kegiatan Anda.
          </p>

          {/* Live Status Pill */}
          <div className="mt-3.5 inline-flex items-center gap-2 bg-black/45 border border-white/25 px-3.5 py-1 rounded-full self-start backdrop-blur-sm shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold text-emerald-300">
              {availableRoomsCount} dari 5 Ruangan Tersedia
            </span>
            <span className="text-white/40">•</span>
            <span className="text-[11px] text-amber-200 font-semibold">
              Unit Learning & Development
            </span>
          </div>
        </div>

      </div>

      {/* 3. PAPAN 5 KARTU RUANGAN PUTIH SEJAJAR PERSIS SEPERTI MOCKUP */}
      <div className="flex-1 flex flex-col justify-between p-3 lg:p-4 min-h-0 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] relative">
        
        {/* Hiasan Gelombang Merah di Bawah */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-red-600/10 to-transparent pointer-events-none"></div>

        {/* 5 Kartu Ruangan Berjejer Horizontal 1 Baris */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-3.5 xl:gap-4 h-full min-h-0 relative z-10">
          {orderedRooms.map(room => renderMockupCard(room))}
        </div>

      </div>

      {/* 4. FOOTER RUNNING TEXT MERAH KORPORAT */}
      <div className="shrink-0 h-[34px] xl:h-[38px] w-full bg-[#8a0b12] text-white flex items-center overflow-hidden z-20 border-t-2 border-red-400/40">
        <div className="whitespace-nowrap animate-marquee text-[11px] xl:text-xs font-extrabold tracking-[0.25em] text-white">
          UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA • UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA • UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA • UNIT LEARNING & DEVELOPMENT • PT SEMEN TONASA • KOKOH KUAT TERPERCAYA •
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

      {/* MODAL DETAIL INFORMASI RUANGAN & PEMINJAMAN (SAAT KLIK TOMBOL PANAH MERAH ➔ ATAU KARTU) */}
      {selectedRoom && (() => {
        const curRoom = rooms.find(r => String(r.id) === String(selectedRoom.id)) || selectedRoom;
        const curActiveBooking = curRoom.bookings?.find((b: any) => 
          new Date(b.start_time) <= time && new Date(b.end_time) >= time
        );
        const curNextBookings = curRoom.bookings
          ?.filter((b: any) => new Date(b.start_time) > time)
          ?.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        const roomImg = curRoom.image || ROOM_IMAGES[String(curRoom.id)] || ROOM_IMAGES[curRoom.name] || '/room-education.jpg';

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Header Modal Merah Semen Tonasa */}
              <div className="bg-gradient-to-r from-[#6e070e] via-[#8c1017] to-[#6e070e] p-4 text-white flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-xl shrink-0 shadow-inner">
                    🏢
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base md:text-lg leading-tight text-white drop-shadow">
                      {curRoom.name}
                    </h3>
                    <p className="text-xs text-amber-200 font-semibold mt-0.5">
                      Gedung Diklat PT Semen Tonasa • {curRoom.floor}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                  title="Tutup"
                >
                  ✕
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-4 md:p-6 overflow-y-auto space-y-4 text-slate-800">
                
                {/* Foto Ruangan Asli HD Jernih */}
                <div className="relative h-48 md:h-56 w-full rounded-2xl overflow-hidden shadow-md bg-slate-100 border border-slate-200">
                  <img 
                    src={roomImg} 
                    alt={curRoom.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`${curActiveBooking ? 'bg-rose-700 animate-pulse' : 'bg-emerald-600'} text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2 uppercase tracking-wider`}>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      {curActiveBooking ? 'SEDANG DIGUNAKAN' : 'RUANGAN TERSEDIA'}
                    </span>
                  </div>
                </div>

                {/* Spesifikasi Fasilitas Dasar */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-red-600 font-bold text-lg">📍</span>
                    <div>
                      <p className="text-slate-500 font-medium">Lokasi Lantai</p>
                      <p className="font-extrabold text-slate-900 text-sm">{curRoom.floor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-red-600 font-bold text-lg">👥</span>
                    <div>
                      <p className="text-slate-500 font-medium">Kapasitas Maksimal</p>
                      <p className="font-extrabold text-slate-900 text-sm">{curRoom.capacity}</p>
                    </div>
                  </div>
                </div>

                {/* Rincian Peminjaman Aktif */}
                {curActiveBooking ? (
                  <div className="bg-red-50/90 border-2 border-red-300 rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-red-200/80 pb-2">
                      <span className="text-xs font-extrabold uppercase text-red-700 tracking-wider flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span> Peminjaman Yang Sedang Berlangsung
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-sm">
                        LIVE SAAT INI
                      </span>
                    </div>

                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
                        <span className="text-slate-500 font-bold">Acara / Diklat:</span>
                        <span className="font-black text-slate-900 text-sm md:text-base leading-snug">{curActiveBooking.diklat_acara}</span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
                        <span className="text-slate-500 font-bold">Instruktur / PIC:</span>
                        <span className="font-bold text-slate-800">{curActiveBooking.instruktur_pic || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
                        <span className="text-slate-500 font-bold">Materi:</span>
                        <span className="font-bold text-slate-800">{curActiveBooking.materi || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
                        <span className="text-slate-500 font-bold">Jam Pelaksanaan:</span>
                        <span className="font-black text-red-700 bg-red-100/90 border border-red-200 px-2.5 py-1 rounded-lg self-start text-xs md:text-sm">
                          ⏰ {format(new Date(curActiveBooking.start_time), 'HH:mm')} – {format(new Date(curActiveBooking.end_time), 'HH:mm')} WITA
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-xl font-bold mb-2 shadow-sm">
                      ✓
                    </div>
                    <h4 className="font-black text-sm md:text-base text-emerald-900">
                      Ruangan Siap & Bebas Digunakan
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
                      Saat ini tidak ada kegiatan aktif di ruangan ini. Ruangan dalam kondisi bersih, sejuk ber-AC, dan siap dipakai untuk pelatihan atau rapat.
                    </p>
                  </div>
                )}

                {/* Jadwal Kegiatan Selanjutnya Hari Ini jika ada */}
                {curNextBookings && curNextBookings.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 space-y-2">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>📅</span> Jadwal Terjadwal Selanjutnya Hari Ini:
                    </p>
                    <div className="space-y-2">
                      {curNextBookings.map((b: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center shadow-sm">
                          <div>
                            <p className="font-bold text-slate-900">{b.diklat_acara}</p>
                            <p className="text-slate-500 text-[11px] mt-0.5">PIC: {b.instruktur_pic || '-'}</p>
                          </div>
                          <span className="font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs shrink-0">
                            ⏰ {format(new Date(b.start_time), 'HH:mm')} – {format(new Date(b.end_time), 'HH:mm')} WITA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Modal */}
              <div className="p-3.5 md:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">
                  Unit Learning & Development • PT Semen Tonasa
                </span>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md hover:scale-105"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  )
}
