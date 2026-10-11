import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const DEFAULT_ROOMS = [
  { id: 1, name: 'Education Room', floor: 'Lantai 2', capacity: 'Kapasitas 50/60 orang' },
  { id: 2, name: 'Learning Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang' },
  { id: 3, name: 'Knowledge Room', floor: 'Lantai 1', capacity: 'Kapasitas 30/40 orang' },
  { id: 4, name: 'Development Room', floor: 'Lantai 1', capacity: 'Kapasitas 20/25 orang' },
  { id: 5, name: 'Podcast', floor: 'Lantai 2', capacity: 'Kapasitas 6/10 orang' }
];

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

function saveLocalData(data: any) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Gagal simpan database.json lokal:", err);
  }
}

// Cek apakah Supabase benar-benar diisi dengan kredensial asli (bukan placeholder / dummy)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    url && 
    key && 
    !url.includes('dummy') && 
    !url.includes('ganti-dengan') && 
    !key.includes('dummy') && 
    !key.includes('ganti-dengan') &&
    url.startsWith('https://')
  ) {
    try {
      return createClient(url, key);
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: dbRooms, error: roomsError } = await supabase.from('rooms').select('*').order('id');
      const { data: dbBookings, error: bookingsError } = await supabase.from('bookings').select('*').order('created_at', { ascending: true });

      if (!roomsError) {
        return NextResponse.json({
          rooms: (dbRooms && dbRooms.length > 0) ? dbRooms : DEFAULT_ROOMS,
          bookings: dbBookings || []
        });
      }
    } catch (err) {
      console.warn("Supabase fetch gagal, menggunakan database lokal:", err);
    }
  }

  // Fallback lokal jika Supabase belum disetting / sedang offline
  return NextResponse.json(getLocalData());
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabaseClient();

  // 1. Simpan ke database lokal selalu sebagai backup
  const local = getLocalData();
  const newBooking = {
    id: Date.now().toString(),
    ...body,
    created_at: new Date().toISOString()
  };
  local.bookings.push(newBooking);
  saveLocalData(local);

  // 2. Jika Supabase aktif, simpan juga ke Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').insert([
        {
          room_id: body.room_id,
          diklat_acara: body.diklat_acara,
          instruktur_pic: body.instruktur_pic,
          materi: body.materi,
          start_time: body.start_time,
          end_time: body.end_time
        }
      ]).select();

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, booking: data[0] });
      }
    } catch (err) {
      console.error("Gagal simpan ke Supabase, tapi tersimpan di lokal:", err);
    }
  }

  return NextResponse.json({ success: true, booking: newBooking });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // 1. Hapus di lokal
  const local = getLocalData();
  local.bookings = local.bookings.filter((b: any) => String(b.id) !== String(id));
  saveLocalData(local);

  // 2. Hapus di Supabase jika aktif
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('bookings').delete().eq('id', id);
    } catch (err) {
      console.error("Gagal hapus di Supabase:", err);
    }
  }

  return NextResponse.json({ success: true });
}
