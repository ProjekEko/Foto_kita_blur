import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFF8F5] text-zinc-800">
      <section className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <div className="max-w-3xl">
          <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-medium text-rose-600">
            Project Fomo Ajee
          </span>

          <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-7xl">
            Foto Kita Blur✌🏻
          </h1>

          <p className="mt-3 text-zinc-500">
            by <span className="font-medium text-zinc-700">Eko Haryadi</span>
          </p>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-600">
            Web iseng buat ikutan tren aja guyss...
            <br /> Pencet mulai, ikutin lagunya, terus nikmatin hasilnya.
            <br />
            Udah gitu doang wkwkwk.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/mulai"
              className="rounded-xl bg-rose-500 px-8 py-3 font-medium text-white transition hover:bg-rose-600"
            >
              Mulai
            </Link>
          </div>
        </div>

        {/* Divider */}

        <div className="my-24 h-px bg-zinc-200" />

        {/* Cara Menggunakan */}

        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Cara Menggunakan</h2>

            <p className="mt-5 leading-8 text-zinc-600">
              Tidak perlu melakukan pengaturan yang rumit. Cukup izinkan akses
              kamera, tekan mulai, lalu ikuti alur lagu hingga proses selesai.
            </p>
          </div>

          <div className="space-y-10">
            <div className="flex gap-5">
              <span className="text-2xl font-bold text-rose-500">01</span>

              <div>
                <h3 className="font-semibold">Izinkan Kamera</h3>

                <p className="mt-2 leading-7 text-zinc-500">
                  Kamera hanya digunakan selama proses perekaman berlangsung.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <span className="text-2xl font-bold text-rose-500">02</span>

              <div>
                <h3 className="font-semibold">Mulai Rekam</h3>

                <p className="mt-2 leading-7 text-zinc-500">
                  Lagu akan diputar dan sistem mengambil foto secara otomatis
                  sesuai momen yang telah diatur.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <span className="text-2xl font-bold text-rose-500">03</span>

              <div>
                <h3 className="font-semibold">Simpan Hasil</h3>

                <p className="mt-2 leading-7 text-zinc-500">
                  Setelah selesai, video dan foto dapat langsung diunduh ke
                  perangkatmu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}

        <footer className="mt-24 border-t border-zinc-200 pt-8">
          <div className="flex flex-col gap-2 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
            <div>
              <p>Dibuat oleh Eko Haryadi.</p>
            </div>

            <p>© 2026</p>
          </div>
        </footer>
      </section>
    </main>
  );
}
