import Link from 'next/link'

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'>
      {/* Hero */}
      <main className='max-w-5xl mx-auto px-6 pt-20 pb-32'>
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm text-gray-300 mb-6'>
            <span className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></span>
            Gratis hasta 30MB, sin registro
          </div>

          <h1 className='text-5xl md:text-6xl font-bold text-white mb-6 leading-tight'>
            Convierte tu PDF en un
            <span className='text-[#e94560]'> flipbook interactivo</span>
          </h1>

          <p className='text-xl text-gray-400 max-w-2xl mx-auto mb-10'>
            Sube un PDF y obtén un link compartible a un flipbook interactivo
            3D. Perfecto para catálogos, presentaciones, revistas y más.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
            <Link
              href='/create'
              className='px-8 py-4 bg-[#e94560] text-white rounded-xl hover:bg-[#d63d56] transition-all hover:scale-105 font-semibold text-lg shadow-lg shadow-[#e94560]/25'
            >
              Crear tu FlipBook
            </Link>
            <Link
              href='/pricing'
              className='px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium'
            >
              Ver precios
            </Link>
          </div>
        </div>

        {/* Demo Preview */}
        <div className='relative mx-auto max-w-3xl'>
          <div className='absolute inset-0 bg-[#e94560]/20 blur-3xl rounded-full'></div>
          <div className='relative bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-2xl border border-white/10 p-8 shadow-2xl'>
            <div className='aspect-[16/10] bg-white/5 rounded-lg flex items-center justify-center'>
              <div className='text-center'>
                <div className='w-24 h-32 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center relative overflow-hidden'>
                  {/* Animated book icon */}
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse'></div>
                  <svg
                    className='w-12 h-12 text-white/50'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <p className='text-gray-500 text-sm'>
                  Your flipbook preview will appear here
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section id='how-it-works' className='mt-32'>
          <h2 className='text-3xl font-bold text-white text-center mb-12'>
            How it works
          </h2>

          <div className='grid md:grid-cols-3 gap-8'>
            {[
              {
                step: '1',
                title: 'Upload your PDF',
                description:
                  'Drag and drop or browse to upload your PDF file. Supports up to 10MB.'
              },
              {
                step: '2',
                title: 'Auto-processing',
                description:
                  'We automatically convert each page into a high-quality interactive flipbook.'
              },
              {
                step: '3',
                title: 'Share anywhere',
                description:
                  'Get a shareable link or embed code to add the flipbook to your website.'
              }
            ].map((item) => (
              <div key={item.step} className='text-center'>
                <div className='w-14 h-14 mx-auto mb-4 rounded-full bg-[#e94560]/20 flex items-center justify-center'>
                  <span className='text-2xl font-bold text-[#e94560]'>
                    {item.step}
                  </span>
                </div>
                <h3 className='text-xl font-semibold text-white mb-2'>
                  {item.title}
                </h3>
                <p className='text-gray-400'>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className='mt-32'>
          <h2 className='text-3xl font-bold text-white text-center mb-12'>
            Features
          </h2>

          <div className='grid md:grid-cols-2 gap-6'>
            {[
              {
                icon: (
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                    />
                  </svg>
                ),
                title: 'Shareable links',
                description:
                  'Each flipbook gets a unique URL you can share via email, social media, or messaging.'
              },
              {
                icon: (
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                    />
                  </svg>
                ),
                title: 'Embed anywhere',
                description:
                  'Copy the embed code and add the flipbook directly to your website or blog.'
              },
              {
                icon: (
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
                    />
                  </svg>
                ),
                title: 'Mobile friendly',
                description:
                  'Works beautifully on all devices with touch support for swiping between pages.'
              },
              {
                icon: (
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                  </svg>
                ),
                title: 'View analytics',
                description:
                  'Track how many people view your flipbook and which pages they read.'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className='bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors'
              >
                <div className='w-12 h-12 mb-4 rounded-lg bg-[#e94560]/20 flex items-center justify-center text-[#e94560]'>
                  {feature.icon}
                </div>
                <h3 className='text-lg font-semibold text-white mb-2'>
                  {feature.title}
                </h3>
                <p className='text-gray-400'>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className='mt-32 text-center'>
          <div className='bg-gradient-to-r from-[#e94560]/20 to-[#e94560]/10 rounded-2xl p-12 border border-[#e94560]/20'>
            <h2 className='text-3xl font-bold text-white mb-4'>
              Ready to create your flipbook?
            </h2>
            <p className='text-gray-400 mb-8 max-w-xl mx-auto'>
              No registration needed. Upload your PDF and get a shareable
              flipbook in under a minute.
            </p>
            <Link
              href='/create'
              className='inline-flex items-center gap-2 px-8 py-4 bg-[#e94560] text-white rounded-xl hover:bg-[#d63d56] transition-all hover:scale-105 font-semibold text-lg'
            >
              Get started for free
              <svg
                className='w-5 h-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 8l4 4m0 0l-4 4m4-4H3'
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='border-t border-white/10 py-8'>
        <div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-2 text-gray-400'>
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
              <path
                d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                stroke='currentColor'
                strokeWidth='2'
                fill='none'
              />
            </svg>
            <span>FlipBook by VIBATO AI</span>
          </div>
          <p className='text-gray-500 text-sm'>
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
