# Mobile Viewer Optimization Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la experiencia del `FlipBookViewer` en móvil para que sea full-screen-first, con la página ocupando el máximo del viewport, controles auto-ocultables, tap zones para navegar y sin chrome que reste espacio.

**Architecture:** Refactor del viewer manteniendo el motor de flip/zoom existente. Introducir un modo "inmersivo" mobile-only: header/footer auto-ocultables, tap zones absolutas sobre el book, progress bar scrubber en lugar de input, layout que maximiza `max-height` además de `max-width`, y safe-area-insets para iOS. Cada fase es commitable por separado.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind 4, iOS Safari/Chrome Android como targets primarios.

---

## Diagnóstico (screenshots 2026-04-17)

**iPhone portrait (390×844), página A4 landscape (ratio ≈ 1.41:1):**
- Container aspect = page ratio → 390 px ancho, **276 px alto**. Queda ≈ 400 px de banda negra arriba/abajo desaprovechada.
- Título "TEJIENDO EL VACÍO URBANO" ocupa ≈ 80 px de header.
- Footer: prev + [12][Ir] 77 + next + zoom out/in → todo abarrotado en una fila, botones pequeños.
- Hints laterales: flechas minúsculas.
- Sin feedback de progreso para un libro de 77 páginas.

**iPhone landscape (844×390), dos páginas:**
- Título se corta (positionado sobre la página).
- Barra inferior de Safari come espacio.
- Chrome siempre visible → distrae.

## Principios de diseño

1. **La página es la reina.** En móvil, ocupa todo el viewport disponible.
2. **Tap-to-navigate.** Mitad izquierda retrocede, mitad derecha avanza, centro toggle UI. Swipe sigue funcionando.
3. **Chrome self-effacing.** Header/footer se desvanecen tras 3 s sin interacción. Cualquier tap los trae de vuelta.
4. **Un solo control de progreso.** Scrubber horizontal, tappable y arrastrables, no input de número.
5. **Respeta el notch.** `env(safe-area-inset-*)` en todos los bordes.
6. **Touch targets ≥ 44×44 px** (WCAG 2.1 Level AAA).
7. **Mobile-first pero no mobile-only.** Desktop mantiene la UI actual.

## Archivos afectados

- `components/flipbook/FlipBookViewer.tsx` — motor, añadir `isMobile` / `chromeVisible` / tap zones / safe-area.
- `components/flipbook/FlipControls.tsx` — variant `mobile`, progress scrubber, touch-sized buttons.
- `components/flipbook/TapZones.tsx` *(new)* — overlay absoluto con 3 zonas (prev / toggle / next).
- `components/flipbook/ProgressScrubber.tsx` *(new)* — barra + handle táctil.
- `app/(viewer)/view/[slug]/page.tsx` — `viewport` meta, safe-area aware.
- `app/(viewer)/embed/[slug]/page.tsx` — idem, pero sin header.

---

## Fase 1 — Maximizar la página dentro del viewport

Objetivo: en single-page mode, el container del libro debe ocupar el mayor rectángulo posible que quepa en el viewport respetando el aspect ratio.

### Task 1.1: Container size driven by both axes

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx` — bloque del wrapper not-zoomed.

- [ ] **Step 1: Cambiar el container responsive a constraint de dos ejes**

En [FlipBookViewer.tsx](../../../components/flipbook/FlipBookViewer.tsx), localizar el bloque `{isZoomed && baseWidth > 0 ? ... : ...}` y reemplazar la rama falsy:

```tsx
) : (
  <div
    ref={containerRef}
    className='relative select-none mx-auto'
    style={{
      aspectRatio: `${spreadAspectRatio} / 1`,
      width: '100%',
      maxWidth: `min(100%, calc((100vh - var(--viewer-chrome-height, 0px)) * ${spreadAspectRatio}))`,
      maxHeight: '100%'
    }}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
    onDoubleClick={handleDoubleClick}
  >
    {bookInner}
  </div>
)
```

**Nota:** `maxWidth: min(100%, (available-height) * aspect)` garantiza que si el alto disponible es el factor limitante, el ancho se reduce proporcionalmente → no se desperdicia altura.

- [ ] **Step 2: Reducir padding del flex wrapper en móvil**

En el mismo archivo, cambiar:

```tsx
<div
  className='flex items-center justify-center p-4'
  style={{
    minHeight: '100%',
    minWidth: isZoomed ? 'fit-content' : '100%'
  }}
