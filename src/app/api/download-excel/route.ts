import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  // 1. Ambil data asli dari Supabase
  const { data: rooms } = await supabase.from('rooms').select('*');
  const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });

  if (!bookings || !rooms) {
    return NextResponse.json({ error: 'Gagal mengambil data dari database' }, { status: 500 });
  }

  // 2. Ubah datanya agar siap masuk Excel
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

  // 3. Generate file Excel di udara (Memory) tanpa menyimpan ke Harddisk (Wajib untuk Vercel)
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Peminjaman");
  
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // 4. Jadikan file download untuk browser
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="Riwayat_Peminjaman.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  });
}
