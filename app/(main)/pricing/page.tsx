'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useSearchParams } from 'next/navigation'

const singlePurchase = {
  id: 'single',
  name: 'Pago único',
  description: 'Para archivos de más de 50MB sin suscripción',
  price: 9.99,
  period: '',
  lookupKey: 'flipbook_single_purchase',
  features: [
    'Hasta 200MB por PDF',
    '200 páginas',
    'Analytics completos',
    'Protección con contraseña',
    'Sin expiración'
  ],
  cta: 'Comprar por 9,99€'
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para empezar con FlipBook',
    price: 0,
    period: '',
    lookupKey: null,
    features: [
      'Hasta 50MB por PDF',
      '3 flipbooks',
      '50 páginas por flipbook',
      'Analytics básicos'
    ],
    limitations: ['Sin protección con contraseña'],
    cta: 'Empezar gratis',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para creadores y pequeños negocios',
    price: 7.99,
    period: '/mes',
    lookupKey: 'flipbook_pro_monthly',
    features: [
      'Hasta 200MB por PDF',
      'Flipbooks ilimitados',
      '200 páginas por flipbook',
      'Analytics avanzados',
      'Protección con contraseña',
      'Sin expiración',
      'Soporte prioritario'
    ],
    limitations: [],
    cta: 'Empezar con Pro',
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Para equipos y empresas',
    price: 19.99,
    period: '/mes',
    lookupKey: 'flipbook_business_monthly',
    features: [
      'Hasta 500MB por PDF',
      'Flipbooks ilimitados',
      '500 páginas por flipbook',
      'Analytics avanzados',
      'Protección con contraseña',
      'Dominio personalizado',
      'API access',
      'Soporte 24/7'
    ],
    limitations: [],
    cta: 'Empezar con Business',
    popular: false
  }
]