>
```

Por:

```tsx
<div
  className='flex items-center justify-center p-2 sm:p-4 h-full'
  style={{
    minHeight: '100%',
    minWidth: isZoomed ? 'fit-content' : '100%'
  }}
>
```

- [ ] **Step 3: Definir --viewer-chrome-height variable**

Para que el `calc(100vh - chrome)` funcione, el componente publica la altura actual del chrome. Añadir al principio del JSX del viewer (justo antes del `<div ref={scrollContainerRef}>`):

```tsx
const chromeHeightPx =
  (title || ownerName ? 48 : 0) + (showControls ? 64 : 0) + 8
```

Y en el outer wrapper:

```tsx
<div
  className={`relative w-full h-full flex flex-col ${className}`}
  style={{ ['--viewer-chrome-height' as string]: `${chromeHeightPx}px` }}
>
```

- [ ] **Step 4: Typecheck y commit**

```bash
cd /Users/vicentebarberatormo/Developer/VIBATO/flipbook
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Maximize page size within viewport using dual-axis constraints"
```

---

## Fase 2 — Tap zones para navegar

Objetivo: en móvil, tocar la mitad izquierda retrocede, la mitad derecha avanza, el centro alterna la visibilidad del chrome. No interfiere con swipe (el gesto de swipe cancela el tap).

### Task 2.1: Crear componente TapZones

**Files:**
- Create: `components/flipbook/TapZones.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
'use client'

import { useRef } from 'react'

interface TapZonesProps {
  onPrev: () => void
  onNext: () => void
  onToggleChrome: () => void
  enabled: boolean
}

// Overlay absoluto con tres zonas: 35% izq (prev), 30% centro (toggle),
// 35% der (next). Distingue tap de swipe/pinch comparando desplazamiento
// entre touchstart y touchend — si el dedo se movió > 10 px o hubo multitouch,
// no se activa.
export function TapZones({ onPrev, onNext, onToggleChrome, enabled }: TapZonesProps) {
  const startRef = useRef<{ x: number; y: number; touches: number } | null>(null)

  if (!enabled) return null

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      startRef.current = { x: 0, y: 0, touches: e.touches.length }
      return
    }
    startRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      touches: 1
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = startRef.current
    startRef.current = null
    if (!start || start.touches !== 1) return

    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.hypot(dx, dy) > 10) return // swipe, not tap

    const target = e.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const xInZone = (t.clientX - rect.left) / rect.width

    if (xInZone < 0.35) onPrev()
    else if (xInZone > 0.65) onNext()
    else onToggleChrome()
  }

  return (
    <div
      className='absolute inset-0 z-30 sm:hidden'
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  )
}
```

- [ ] **Step 2: Añadir state `chromeVisible` al FlipBookViewer**

En [FlipBookViewer.tsx](../../../components/flipbook/FlipBookViewer.tsx), junto a los otros states:

```tsx
const [chromeVisible, setChromeVisible] = useState(true)
const toggleChrome = useCallback(() => setChromeVisible((v) => !v), [])
```

- [ ] **Step 3: Integrar TapZones en el JSX**

Añadir import:

```tsx
import { TapZones } from './TapZones'
```

Dentro del `{bookInner}` wrapper, justo antes del cierre del containerRef, añadir el overlay como hermano de `bookInner`. Como el containerRef contiene `bookInner` directamente, necesitamos un wrapper adicional. Refactorizar ambas ramas del ternario para envolver:

```tsx
<div className='relative w-full h-full'>
  {bookInner}
  <TapZones
    onPrev={goToPrev}
    onNext={goToNext}
    onToggleChrome={toggleChrome}
    enabled={!isZoomed}
  />
