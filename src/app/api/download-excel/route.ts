import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const DEFAULT_ROOMS = [
  { id: 1, name: 'Education Room', floor: 'Lantai 2', capacity: 'Kapasitas 50/60 orang' },
  { id: 2, name: 'Learning Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang' },
  { id: 3, name: 'Knowledge Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang' },
  { id: 4, name: 'Development Room', floor: 'Lantai 1', capacity: 'Kapasitas 20/25 orang' },
  { id: 5, name: 'Podcast', floor: 'Lantai 2', capacity: 'Kapasitas 6/10 orang' }
];

const DEFAULT_SUPABASE_URL = 'https://dqsrylfuomfoydknewfu.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_BZgO0F2JC87sjpokpL9E9A_doqvtTfh';

const dataFilePath = path.join(process.cwd(), 'database.json');

function getLocalData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const parsed = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      return {
        rooms: (parsed.rooms && parsed.rooms.length > 0) ? parsed.rooms : DEFAULT_ROOMS,
        bookings: parsed.bookings || []
      };
    }
  } catch (err) {
    console.error("Gagal baca database.json lokal:", err);
  }
  return { rooms: DEFAULT_ROOMS, bookings: [] };
}

function getSupabaseClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  for (const [envKey, envVal] of Object.entries(process.env)) {
    if (typeof envKey === 'string' && typeof envVal === 'string') {
      if (envKey.startsWith('sb_publishable_') && envVal.startsWith('https://')) {
        key = envKey;
        url = envVal;
        break;
      }
      if (envVal.startsWith('sb_publishable_') && envKey.startsWith('https://')) {
        key = envVal;
        url = envKey;
        break;
      }
    }
  }

  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

export async function GET() {
  let rooms = DEFAULT_ROOMS;
  let bookings: any[] = [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: dbRooms } = await supabase.from('rooms').select('*');
      const { data: dbBookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (dbRooms && dbRooms.length > 0) rooms = dbRooms;
      if (dbBookings) bookings = dbBookings;
    } catch (err) {
      console.warn("Supabase fetch untuk excel gagal, beralih ke lokal:", err);
    }
  }

  if (bookings.length === 0) {
    const local = getLocalData();
    bookings = local.bookings || [];
    if (local.rooms && local.rooms.length > 0) rooms = local.rooms;
  }

  const formattedData = bookings.map((b: any) => {
    const room = rooms.find((r: any) => String(r.id) === String(b.room_id));
    return {
      'Ruangan': room?.name || 'Unknown',
      'Acara': b.diklat_acara,
      'Instruktur': b.instruktur_pic || '-',
      'Materi': b.materi || '-',
      'Waktu Mulai': new Date(b.start_time).toLocaleString('id-ID'),
      'Waktu Selesai': new Date(b.end_time).toLocaleString('id-ID'),
      'Waktu Input Sistem': new Date(b.created_at).toLocaleString('id-ID')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData.length > 0 ? formattedData : [{ 'Status': 'Belum ada data peminjaman' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Peminjaman");
  
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="Riwayat_Peminjaman.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  });
}
