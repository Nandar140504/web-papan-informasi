import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  // Supabase fetch
  const { data: rooms } = await supabase.from('rooms').select('*').order('id');
  const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: true });
  
  return NextResponse.json({ 
    rooms: rooms || [], 
    bookings: bookings || [] 
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
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
    console.error("Supabase Insert Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, booking: data[0] });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
