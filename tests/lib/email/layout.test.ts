import { describe, expect, it } from 'vitest'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'

describe('email layout helpers', () => {
  it('envuelve el contenido con branding de FlipBook by VIBATO', () => {
    const html = emailLayout('<p>Contenido principal</p>')

    expect(html).toContain('lang="es"')
    expect(html).toContain('FlipBook')
    expect(html).toContain('by VIBATO')
    expect(html).toContain('Un saludo, El equipo de FlipBook')
    expect(html).toContain('Este es un correo automatico')
    expect(html).toContain('<p>Contenido principal</p>')
  })

  it('genera un boton CTA con el enlace y el label', () => {
    const html = ctaButton('https://flip.vibato.io/login', 'Ir a FlipBook')

    expect(html).toContain('https://flip.vibato.io/login')
    expect(html).toContain('Ir a FlipBook')
    expect(html).toContain('border-radius:9999px')
  })

  it('genera componentes auxiliares reutilizables', () => {
    expect(eyebrowTag('Seguridad')).toContain('SEGURIDAD')
    expect(infoPanel('<strong>Dato</strong>')).toContain('<strong>Dato</strong>')
  })
})