</div>
```

Usar esta envoltura como hijo del containerRef en ambas ramas.

- [ ] **Step 4: Commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx components/flipbook/TapZones.tsx
git commit -m "Add tap zones for mobile navigation (left/center/right)"
```

---

## Fase 3 — Chrome auto-ocultable

Objetivo: header y footer se ocultan tras 3 s sin interacción, vuelven con cualquier tap/swipe/scroll/flip.

### Task 3.1: Auto-hide timer + animación

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Añadir timer de auto-hide**

```tsx
useEffect(() => {
  if (!chromeVisible) return
  const timer = setTimeout(() => setChromeVisible(false), 3000)
  return () => clearTimeout(timer)
}, [chromeVisible, currentSpread])
```

- [ ] **Step 2: Reset timer on activity**

Modificar los handlers de navegación para mostrar chrome temporalmente:

```tsx
const showChromeBriefly = useCallback(() => setChromeVisible(true), [])
```

Y llamarlo dentro de `goToSpread` y `jumpToSpread` (al principio):

```tsx
const goToSpread = useCallback(
  (direction: 'next' | 'prev') => {
    showChromeBriefly()
    if (isAnimating) return
    ...
```

```tsx
const jumpToSpread = useCallback(
  (target: number) => {
    showChromeBriefly()
    if (isAnimating) return
    ...
```

Añadir `showChromeBriefly` a las deps de los useCallback.

- [ ] **Step 3: Solo activar auto-hide en móvil**

El timer debe correr solo en móvil:

```tsx
useEffect(() => {
  if (!isMobile || !chromeVisible) return
  const timer = setTimeout(() => setChromeVisible(false), 3000)
  return () => clearTimeout(timer)
}, [isMobile, chromeVisible, currentSpread])
```

- [ ] **Step 4: Aplicar transición al header/footer**

Envolver el bloque del título (`{(title || ownerName) && (...)`) con:

