-- ====================================================================
-- SOLUSI RESMI ATURAN SUPABASE DATA API (BERLAKU 30 OKTOBER)
-- Proyek Supabase: papan-informasi (dqsrylfuomfoydknewfu)
-- Unit Learning & Development • PT Semen Tonasa
-- ====================================================================

-- 1. Berikan hak akses eksplisit ke schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Berikan hak akses eksplisit untuk semua tabel yang ada saat ini
-- Tabel 'rooms' (Ruangan Diklat)
GRANT SELECT ON public.rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated, service_role;

-- Tabel 'bookings' (Jadwal Kegiatan Diklat)
GRANT SELECT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated, service_role;

-- Tabel 'admins' (Akun Staf Admin Diklat)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO anon, authenticated, service_role;

-- 3. JAMINAN MASA DEPAN (DEFAULT PRIVILEGES):
-- Aturan otomatis agar setiap tabel baru yang dibuat di masa depan
-- langsung memiliki izin API tanpa perlu menjalankan GRANT manual lagi!
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Selesai! Semua tabel aman 100% dari perubahan kebijakan 30 Oktober.
