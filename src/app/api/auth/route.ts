import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const DEFAULT_SUPABASE_URL = 'https://dqsrylfuomfoydknewfu.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_BZgO0F2JC87sjpokpL9E9A_doqvtTfh';

const dataFilePath = path.join(process.cwd(), 'database.json');

const DEFAULT_ADMIN = {
  id: 'admin-1',
  name: 'Admin Diklat Tonasa',
  email: 'admin@sementonasa.co.id',
  password: 'tonasa123',
  role: 'Admin Utama',
  created_at: new Date().toISOString()
};

const VALID_PINS = ['TONASA2026', 'TONASA', 'DIKLAT', 'SEMENTONASA', '140504'];

function getDatabase() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const parsed = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      if (!parsed.admins || !Array.isArray(parsed.admins) || parsed.admins.length === 0) {
        parsed.admins = [DEFAULT_ADMIN];
        try { fs.writeFileSync(dataFilePath, JSON.stringify(parsed, null, 2)); } catch {}
      }
      return parsed;
    }
  } catch (err) {
    console.error("Gagal baca database.json di auth:", err);
  }
  return { admins: [DEFAULT_ADMIN] };
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Gagal simpan database.json di auth:", err);
    return false;
  }
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name, pin } = body;
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. ACTION: LOGIN (MASUK)
    if (action === 'login') {
      if (!cleanEmail || !password) {
        return NextResponse.json({ success: false, error: 'Email dan kata sandi wajib diisi.' }, { status: 400 });
      }

      // Coba autentikasi via Supabase Auth jika ada
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });
          if (!authErr && authData?.user) {
            return NextResponse.json({
              success: true,
              user: {
                id: authData.user.id,
                email: authData.user.email,
                name: authData.user.user_metadata?.name || 'Admin Staf Diklat',
                role: 'Admin Diklat'
              }
            });
          }
        } catch {}
      }

      // Verifikasi via database lokal / stored admins
      const db = getDatabase();
      const adminUser = (db.admins || []).find((a: any) => 
        (a.email || '').toLowerCase() === cleanEmail && a.password === password
      );

      if (adminUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: adminUser.id || 'admin-local',
            email: adminUser.email,
            name: adminUser.name || 'Admin Diklat Tonasa',
            role: adminUser.role || 'Admin Diklat'
          }
        });
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Email atau kata sandi salah. Silakan periksa kembali atau daftar jika belum memiliki akun.' 
      }, { status: 401 });
    }

    // 2. ACTION: REGISTER (DAFTAR AKUN ADMIN)
    if (action === 'register') {
      if (!name || !cleanEmail || !password) {
        return NextResponse.json({ success: false, error: 'Semua kolom nama, email, dan kata sandi wajib diisi.' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Kata sandi minimal 6 karakter demi keamanan.' }, { status: 400 });
      }

      // Validasi PIN verifikasi admin khusus Unit Diklat
      const cleanPin = (pin || '').trim().toUpperCase();
      if (!VALID_PINS.includes(cleanPin)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Kode Verifikasi Unit Diklat tidak valid. Pendaftaran khusus untuk staf berwenang PT Semen Tonasa (Gunakan kode: TONASA2026).' 
        }, { status: 403 });
      }

      const db = getDatabase();
      const existing = (db.admins || []).find((a: any) => (a.email || '').toLowerCase() === cleanEmail);
      if (existing) {
        return NextResponse.json({ 
          success: false, 
          error: 'Email tersebut sudah terdaftar sebagai admin. Silakan langsung masuk (Login).' 
        }, { status: 400 });
      }

      const newAdmin = {
        id: 'admin-' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: password,
        role: 'Staf Diklat Tonasa',
        created_at: new Date().toISOString()
      };

      db.admins = [...(db.admins || []), newAdmin];
      saveDatabase(db);

      // Coba daftarkan juga ke Supabase Auth jika tersedia
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: { name: name.trim(), role: 'Staf Diklat' }
            }
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'Akun admin berhasil didaftarkan!',
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan sistem: ' + err.message }, { status: 500 });
  }
}