```tsx
<div
  className={`transition-opacity duration-300 ${chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
>
  {/* existing title block */}
</div>
```

Envolver el bloque de FlipControls:

```tsx
{showControls && (
  <div
    className={`transition-opacity duration-300 ${chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
  >
    <FlipControls ... />
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Auto-hide chrome after 3s of inactivity on mobile"
```

---

## Fase 4 — Progress scrubber táctil

Objetivo: sustituir el input numérico en móvil por una barra de progreso tappable y arrastrable que muestra la página actual.

### Task 4.1: Crear ProgressScrubber

**Files:**
- Create: `components/flipbook/ProgressScrubber.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
'use client'

import { useRef, useState } from 'react'

interface ProgressScrubberProps {
  currentSpread: number
  totalSpreads: number
  onJumpToSpread: (target: number) => void
}

// Barra horizontal con handle. Tap → salta a esa página. Drag con pointer
// events (unifica mouse + touch). Label flotante mientras se arrastra.
export function ProgressScrubber({
  currentSpread,
  totalSpreads,
  onJumpToSpread
}: ProgressScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragSpread, setDragSpread] = useState<number | null>(null)

  const spreadFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (!track) return currentSpread
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(pct * (totalSpreads - 1))
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const s = spreadFromClientX(e.clientX)
    setDragSpread(s)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragSpread === null) return
    setDragSpread(spreadFromClientX(e.clientX))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragSpread !== null) {
      onJumpToSpread(dragSpread)
      setDragSpread(null)
    }
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const displaySpread = dragSpread ?? currentSpread
  const pct =
    totalSpreads > 1 ? (displaySpread / (totalSpreads - 1)) * 100 : 0

  return (
    <div className='flex items-center gap-3 flex-1 min-w-0'>
      <span className='text-xs text-white/70 tabular-nums shrink-0'>
        {displaySpread + 1}
      </span>
      <div
        ref={trackRef}
        className='relative flex-1 h-8 flex items-center cursor-pointer touch-none'
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className='absolute inset-x-0 h-1 bg-white/20 rounded-full' />
        <div
          className='absolute h-1 bg-[#16a34a] rounded-full'
          style={{ left: 0, width: `${pct}%` }}
        />
        <div
          className='absolute w-4 h-4 bg-white rounded-full shadow -translate-x-1/2'
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className='text-xs text-white/70 tabular-nums shrink-0'>
        {totalSpreads}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Usar ProgressScrubber en FlipControls (mobile)**

En [FlipControls.tsx](../../../components/flipbook/FlipControls.tsx), importar:

```tsx
import { ProgressScrubber } from './ProgressScrubber'
```

Añadir prop `isMobile`:

```tsx
interface FlipControlsProps {
  ...
  isMobile?: boolean
  ...
}

export function FlipControls({
  ...
  isMobile = false,
  ...
}: FlipControlsProps) {
```

Reemplazar el bloque `totalSpreads <= 10 ? dots : PageJumpInput` por:

```tsx
{isMobile ? (
  onJumpToSpread && (
    <ProgressScrubber
      currentSpread={currentSpread}
      totalSpreads={totalSpreads}
      onJumpToSpread={onJumpToSpread}
    />
  )
) : totalSpreads <= 10 ? (
  <div className='flex items-center gap-1.5'>
    {Array.from({ length: totalSpreads }).map((_, i) => (
      <button
        key={i}
        onClick={() => onJumpToSpread?.(i)}
        aria-label={`Go to spread ${i + 1}`}
        className={`
          w-2 h-2 rounded-full transition-all duration-300
          ${i === currentSpread
            ? 'bg-[#16a34a] scale-125'
            : 'bg-white/30 hover:bg-white/50'}
        `}
      />
    ))}
  </div>
) : (
  <PageJumpInput
    currentSpread={currentSpread}
    totalSpreads={totalSpreads}
    totalPages={totalPages}
    pagesPerSpread={pagesPerSpread}
    onJumpToSpread={onJumpToSpread}
  />
)}
```

Ocultar el contador en móvil (el scrubber ya lo muestra) — envolver el `<div className='text-white/70 text-sm font-medium min-w-[80px] text-center'>` con `{!isMobile && (...)}`.

- [ ] **Step 3: Pasar isMobile desde FlipBookViewer**

```tsx
<FlipControls
  ...
  isMobile={isMobile}
  ...
/>
```

- [ ] **Step 4: Commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/ProgressScrubber.tsx components/flipbook/FlipControls.tsx components/flipbook/FlipBookViewer.tsx
git commit -m "Replace page input with touch-friendly progress scrubber on mobile"
```

---

## Fase 5 — Safe area insets + viewport meta

Objetivo: que los controles no queden ocultos por la home bar / dynamic island en iOS, ni por la barra inferior de Safari.

### Task 5.1: Viewport meta + globals.css

**Files:**
- Modify: `app/(viewer)/layout.tsx` (si existe) o `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Confirmar viewport meta**

Verificar en el layout raíz:

```bash
grep -n "viewport" app/layout.tsx
```

Si falta o no tiene `viewport-fit=cover`, añadir en `app/layout.tsx`:

```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  themeColor: '#1C1917'
}
```

- [ ] **Step 2: Usar safe-area-insets en controls**

En [FlipControls.tsx](../../../components/flipbook/FlipControls.tsx), el root:

```tsx
<div
  className='flex items-center justify-center gap-3 sm:gap-6 py-3 sm:py-4 px-3'
  style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
>
```

- [ ] **Step 3: Safe area en header (view page)**

En [app/(viewer)/view/[slug]/page.tsx](../../../app/(viewer)/view/[slug]/page.tsx), el `<header>`:

```tsx
<header
  className='absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between'
  style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
>
```

- [ ] **Step 4: Dynamic viewport en móvil**

El viewer usa `h-screen` / `100vh`, que en iOS Safari incluye la barra de direcciones. Usar `100svh` para la altura mínima estable.

En [FlipBookViewer.tsx](../../../components/flipbook/FlipBookViewer.tsx) outer wrapper, añadir `min-height: 100svh` no aplica porque el componente hereda. La raíz es en la página. En [view/[slug]/page.tsx](../../../app/(viewer)/view/[slug]/page.tsx):

```tsx
<main className='h-[100svh] pt-16 pb-4'>
```

Y mismo en embed.

- [ ] **Step 5: Commit**

```bash
pnpm exec tsc --noEmit
git add app/\(viewer\) components/flipbook/FlipControls.tsx app/layout.tsx 2>/dev/null || true
git add -u
git commit -m "Add safe-area-insets and dynamic viewport height for iOS"
```

---

## Fase 6 — Breakpoint landscape inteligente

Objetivo: decidir single-page/two-page según aspect ratio del viewport, no solo por ancho. iPhone landscape (844×390) con 2 páginas es demasiado estrecho vertical.

### Task 6.1: Reemplazar matchMedia por lógica basada en ratio

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Nueva lógica**

En [FlipBookViewer.tsx](../../../components/flipbook/FlipBookViewer.tsx), reemplazar el effect de isMobile:

```tsx
const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  if (typeof window === 'undefined') return
  const compute = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    // Mobile single-page si: pantalla pequeña (<= 640 ancho) O
    // alto insuficiente para mostrar 2 páginas cómodas.
    // "Cómodo" = altura del spread (w / spreadRatio) > 50% del alto total.
    const smallWidth = w <= 640
    const spreadH = w / (pageAspectRatio * 2)
    const crampedHeight = spreadH < h * 0.4
    setIsMobile(smallWidth || crampedHeight)
  }
  compute()
  window.addEventListener('resize', compute)
  window.addEventListener('orientationchange', compute)
  return () => {
    window.removeEventListener('resize', compute)
    window.removeEventListener('orientationchange', compute)
  }
}, [pageAspectRatio])
```

- [ ] **Step 2: Commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Smart layout breakpoint: fall back to single-page when height is cramped"
```

---

## Fase 7 — Touch targets + footer compacto

Objetivo: botones ≥ 44×44 px en móvil; footer más compacto para liberar altura.

### Task 7.1: Tamaños táctiles WCAG AAA

**Files:**
- Modify: `components/flipbook/FlipControls.tsx`

- [ ] **Step 1: Aumentar el click target de prev/next**

Buscar los `<button onClick={onPrev}` / `onNext` y reemplazar:

```tsx
<button
  onClick={onPrev}
  disabled={!canGoPrev || isAnimating}
  className={`
    min-w-[44px] min-h-[44px] p-3 rounded-full transition-all duration-200
    ${canGoPrev && !isAnimating
      ? 'bg-white/10 hover:bg-white/20 text-white'
      : 'bg-white/5 text-white/30 cursor-not-allowed'}
  `}
  aria-label='Previous spread'
>
```

Mismo patrón para next, zoom in, zoom out, reset zoom — todos los botones del footer.

- [ ] **Step 2: Ocultar zoom/reset en móvil**

El scrubber ya permite navegar; el zoom se hace con pinch. En móvil, ocultar los botones de zoom para simplificar (pinch y double-tap siguen funcionando):

En FlipControls, envolver el bloque `{onZoomIn && (...)}` con:

```tsx
{onZoomIn && !isMobile && (
  <>...</>
)}
```

- [ ] **Step 3: Commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipControls.tsx
git commit -m "Enforce 44px touch targets; hide zoom buttons on mobile (pinch/double-tap only)"
```

---

## Fase 8 — Header compacto en móvil

Objetivo: el título y owner no deben comer viewport en móvil. Solo el share y back.

### Task 8.1: Colapsar título en móvil

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Ocultar título interno en móvil**

El viewer tiene su propio título interno (`{title && <h1>{title}</h1>}`). En móvil ocupa 48 px fijos. Ocultar:

```tsx
{(title || ownerName) && !isMobile && (
  <div className='text-center py-2 shrink-0'>
    {/* existing content */}
  </div>
)}
```

Y actualizar `chromeHeightPx` de Fase 1 step 3:

```tsx
const chromeHeightPx =
  ((title || ownerName) && !isMobile ? 48 : 0) + (showControls ? 64 : 0) + 8
```

- [ ] **Step 2: Header de la view page compacto en móvil**

En [app/(viewer)/view/[slug]/page.tsx](../../../app/(viewer)/view/[slug]/page.tsx), reducir el padding del header en móvil:

```tsx
<header
  className='absolute top-0 left-0 right-0 z-50 p-2 sm:p-4 flex items-center justify-between'
  style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
>
```

Y ocultar el logo/link grande a `w-6 h-6` en móvil:

```tsx
<svg className='w-6 h-6 sm:w-8 sm:h-8' ...>
```

- [ ] **Step 3: Commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx app/\(viewer\)/view/\[slug\]/page.tsx
git commit -m "Compact mobile header: hide internal title, smaller logo, less padding"
```

---

## Fase 9 — Verificación en dispositivo real

Objetivo: verificar en navegador móvil real (o DevTools device emulation) que todos los comportamientos funcionan.

### Task 9.1: Matriz de pruebas

- [ ] **Step 1: Chromium DevTools device emulation**

Abrir `/view/<slug>` en Chrome DevTools con estas emulaciones:
- iPhone 13 (390×844, portrait)
- iPhone 13 (844×390, landscape)
- Pixel 7 (412×915)
- iPad Mini (768×1024)

Para cada uno verificar:

| Caso | Pasa si |
|---|---|
| Portada carga | Visible sin banda negra excesiva |
| Single-page en portrait (<640) | La página ocupa ≥ 80% del viewport vertical |
| Landscape iPhone 13 | Single-page (por altura cramped) |
| iPad portrait 768 | Two-page |
| Tap en mitad izquierda | Retrocede |
| Tap en mitad derecha | Avanza |
| Tap en centro | Chrome se oculta / muestra |
| Auto-hide | Chrome desaparece tras 3s sin tocar |
| Swipe | Avanza/retrocede sin confundirse con tap |
| Pinch zoom | Funciona; tap zones se desactivan mientras zoom > 1 |
| Double-tap | Zoom 1x ↔ 2x anclado al dedo |
| Progress scrubber tap | Salta a esa página |
| Progress scrubber drag | Label actualiza en tiempo real; soltar salta |
| Botones prev/next | Touch target ≥ 44px |
| Safari iOS | Contenido no queda bajo la home bar |
| iPhone con notch portrait | Header respeta safe-area-top |
| Flip animation | Fluido en móvil (mantener 60fps) |

- [ ] **Step 2: Si todo verde, merge/PR**

```bash
git push origin improvements-01
```

---

## Out of scope

- **Fullscreen API nativa** (requestFullscreen) — útil pero complejo en iOS Safari (soporte parcial). Evaluar en un plan posterior si el usuario lo pide.
- **Offline mode / PWA** — fuera de alcance.
- **Gestures avanzados** (3-finger swipe, force-touch) — no son standard.
- **Rearranging orientaciones por JS** (screen.orientation.lock) — requiere fullscreen y genera problemas en iOS; mejor dejar que el usuario rote.
- **Optimización de imágenes móvil-específica** (srcset con tamaños diferentes) — con `unoptimized` actualmente no se puede; out of scope.

## Resumen de UX resultante

Antes:
- Página minúscula centrada con banda negra > 50% del viewport
- Título + footer siempre visibles comiendo altura
- Controles con botones pequeños
- Navegación solo por botón/swipe; hints laterales invisibles
- Libro de 77 páginas → input numérico para saltar

Después:
- Página ocupa casi todo el viewport
- Tap a los lados para navegar (1 mano, pulgar)
- Tap al centro para mostrar/ocultar chrome
- Chrome se auto-oculta tras 3 s → inmersivo
- Progress bar visible con scrubber arrastrable
- Botones con 44 px de touch target
- Respeta notch, home bar y dynamic viewport
- Landscape cramped → single-page automático
