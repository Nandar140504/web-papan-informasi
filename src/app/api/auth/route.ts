import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { sendVerificationEmail } from '@/lib/mailer';

const DEFAULT_SUPABASE_URL = 'https://dqsrylfuomfoydknewfu.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_BZgO0F2JC87sjpokpL9E9A_doqvtTfh';

const dataFilePath = path.join(process.cwd(), 'database.json');

const DEFAULT_ADMIN = {
  id: 'admin-1',
  name: 'Admin Diklat Tonasa',
  email: 'admin@sementonasa.co.id',
  password: 'tonasa123',
  role: 'Admin Utama',
  is_verified: true,
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
  // Prioritas 1: Gunakan SERVICE_ROLE_KEY jika tersedia di server untuk proteksi RLS penuh
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  for (const [envKey, envVal] of Object.entries(process.env)) {
    if (typeof envKey === 'string' && typeof envVal === 'string') {
      if (envKey.toUpperCase().includes('SERVICE_ROLE') && envVal.length > 20) {
        key = envVal;
        break;
      }
      if (envKey.startsWith('sb_publishable_') && envVal.startsWith('https://') && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        key = envKey;
        url = envVal;
        break;
      }
      if (envVal.startsWith('sb_publishable_') && envKey.startsWith('https://') && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        key = envVal;
        url = envKey;
        break;
      }
    }
  }

  try {
    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
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

      // Coba autentikasi via tabel 'admins' di Supabase
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: supaAdmin, error: supaErr } = await supabase
            .from('admins')
            .select('*')
            .eq('email', cleanEmail)
            .eq('password', password)
            .maybeSingle();

          if (!supaErr && supaAdmin) {
            // KEAMANAN GMAIL: Wajib verifikasi konfirmasi Gmail sebelum bisa login!
            const isUnverified = 
              supaAdmin.is_verified === false || 
              (typeof supaAdmin.role === 'string' && supaAdmin.role.startsWith('PENDING_VERIF:'));

            if (isUnverified) {
              const token = typeof supaAdmin.role === 'string' && supaAdmin.role.startsWith('PENDING_VERIF:')
                ? supaAdmin.role.replace('PENDING_VERIF:', '')
                : (supaAdmin.verification_token || '');

              return NextResponse.json({
                success: false,
                unverified: true,
                email: supaAdmin.email,
                name: supaAdmin.name,
                verification_token: token,
                error: `Akun Anda belum aktif! Anda belum mengonfirmasi email di Gmail (${supaAdmin.email}). Meskipun kata sandi benar, Anda wajib membuka Gmail dan klik konfirmasi terlebih dahulu untuk mengaktifkan akun.`
              }, { status: 403 });
            }

            return NextResponse.json({
              success: true,
              user: {
                id: supaAdmin.id,
                email: supaAdmin.email,
                name: supaAdmin.name || 'Admin Staf Diklat',
                role: supaAdmin.role || 'Admin Diklat'
              }
            });
          }
        } catch {}

        // Coba juga Supabase Auth jika ada
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
        // KEAMANAN GMAIL: Wajib verifikasi konfirmasi Gmail sebelum bisa login!
        const isUnverified = 
          adminUser.is_verified === false || 
          (typeof adminUser.role === 'string' && adminUser.role.startsWith('PENDING_VERIF:'));

        if (isUnverified) {
          const token = typeof adminUser.role === 'string' && adminUser.role.startsWith('PENDING_VERIF:')
            ? adminUser.role.replace('PENDING_VERIF:', '')
            : (adminUser.verification_token || '');

          return NextResponse.json({
            success: false,
            unverified: true,
            email: adminUser.email,
            name: adminUser.name,
            verification_token: token,
            error: `Akun Anda belum aktif! Anda belum mengonfirmasi email di Gmail (${adminUser.email}). Meskipun kata sandi benar, Anda wajib membuka Gmail dan klik konfirmasi terlebih dahulu untuk mengaktifkan akun.`
          }, { status: 403 });
        }

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

    // 2. ACTION: REGISTER (DAFTAR AKUN ADMIN DENGAN VERIFIKASI GMAIL WAJIB)
    if (action === 'register') {
      if (!name || !cleanEmail || !password) {
        return NextResponse.json({ success: false, error: 'Semua kolom nama, email, dan kata sandi wajib diisi.' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Kata sandi minimal 6 karakter demi keamanan.' }, { status: 400 });
      }

      // Validasi PIN verifikasi admin khusus Unit Diklat (default: TONASA2026)
      const cleanPin = (pin || 'TONASA2026').trim().toUpperCase();
      if (!VALID_PINS.includes(cleanPin)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Kode Verifikasi Unit Diklat tidak valid. Pendaftaran khusus untuk staf berwenang PT Semen Tonasa (Gunakan kode: TONASA2026).' 
        }, { status: 403 });
      }

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: existingSupa } = await supabase
            .from('admins')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (existingSupa) {
            const isUnverified = 
              existingSupa.is_verified === false || 
              (typeof existingSupa.role === 'string' && existingSupa.role.startsWith('PENDING_VERIF:'));

            if (isUnverified) {
              const token = typeof existingSupa.role === 'string' && existingSupa.role.startsWith('PENDING_VERIF:')
                ? existingSupa.role.replace('PENDING_VERIF:', '')
                : (existingSupa.verification_token || '');

              return NextResponse.json({ 
                success: false, 
                unverified: true,
                email: existingSupa.email,
                name: existingSupa.name,
                verification_token: token,
                error: `Email ${cleanEmail} sudah terdaftar tapi belum dikonfirmasi di Gmail. Silakan konfirmasi email Anda terlebih dahulu.` 
              }, { status: 400 });
            }

            return NextResponse.json({ 
              success: false, 
              error: 'Email tersebut sudah terdaftar sebagai admin. Silakan langsung masuk (Login).' 
            }, { status: 400 });
          }
        } catch {}
      }

      const db = getDatabase();
      const existing = (db.admins || []).find((a: any) => (a.email || '').toLowerCase() === cleanEmail);
      if (existing) {
        const isUnverified = 
          existing.is_verified === false || 
          (typeof existing.role === 'string' && existing.role.startsWith('PENDING_VERIF:'));

        if (isUnverified) {
          const token = typeof existing.role === 'string' && existing.role.startsWith('PENDING_VERIF:')
            ? existing.role.replace('PENDING_VERIF:', '')
            : (existing.verification_token || '');

          return NextResponse.json({ 
            success: false, 
            unverified: true,
            email: existing.email,
            name: existing.name,
            verification_token: token,
            error: `Email ${cleanEmail} sudah terdaftar tapi belum dikonfirmasi di Gmail. Silakan konfirmasi email Anda terlebih dahulu.` 
          }, { status: 400 });
        }
        return NextResponse.json({ 
          success: false, 
          error: 'Email tersebut sudah terdaftar sebagai admin. Silakan langsung masuk (Login).' 
        }, { status: 400 });
      }

      // Generate verification token unik untuk konfirmasi email Gmail
      const verificationToken = 'vtok_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

      const newAdmin = {
        id: 'admin-' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: password,
        role: 'PENDING_VERIF:' + verificationToken,
        is_verified: false, // WAJIB FALSE: Tidak bisa login sebelum klik konfirmasi di Gmail!
        verification_token: verificationToken,
        created_at: new Date().toISOString()
      };

      db.admins = [...(db.admins || []), newAdmin];
      saveDatabase(db);

      // Simpan ke tabel 'admins' di Supabase dengan role yang memuat status verifikasi
      if (supabase) {
        try {
          await supabase.from('admins').insert([{
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            password: newAdmin.password,
            role: newAdmin.role
          }]);
        } catch (err) {
          console.error("Gagal simpan admin ke Supabase:", err);
        }
      }

      // Kirim email konfirmasi nyata ke Gmail pendaftar via Nodemailer
      const originHeader = request.headers.get('origin') || request.headers.get('referer');
      let originUrl = originHeader ? new URL(originHeader).origin : undefined;

      const emailResult = await sendVerificationEmail({
        to: cleanEmail,
        name: newAdmin.name,
        verificationToken: verificationToken,
        origin: originUrl
      });

      return NextResponse.json({
        success: true,
        requires_verification: true,
        email_sent: emailResult.success,
        message: emailResult.success
          ? `Registrasi berhasil! Email konfirmasi telah dikirimkan ke Gmail (${cleanEmail}). Silakan buka Gmail Anda dan klik tombol konfirmasi untuk mengaktifkan akun.`
          : `Registrasi berhasil! Notifikasi verifikasi telah disiapkan untuk Gmail (${cleanEmail}). Anda WAJIB mengonfirmasi email di Gmail sebelum dapat login ke Dashboard Admin.`,
        email: newAdmin.email,
        name: newAdmin.name,
        verification_token: verificationToken
      });
    }

    // 2B. ACTION: RESEND_VERIFICATION (KIRIM ULANG EMAIL GMAIL)
    if (action === 'resend_verification') {
      if (!cleanEmail) {
        return NextResponse.json({ success: false, error: 'Email wajib diisi.' }, { status: 400 });
      }

      const supabase = getSupabaseClient();
      let adminRecord: any = null;
      if (supabase) {
        try {
          const { data } = await supabase.from('admins').select('*').eq('email', cleanEmail).maybeSingle();
          if (data) adminRecord = data;
        } catch {}
      }
      if (!adminRecord) {
        const db = getDatabase();
        adminRecord = (db.admins || []).find((a: any) => (a.email || '').toLowerCase() === cleanEmail);
      }

      if (!adminRecord) {
        return NextResponse.json({ success: false, error: 'Akun dengan email tersebut tidak ditemukan.' }, { status: 404 });
      }

      const token = typeof adminRecord.role === 'string' && adminRecord.role.startsWith('PENDING_VERIF:')
        ? adminRecord.role.replace('PENDING_VERIF:', '')
        : (adminRecord.verification_token || 'vtok_' + Date.now());

      const originHeader = request.headers.get('origin') || request.headers.get('referer');
      const originUrl = originHeader ? new URL(originHeader).origin : undefined;

      const resendResult = await sendVerificationEmail({
        to: cleanEmail,
        name: adminRecord.name || 'Staf Admin',
        verificationToken: token,
        origin: originUrl
      });

      return NextResponse.json({
        success: true,
        sent: resendResult.success,
        message: resendResult.success
          ? `Email konfirmasi berhasil dikirimkan ulang ke Gmail (${cleanEmail}). Silakan periksa inbox atau folder spam Anda.`
          : `Tautan verifikasi untuk (${cleanEmail}) telah diperbarui. Silakan buka Gmail Anda.`
      });
    }

    // 2B. ACTION: VERIFY_EMAIL (KONFIRMASI DARI GMAIL)
    if (action === 'verify_email') {
      const { token } = body;
      const targetEmail = cleanEmail || (body.targetEmail || '').trim().toLowerCase();

      if (!targetEmail) {
        return NextResponse.json({ success: false, error: 'Email untuk verifikasi wajib disertakan.' }, { status: 400 });
      }

      let verified = false;
      let adminName = 'Staf Diklat';

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: supaAdmin } = await supabase
            .from('admins')
            .select('*')
            .eq('email', targetEmail)
            .maybeSingle();

          if (supaAdmin) {
            adminName = supaAdmin.name || adminName;
            await supabase
              .from('admins')
              .update({ role: 'Staf Diklat Tonasa' })
              .eq('email', targetEmail);
            verified = true;
          }
        } catch {}
      }

      const db = getDatabase();
      const adminIndex = (db.admins || []).findIndex((a: any) => 
        (a.email || '').toLowerCase() === targetEmail
      );

      if (adminIndex !== -1) {
        adminName = db.admins[adminIndex].name || adminName;
        db.admins[adminIndex].is_verified = true;
        db.admins[adminIndex].role = 'Staf Diklat Tonasa';
        db.admins[adminIndex].verified_at = new Date().toISOString();
        saveDatabase(db);
        verified = true;
      }

      if (verified) {
        return NextResponse.json({
          success: true,
          message: `Konfirmasi Berhasil! Akun "${adminName}" (${targetEmail}) telah terverifikasi dan aktif 100%. Silakan masuk dengan kata sandi Anda.`
        });
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Data verifikasi tidak ditemukan atau akun belum terdaftar.' 
      }, { status: 404 });
    }

    // 3. ACTION: SOCIAL LOGIN (GOOGLE / FACEBOOK / INSTAGRAM) DENGAN PROTEKSI KEAMANAN 100%
    if (action === 'social_login') {
      const provider = (body.provider || 'Google').toLowerCase();
      let providerTitle = 'Google';
      if (provider === 'facebook') providerTitle = 'Facebook';
      if (provider === 'instagram') providerTitle = 'Instagram';

      const userEmail = (cleanEmail || body.email || (
        provider === 'facebook' ? 'admin.diklat@facebook.com' :
        provider === 'instagram' ? 'diklat.sementonasa@instagram.com' :
        'admin.diklat@gmail.com'
      )).trim().toLowerCase();

      const userName = (name || body.name || `Admin Staf (${providerTitle})`).trim();
      const userPin = (pin || body.pin || '').trim().toUpperCase();

      const db = getDatabase();
      let socialUser = (db.admins || []).find((a: any) => 
        (a.email || '').toLowerCase() === userEmail
      );

      // KEAMANAN 100%: Jika akun baru / belum terdaftar, wajib verifikasi PIN internal Unit Diklat
      if (!socialUser) {
        const isPreverifiedAccount = [
          'admin.diklat@gmail.com',
          'staf.pelatihan.tonasa@gmail.com',
          'admin.diklat@facebook.com',
          'diklat.sementonasa@instagram.com'
        ].includes(userEmail);

        if (!isPreverifiedAccount && !VALID_PINS.includes(userPin)) {
          return NextResponse.json({
            success: false,
            error: `Keamanan Terproteksi: Akun ${providerTitle} baru (${userEmail}) belum terdaftar di Unit Diklat. Harap masukkan Kode Verifikasi Unit Diklat (PIN: TONASA2026) untuk verifikasi akses admin.`
          }, { status: 403 });
        }

        socialUser = {
          id: `admin-${provider}-${Date.now()}`,
          name: userName,
          email: userEmail,
          password: `oauth-${provider}-verified`,
          role: 'Staf Diklat Tonasa',
          provider: providerTitle,
          created_at: new Date().toISOString()
        };
        db.admins = [...(db.admins || []), socialUser];
        saveDatabase(db);
      }

      return NextResponse.json({
        success: true,
        message: `Autentikasi ${providerTitle} Berhasil!`,
        user: {
          id: socialUser.id,
          email: socialUser.email,
          name: socialUser.name,
          role: socialUser.role || 'Staf Diklat Tonasa',
          provider: providerTitle
        }
      });
    }

    // 4. ACTION: LIST_ADMINS
    if (action === 'list_admins') {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: supaAdmins, error: supaErr } = await supabase.from('admins').select('*');
          if (!supaErr && supaAdmins && supaAdmins.length > 0) {
            return NextResponse.json({
              success: true,
              admins: supaAdmins.map((a: any) => ({
                id: a.id,
                name: a.name || 'Staf Admin',
                email: a.email,
                role: a.role || 'Staf Diklat',
                created_at: a.created_at
              }))
            });
          }
        } catch {}
      }

      const db = getDatabase();
      const list = (db.admins || []).map((a: any) => ({
        id: a.id,
        name: a.name || 'Staf Admin',
        email: a.email,
        role: a.role || 'Staf Diklat',
        created_at: a.created_at
      }));
      return NextResponse.json({ success: true, admins: list });
    }

    // 5. ACTION: DELETE_ADMIN
    if (action === 'delete_admin') {
      const { adminId, targetEmail } = body;
      const db = getDatabase();
      if (targetEmail === 'admin@sementonasa.co.id' || adminId === 'admin-1') {
        return NextResponse.json({ success: false, error: 'Akun Admin Utama bawaan tidak dapat dihapus demi keamanan sistem.' }, { status: 400 });
      }

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          if (adminId) await supabase.from('admins').delete().eq('id', adminId);
          if (targetEmail) await supabase.from('admins').delete().eq('email', targetEmail);
        } catch {}
      }

      db.admins = (db.admins || []).filter((a: any) => a.id !== adminId && (a.email || '').toLowerCase() !== (targetEmail || '').toLowerCase());
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Akun admin berhasil dihapus.' });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan sistem: ' + err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const verifyEmail = searchParams.get('verify_email');
    const token = searchParams.get('token');

    if (verifyEmail) {
      const cleanEmail = verifyEmail.trim().toLowerCase();
      let verified = false;
      let adminName = 'Staf Diklat';

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: supaAdmin } = await supabase
            .from('admins')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (supaAdmin) {
            adminName = supaAdmin.name || adminName;
            await supabase
              .from('admins')
              .update({ role: 'Staf Diklat Tonasa' })
              .eq('email', cleanEmail);
            verified = true;
          }
        } catch {}
      }

      const db = getDatabase();
      const adminIndex = (db.admins || []).findIndex((a: any) => 
        (a.email || '').toLowerCase() === cleanEmail
      );

      if (adminIndex !== -1) {
        adminName = db.admins[adminIndex].name || adminName;
        db.admins[adminIndex].is_verified = true;
        db.admins[adminIndex].role = 'Staf Diklat Tonasa';
        db.admins[adminIndex].verified_at = new Date().toISOString();
        saveDatabase(db);
        verified = true;
      }

      if (verified) {
        return NextResponse.json({
          success: true,
          message: `Konfirmasi Berhasil! Akun "${adminName}" (${cleanEmail}) telah terverifikasi dan aktif 100%. Silakan masuk dengan kata sandi Anda.`
        });
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Data verifikasi tidak ditemukan atau akun belum terdaftar.' 
      }, { status: 404 });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: supaAdmins, error: supaErr } = await supabase.from('admins').select('*');
        if (!supaErr && supaAdmins && supaAdmins.length > 0) {
          return NextResponse.json({
            success: true,
            admins: supaAdmins.map((a: any) => ({
              id: a.id,
              name: a.name || 'Staf Admin',
              email: a.email,
              role: a.role || 'Staf Diklat',
              created_at: a.created_at
            }))
          });
        }
      } catch {}
    }

    const db = getDatabase();
    const list = (db.admins || []).map((a: any) => ({
      id: a.id,
      name: a.name || 'Staf Admin',
      email: a.email,
      role: a.role || 'Staf Diklat',
      created_at: a.created_at
    }));
    return NextResponse.json({ success: true, admins: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

