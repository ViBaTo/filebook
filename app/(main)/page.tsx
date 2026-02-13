'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const easeOut: [number, number, number, number] = [0, 0, 0.2, 1]

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: easeOut },
  viewport: { once: true, margin: '-100px' }
}

const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.12 } }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: easeOut }
}

export default function Home() {
  return (
    <div className='min-h-screen bg-[#FAFAF9]'>
      {/* Hero */}
      <main className='max-w-[1200px] mx-auto px-6'>
        <section className='pt-24 md:pt-40 pb-24 md:pb-40 text-center'>
          <motion.div {...fadeUp}>
            <div className='inline-flex items-center gap-2 px-4 py-2 bg-[#f0fdf4] rounded-full text-sm text-[#166534] mb-8 border border-[#dcfce7]'>
              <span className='w-2 h-2 bg-[#16a34a] rounded-full animate-pulse'></span>
              Gratis hasta 50MB, sin registro
            </div>
          </motion.div>

          <motion.h1
            className='serif text-5xl md:text-7xl text-stone-900 mb-6 leading-tight'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.1 }}
          >
            Tus documentos, convertidos
            <br />
            en <span className='italic text-[#166534]'>experiencias</span>
          </motion.h1>

          <motion.p
            className='text-lg md:text-xl text-stone-500 max-w-2xl mx-auto mb-12'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.2 }}
          >
            Da vida a tus catálogos, portfolios y revistas con flipbooks interactivos
            que tus clientes recordarán. Sube un PDF y comparte con un link.
          </motion.p>

          <motion.div
            className='flex flex-col sm:flex-row items-center justify-center gap-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.3 }}
          >
            <Link
              href='/create'
              className='px-8 py-4 bg-[#166534] text-white rounded-full hover:bg-[#14532d] transition-all hover:-translate-y-[1px] hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] font-medium text-lg'
            >
              Prueba gratis
            </Link>
            <Link
              href='#how-it-works'
              className='px-8 py-4 text-[#166534] rounded-full hover:bg-[#f0fdf4] transition-colors font-medium'
            >
              Ver cómo funciona
            </Link>
          </motion.div>
        </section>

        {/* Demo Preview */}
        <motion.section
          className='pb-24 md:pb-40'
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: easeOut }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <div className='relative mx-auto max-w-3xl'>
            <div className='relative bg-white rounded-[16px] border border-stone-200 p-8 shadow-[0_24px_48px_-12px_rgba(28,25,23,0.10)]'>
              <div className='aspect-[16/10] bg-[#FAFAF9] rounded-[10px] flex items-center justify-center border border-stone-100'>
                <div className='text-center'>
                  <div className='w-24 h-32 mx-auto mb-4 bg-white rounded-[10px] border border-stone-200 flex items-center justify-center relative overflow-hidden shadow-[0_1px_3px_0_rgba(28,25,23,0.06)]'>
                    {/* Animated book icon */}
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-[#f0fdf4] to-transparent animate-pulse'></div>
                    <svg
                      className='w-12 h-12 text-stone-300'
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
                  <p className='text-stone-400 text-sm'>
                    Tu flipbook aparecerá aquí
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* How it works */}
        <section id='how-it-works' className='pb-24 md:pb-40'>
          <motion.h2
            className='serif text-3xl md:text-[40px] md:leading-[48px] text-stone-900 text-center mb-16'
            {...fadeUp}
          >
            Así de simple
          </motion.h2>

          <motion.div
            className='grid md:grid-cols-3 gap-10'
            variants={staggerContainer}
            initial='initial'
            whileInView='whileInView'
            viewport={{ once: true, margin: '-100px' }}
          >
            {[
              {
                step: '1',
                title: 'Sube tu PDF',
                description:
                  'Arrastra y suelta o selecciona tu archivo PDF. Compatible con catálogos, portfolios, revistas y más.'
              },
              {
                step: '2',
                title: 'Procesamos automáticamente',
                description:
                  'Convertimos cada página en un flipbook interactivo con efecto de pasar páginas en alta calidad.'
              },
              {
                step: '3',
                title: 'Comparte con un link',
                description:
                  'Obtén un enlace compartible o código embed para añadir el flipbook a tu web.'
              }
            ].map((item) => (
              <motion.div key={item.step} className='text-center' variants={staggerItem}>
                <div className='w-14 h-14 mx-auto mb-5 rounded-full bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center'>
                  <span className='text-xl font-bold text-[#166534]'>
                    {item.step}
                  </span>
                </div>
                <h3 className='text-xl font-medium text-stone-900 mb-3'>
                  {item.title}
                </h3>
                <p className='text-stone-500 leading-relaxed'>{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className='pb-24 md:pb-40'>
          <motion.h2
            className='serif text-3xl md:text-[40px] md:leading-[48px] text-stone-900 text-center mb-16'
            {...fadeUp}
          >
            Pensado para creativos
          </motion.h2>

          <motion.div
            className='grid md:grid-cols-2 gap-6'
            variants={staggerContainer}
            initial='initial'
            whileInView='whileInView'
            viewport={{ once: true, margin: '-100px' }}
          >
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
                title: 'Links compartibles',
                description:
                  'Cada flipbook tiene una URL única. Comparte por email, redes sociales o mensajería.'
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
                title: 'Embed en tu web',
                description:
                  'Copia el código embed y añade el flipbook directamente a tu sitio web o blog.'
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
                title: 'Optimizado para móvil',
                description:
                  'Funciona perfectamente en todos los dispositivos con soporte táctil para pasar páginas.'
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
                title: 'Analytics de visualización',
                description:
                  'Mide cuántas personas ven tu flipbook y qué páginas consultan.'
              }
            ].map((feature) => (
              <motion.div
                key={feature.title}
                className='bg-white border border-stone-200 rounded-[10px] p-8 hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] hover:border-stone-300 hover:-translate-y-[2px] transition-all duration-250'
                variants={staggerItem}
              >
                <div className='w-12 h-12 mb-5 rounded-[10px] bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center text-[#166534]'>
                  {feature.icon}
                </div>
                <h3 className='text-lg font-medium text-stone-900 mb-2'>
                  {feature.title}
                </h3>
                <p className='text-stone-500 leading-relaxed'>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA */}
        <section className='pb-24 md:pb-40 text-center'>
          <motion.div
            className='bg-[#f0fdf4] border border-[#dcfce7] rounded-[16px] py-20 px-12'
            {...fadeUp}
          >
            <h2 className='serif text-3xl md:text-[40px] md:leading-[48px] text-stone-900 mb-4'>
              Tus diseños merecen ser vistos
            </h2>
            <p className='text-stone-500 mb-10 max-w-xl mx-auto text-lg'>
              Sin registro necesario. Sube tu PDF y obtén un flipbook compartible
              en menos de un minuto.
            </p>
            <Link
              href='/create'
              className='inline-flex items-center gap-2 px-8 py-4 bg-[#166534] text-white rounded-full hover:bg-[#14532d] transition-all hover:-translate-y-[1px] hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] font-medium text-lg'
            >
              Empieza gratis
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
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className='border-t border-stone-200 py-10'>
        <div className='max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-2 text-stone-500'>
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
              <path
                d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                stroke='currentColor'
                strokeWidth='2'
                fill='none'
              />
            </svg>
            <span className='serif'>FlipBook</span>
            <span className='text-stone-400 text-sm'>by VIBATO</span>
          </div>
          <p className='text-stone-400 text-sm'>
            &copy; {new Date().getFullYear()} Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
