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
    <div className='min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'>
      {/* Main */}
      <main className='max-w-6xl mx-auto px-6 py-16'>
        {/* Messages */}
        {message && (
          <div
            className={`mb-8 p-4 rounded-lg text-center ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : message.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
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
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Planes simples y transparentes
          </h1>
          <p className='text-xl text-gray-400 max-w-2xl mx-auto'>
            Empieza gratis y actualiza cuando necesites más capacidad.
          </p>
        </div>

        {/* Single Purchase Banner */}
        <div className='mb-12 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex-1 text-center md:text-left'>
              <div className='flex items-center justify-center md:justify-start gap-2 mb-2'>
                <span className='px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded'>
                  PAGO ÚNICO
                </span>
              </div>
              <h2 className='text-2xl font-bold text-white mb-2'>
                ¿Tu PDF pesa más de 50MB?
              </h2>
              <p className='text-gray-400'>
                Compra un crédito premium y crea un flipbook con hasta 200MB y
                200 páginas. Sin suscripción.
              </p>
              <ul className='flex flex-wrap gap-3 mt-4 justify-center md:justify-start'>
                {singlePurchase.features.slice(0, 4).map((feature, i) => (
                  <li
                    key={i}
                    className='flex items-center gap-1 text-sm text-gray-300'
                  >
                    <svg
                      className='w-4 h-4 text-amber-400'
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
              <div className='text-3xl font-bold text-white mb-2'>9,99€</div>
              <Button
                onClick={() =>
                  handleSubscribe(singlePurchase.lookupKey, singlePurchase.id)
                }
                isLoading={isLoading === singlePurchase.id}
                variant='primary'
                size='lg'
                className='bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              >
                Comprar ahora
              </Button>
            </div>
          </div>
        </div>

        <div className='text-center mb-8'>
          <p className='text-gray-400 text-sm'>
            O elige un plan de suscripción
          </p>
        </div>

        {/* Pricing cards */}
        <div className='grid md:grid-cols-3 gap-8'>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-b from-[#e94560]/20 to-transparent border-2 border-[#e94560]/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.popular && (
                <div className='absolute -top-4 left-1/2 -translate-x-1/2'>
                  <span className='px-4 py-1 bg-[#e94560] text-white text-sm font-medium rounded-full'>
                    Más popular
                  </span>
                </div>
              )}

              <div className='text-center mb-8'>
                <h2 className='text-2xl font-bold text-white mb-2'>
                  {plan.name}
                </h2>
                <p className='text-gray-400 text-sm mb-4'>{plan.description}</p>
                <div className='flex items-baseline justify-center gap-1'>
                  {plan.price === 0 ? (
                    <span className='text-4xl font-bold text-white'>
                      Gratis
                    </span>
                  ) : (
                    <>
                      <span className='text-4xl font-bold text-white'>
                        {plan.price.toFixed(2).replace('.', ',')}€
                      </span>
                      <span className='text-gray-400'>{plan.period}</span>
                    </>
                  )}
                </div>
              </div>

              <ul className='space-y-3 mb-8'>
                {plan.features.map((feature, index) => (
                  <li key={index} className='flex items-start gap-3'>
                    <svg
                      className='w-5 h-5 text-green-400 flex-shrink-0 mt-0.5'
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
                    <span className='text-gray-300'>{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <li key={`lim-${index}`} className='flex items-start gap-3'>
                    <svg
                      className='w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5'
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
                    <span className='text-gray-500'>{limitation}</span>
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
        <div className='mt-24'>
          <h2 className='text-3xl font-bold text-white text-center mb-12'>
            Preguntas frecuentes
          </h2>

          <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
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
                className='bg-white/5 border border-white/10 rounded-xl p-6'
              >
                <h3 className='text-lg font-semibold text-white mb-2'>
                  {faq.q}
                </h3>
                <p className='text-gray-400'>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t border-white/10 py-8 mt-24'>
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
        <div className='min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center'>
          <div className='w-8 h-8 border-2 border-white/20 border-t-[#e94560] rounded-full animate-spin' />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
