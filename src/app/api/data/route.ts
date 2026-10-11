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
    return true;
  } catch (err) {
    console.error("Gagal simpan database.json lokal:", err);
    return false;
  }
}

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

      if (!roomsError && !bookingsError) {
        return NextResponse.json({
          rooms: (dbRooms && dbRooms.length > 0) ? dbRooms : DEFAULT_ROOMS,
          bookings: dbBookings || [],
          supabaseConnected: true
        });
      } else {
        console.warn("Supabase fetch returned error:", roomsError || bookingsError);
      }
    } catch (err) {
      console.warn("Supabase fetch gagal, menggunakan database lokal:", err);
    }
  }

  const local = getLocalData();
  return NextResponse.json({
    rooms: local.rooms,
    bookings: local.bookings,
    supabaseConnected: false
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabaseClient();

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

      if (error) {
        console.error("Supabase insert error:", error);
        let errorMsg = error.message;
        if (errorMsg.includes("does not exist")) {
          errorMsg = 'Tabel "bookings" belum dibuat di Supabase SQL Editor. Silakan jalankan script SQL di Supabase.';
        } else if (errorMsg.includes("violates row-level security policy")) {
          errorMsg = 'Row Level Security (RLS) di Supabase masih aktif. Silakan jalankan script SQL untuk mematikan RLS.';
        }
        return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
      }

      if (data && data.length > 0) {
        return NextResponse.json({ success: true, booking: data[0] });
      }
    } catch (err: any) {
      console.error("Gagal simpan ke Supabase:", err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Jika Supabase tidak aktif di Vercel:
  if (process.env.VERCEL) {
    return NextResponse.json({ 
      success: false, 
      error: "Supabase belum terhubung di Vercel! Mohon masukkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di menu Settings > Environment Variables Vercel Anda, lalu Redeploy." 
    }, { status: 400 });
  }

  // Jika di localhost, simpan ke database.json
  const local = getLocalData();
  const newBooking = {
    id: Date.now().toString(),
    ...body,
    created_at: new Date().toISOString()
  };
  local.bookings.push(newBooking);
  const saved = saveLocalData(local);

  if (!saved) {
    return NextResponse.json({ success: false, error: "Gagal menyimpan ke database lokal." }, { status: 500 });
  }

  return NextResponse.json({ success: true, booking: newBooking });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Fallback lokal
  const local = getLocalData();
  local.bookings = local.bookings.filter((b: any) => String(b.id) !== String(id));
  saveLocalData(local);

  return NextResponse.json({ success: true });
}