function PricingContent() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for success or canceled from Stripe redirect
    if (searchParams.get('success')) {
      setMessage({
        type: 'success',
        text: '¡Suscripción exitosa! Tu plan ha sido actualizado.'
      })
    }
    if (searchParams.get('canceled')) {
      setMessage({
        type: 'info',
        text: 'Pago cancelado. Puedes intentarlo de nuevo cuando quieras.'
      })
    }
  }, [searchParams])

  const handleSubscribe = async (lookupKey: string | null, planId: string) => {
    if (!lookupKey) {
      // Free plan - redirect to create
      window.location.href = '/create'
      return
    }

    setIsLoading(planId)
    setMessage(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup_key: lookupKey })
      })

      const data = await response.json()

      if (response.status === 401) {
        // User not logged in - redirect to login
        window.location.href = `/auth/login?redirect=/pricing&plan=${planId}`
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: 'Error al procesar el pago. Por favor intenta de nuevo.'
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setIsLoading('manage')
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: 'Error al acceder al portal de facturación.'
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className='min-h-screen bg-[#FAFAF9]'>
      {/* Main */}
      <main className='max-w-[1200px] mx-auto px-6 py-16 md:py-24'>
        {/* Messages */}
        {message && (
          <div
            className={`mb-8 p-4 rounded-[10px] text-center ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : message.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            <p>{message.text}</p>
            {message.type === 'success' && (
              <button
                onClick={handleManageBilling}
                className='mt-2 text-sm underline hover:no-underline'
              >
                Gestionar mi suscripción
              </button>
            )}
          </div>
        )}

        <div className='text-center mb-16'>
          <h1 className='serif text-4xl md:text-[56px] md:leading-[64px] text-stone-900 mb-4'>
            Planes simples y transparentes
          </h1>
          <p className='text-lg text-stone-500 max-w-2xl mx-auto'>
            Empieza gratis y actualiza cuando necesites más capacidad.
          </p>
        </div>

        {/* Single Purchase Banner */}
        <div className='mb-12 p-6 md:p-8 rounded-[16px] bg-amber-50 border border-amber-200'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex-1 text-center md:text-left'>
              <div className='flex items-center justify-center md:justify-start gap-2 mb-2'>
                <span className='px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full'>
                  PAGO ÚNICO
                </span>
              </div>
              <h2 className='serif text-2xl text-stone-900 mb-2'>
                ¿Tu PDF pesa más de 50MB?
              </h2>
              <p className='text-stone-500'>
                Compra un crédito premium y crea un flipbook con hasta 200MB y
                200 páginas. Sin suscripción.
              </p>
              <ul className='flex flex-wrap gap-3 mt-4 justify-center md:justify-start'>
                {singlePurchase.features.slice(0, 4).map((feature, i) => (
                  <li
                    key={i}
                    className='flex items-center gap-1 text-sm text-stone-600'
                  >
                    <svg
                      className='w-4 h-4 text-amber-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-stone-900 mb-3'>9,99€</div>
              <Button
                onClick={() =>
                  handleSubscribe(singlePurchase.lookupKey, singlePurchase.id)
                }
                isLoading={isLoading === singlePurchase.id}
                variant='primary'
                size='lg'
                className='bg-amber-600 hover:bg-amber-700'
              >
                Comprar ahora
              </Button>
            </div>
          </div>
        </div>

        <div className='text-center mb-10'>
          <p className='text-stone-400 text-sm'>
            O elige un plan de suscripción
          </p>
        </div>

        {/* Pricing cards */}
        <div className='grid md:grid-cols-3 gap-8'>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-[16px] p-8 bg-white transition-all duration-250 ${
                plan.popular
                  ? 'border-2 border-[#166534] shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)]'
                  : 'border border-stone-200 hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] hover:border-stone-300'
              }`}
            >
              {plan.popular && (
                <div className='absolute -top-4 left-1/2 -translate-x-1/2'>
                  <span className='px-4 py-1 bg-[#166534] text-white text-sm font-medium rounded-full'>
                    Más popular
                  </span>
                </div>
              )}

              <div className='text-center mb-8'>
                <h2 className='serif text-2xl text-stone-900 mb-2'>
                  {plan.name}
                </h2>
                <p className='text-stone-500 text-sm mb-4'>{plan.description}</p>
                <div className='flex items-baseline justify-center gap-1'>
                  {plan.price === 0 ? (
                    <span className='text-4xl font-bold text-stone-900'>
                      Gratis
                    </span>
                  ) : (
                    <>
                      <span className='text-4xl font-bold text-stone-900'>
                        {plan.price.toFixed(2).replace('.', ',')}€
                      </span>
                      <span className='text-stone-400'>{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              <ul className='space-y-3 mb-8'>
                {plan.features.map((feature, index) => (
                  <li key={index} className='flex items-start gap-3'>
                    <svg
                      className='w-5 h-5 text-[#16a34a] flex-shrink-0 mt-0.5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                    <span className='text-stone-600'>{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <li key={`lim-${index}`} className='flex items-start gap-3'>
                    <svg
                      className='w-5 h-5 text-stone-300 flex-shrink-0 mt-0.5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                    <span className='text-stone-400'>{limitation}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.lookupKey, plan.id)}
                isLoading={isLoading === plan.id}
                variant={plan.popular ? 'primary' : 'secondary'}
                className='w-full'
                size='lg'
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className='mt-24 md:mt-40'>
          <h2 className='serif text-3xl md:text-[40px] md:leading-[48px] text-stone-900 text-center mb-12'>
            Preguntas frecuentes
          </h2>

          <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
            {[
              {
                q: '¿Qué incluye el pago único de 9,99€?',
                a: 'El pago único te da un crédito premium para crear un flipbook con archivos de hasta 200MB, 200 páginas, analytics completos y protección con contraseña. El flipbook nunca expira.'
              },
              {
                q: '¿Puedo cancelar mi suscripción en cualquier momento?',
                a: 'Sí, puedes cancelar tu suscripción cuando quieras desde el portal de facturación. Seguirás teniendo acceso hasta el final del período de facturación.'
              },
              {
                q: '¿Qué pasa con mis flipbooks si cancelo?',
                a: 'Tus flipbooks existentes seguirán funcionando, pero se aplicarán los límites del plan gratuito. Los flipbooks que excedan los límites quedarán en modo solo lectura.'
              },
              {
                q: '¿Qué métodos de pago aceptan?',
                a: 'Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) a través de Stripe.'
              }
            ].map((faq, index) => (
              <div
                key={index}
                className='bg-white border border-stone-200 rounded-[10px] p-6 hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] hover:border-stone-300 transition-all duration-250'
              >
                <h3 className='text-lg font-medium text-stone-900 mb-2'>
                  {faq.q}
                </h3>
                <p className='text-stone-500 leading-relaxed'>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t border-stone-200 py-10 mt-24'>
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

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-[#FAFAF9] flex items-center justify-center'>
          <div className='w-8 h-8 border-2 border-stone-200 border-t-[#166534] rounded-full animate-spin' />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
