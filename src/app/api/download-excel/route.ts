import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Menggunakan fallback string (dummy) agar Vercel tidak error saat proses build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url-agar-vercel-tidak-error.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data: rooms } = await supabase.from('rooms').select('*');
  const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });

  if (!bookings || !rooms) {
    return NextResponse.json({ error: 'Gagal mengambil data dari database' }, { status: 500 });
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

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
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
