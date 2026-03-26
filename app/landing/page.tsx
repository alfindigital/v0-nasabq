import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NasabQ - Kenali Akar Keluargamu',
  description: 'Aplikasi silsilah keluarga gratis untuk mengenal, menyimpan, dan berbagi sejarah keluargamu. Buat pohon keluarga digital dengan mudah.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg 
              viewBox="0 0 24 24" 
              className="text-primary w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="6" x2="12" y2="18" />
              <line x1="12" y1="6" x2="6" y2="3" />
              <line x1="12" y1="6" x2="18" y2="3" />
              <line x1="12" y1="18" x2="7" y2="21" />
              <line x1="12" y1="18" x2="17" y2="21" />
            </svg>
            <span className="font-display font-extrabold tracking-[2px] text-primary text-lg">NASABQ</span>
          </div>
          <Link
            href="https://v0-nasabq.vercel.app"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Buka Aplikasi
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-medium text-primary">Gratis Selamanya</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
            Kenali <span className="text-primary">Akar</span> Keluargamu
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Buat dan simpan silsilah keluarga digital dengan mudah. Ketahui hubungan kekerabatan, status mahram, dan bagikan kepada keluarga.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://v0-nasabq.vercel.app"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary-hover transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2"
            >
              Mulai Sekarang
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#fitur"
              className="w-full sm:w-auto px-8 py-4 bg-muted text-foreground rounded-xl text-base font-semibold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              Pelajari Fitur
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Semua yang kamu butuhkan untuk mengelola silsilah keluarga dalam satu aplikasi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Pohon Keluarga Visual</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tampilan pohon keluarga interaktif yang mudah dinavigasi dengan zoom dan pan
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Cek Hubungan Keluarga</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ketahui hubungan antara dua anggota keluarga secara otomatis
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Status Mahram</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Indikator mahram otomatis berdasarkan hubungan kekerabatan dalam Islam
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Export & Bagikan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simpan sebagai gambar atau bagikan teks silsilah ke keluarga
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Privasi Terjaga</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Data tersimpan lokal di perangkatmu, tidak dikirim ke server manapun
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Mobile Friendly</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dioptimalkan untuk penggunaan di smartphone, bisa diakses kapan saja
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
              Cara Menggunakan
            </h2>
            <p className="text-muted-foreground">
              Hanya 3 langkah mudah untuk memulai
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-display font-bold text-xl">
                1
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Daftarkan Dirimu</h3>
              <p className="text-sm text-muted-foreground">
                Mulai dengan memasukkan data dirimu sebagai titik awal pohon keluarga
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-display font-bold text-xl">
                2
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Tambah Anggota</h3>
              <p className="text-sm text-muted-foreground">
                Tambahkan orang tua, pasangan, anak, dan anggota keluarga lainnya
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-display font-bold text-xl">
                3
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Jelajahi & Bagikan</h3>
              <p className="text-sm text-muted-foreground">
                Lihat pohon keluargamu dan bagikan kepada saudara lainnya
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-primary-foreground mb-4">
            Mulai Bangun Silsilah Keluargamu
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Gratis selamanya. Tanpa iklan. Tanpa registrasi. Langsung pakai.
          </p>
          <Link
            href="https://v0-nasabq.vercel.app"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl text-base font-semibold hover:bg-white/90 transition-colors"
          >
            Buka Aplikasi NasabQ
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg 
              viewBox="0 0 24 24" 
              className="text-primary w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="6" x2="12" y2="18" />
              <line x1="12" y1="6" x2="6" y2="3" />
              <line x1="12" y1="6" x2="18" y2="3" />
              <line x1="12" y1="18" x2="7" y2="21" />
              <line x1="12" y1="18" x2="17" y2="21" />
            </svg>
            <span className="font-display font-bold tracking-[1px] text-primary text-sm">NASABQ</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Kenali Akar Keluargamu
          </p>
        </div>
      </footer>
    </div>
  )
}
