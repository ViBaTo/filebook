# FlipBook Audit Fixes — Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver los 20 bugs/issues identificados en la auditoría del 2026-04-17, priorizando P0/P1 (zoom rework, aspect ratio real, memory leaks, estados de libro, preload duplicado, UX).

**Architecture:** Refactor incremental en 5 fases independientes y commitables por fase. Cada fase es mergeable por sí sola. No hay tests para el viewer (confirmado en la spec de zoom) → verificación es manual + typecheck + lint.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind 4, pdfjs-dist, Supabase, TypeScript.

---

## Contexto de archivos

Archivos que se tocan y su responsabilidad:

- [components/flipbook/FlipBookViewer.tsx](../../../components/flipbook/FlipBookViewer.tsx) — núcleo del visor (zoom, flip, preload, keyboard, touch).
- [components/flipbook/FlipControls.tsx](../../../components/flipbook/FlipControls.tsx) — barra inferior (nav + zoom).
- [components/flipbook/FlipPage.tsx](../../../components/flipbook/FlipPage.tsx) — página 3D que gira.
- [app/(viewer)/view/[slug]/page.tsx](../../../app/(viewer)/view/[slug]/page.tsx) — server page vista pública.
- [app/(viewer)/view/[slug]/FlipBookViewerWrapper.tsx](../../../app/(viewer)/view/[slug]/FlipBookViewerWrapper.tsx) — wrapper client con analytics.
- [app/(viewer)/embed/[slug]/page.tsx](../../../app/(viewer)/embed/[slug]/page.tsx) — server page embed.
- [app/(viewer)/embed/[slug]/EmbedViewerWrapper.tsx](../../../app/(viewer)/embed/[slug]/EmbedViewerWrapper.tsx) — wrapper embed con postMessage.
- [lib/pdf/renderer.ts](../../../lib/pdf/renderer.ts) — rasterizador PDF.
- [lib/pdf/uploader.ts](../../../lib/pdf/uploader.ts) — subida a Supabase Storage + update book.
- [lib/types.ts](../../../lib/types.ts) — tipos compartidos del flipbook.

Archivos nuevos:
- [app/(viewer)/view/[slug]/status-fallback.tsx](../../../app/(viewer)/view/[slug]/status-fallback.tsx) — UI para estados `processing` / `error`.

---

## Fase 1 — Fixes rápidos de fiabilidad

Objetivos: arreglar memory leak, dedup preload, cleanup refs, estado UI para processing/error.

### Task 1.1: Cleanup del listener `visibilitychange` en wrappers

**Files:**
- Modify: `app/(viewer)/view/[slug]/FlipBookViewerWrapper.tsx`
- Modify: `app/(viewer)/embed/[slug]/EmbedViewerWrapper.tsx`

- [ ] **Step 1: Refactorizar analytics effect en view wrapper**

En [FlipBookViewerWrapper.tsx:65-100](../../../app/(viewer)/view/[slug]/FlipBookViewerWrapper.tsx#L65-L100), reemplazar el segundo `useEffect` por:

```tsx
  useEffect(() => {
    const updateAnalytics = () => {
      const startTime = startTimeRef.current
      if (!analyticsIdRef.current || startTime === null) return

      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      const pagesViewed = pagesViewedRef.current.size

      const data = JSON.stringify({
        id: analyticsIdRef.current,
        pages_viewed: pagesViewed,
        max_page_reached: maxPageRef.current + 1,
        time_spent_seconds: timeSpent
      })

      navigator.sendBeacon('/api/analytics', data)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateAnalytics()
      }
    }

    const interval = setInterval(updateAnalytics, 30000)
    window.addEventListener('beforeunload', updateAnalytics)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', updateAnalytics)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      updateAnalytics()
    }
  }, [])
```

- [ ] **Step 2: Mismo fix en embed wrapper**

Aplicar el mismo patrón en [EmbedViewerWrapper.tsx:106-138](../../../app/(viewer)/embed/[slug]/EmbedViewerWrapper.tsx#L106-L138).

- [ ] **Step 3: Typecheck y commit**

```bash
cd /Users/vicentebarberatormo/Developer/VIBATO/flipbook
pnpm exec tsc --noEmit
git add app/\(viewer\)/view/\[slug\]/FlipBookViewerWrapper.tsx app/\(viewer\)/embed/\[slug\]/EmbedViewerWrapper.tsx
git commit -m "Fix visibilitychange listener leak in viewer wrappers"
```

### Task 1.2: Deduplicar preload de imágenes en el viewer

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Añadir ref `loadingImagesRef`**

Añadir un `ref` que trackee qué páginas ya tienen `Image()` en vuelo, evitando dispararlo dos veces. Insertar junto a los demás refs (tras L50).

```tsx
  const retryCountRef = useRef<Map<number, number>>(new Map())
  const loadingImagesRef = useRef<Set<number>>(new Set())
  const MAX_RETRIES = 2
```

- [ ] **Step 2: Guardar cada Image y cancelarla en cleanup**

Reemplazar el `useEffect` de preload (L95-145) por:

```tsx
  useEffect(() => {
    const pagesToPreload: number[] = []
    for (let i = -2; i <= 2; i++) {
      const spreadIndex = currentSpread + i
      if (spreadIndex >= 0 && spreadIndex < totalSpreads) {
        if (spreadIndex === 0) {
          pagesToPreload.push(0)
        } else {
          const left = (spreadIndex - 1) * 2 + 1
          const right = (spreadIndex - 1) * 2 + 2
          if (left < totalPages) pagesToPreload.push(left)
          if (right < totalPages) pagesToPreload.push(right)
        }
      }
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    const createdImages: HTMLImageElement[] = []
    let cancelled = false

    pagesToPreload.forEach((pageIndex) => {
      if (
        loadedImages.has(pageIndex) ||
        failedImages.has(pageIndex) ||
        loadingImagesRef.current.has(pageIndex)
      ) return

      loadingImagesRef.current.add(pageIndex)
      const img = new Image()
      createdImages.push(img)

      const onLoad = () => {
        if (cancelled) return
        loadingImagesRef.current.delete(pageIndex)
        setLoadedImages((prev) => {
          if (prev.has(pageIndex)) return prev
          const next = new Set(prev)
          next.add(pageIndex)
          return next
        })
        retryCountRef.current.delete(pageIndex)
      }

      const onError = () => {
        if (cancelled) return
        const attempts = retryCountRef.current.get(pageIndex) ?? 0
        if (attempts < MAX_RETRIES) {
          retryCountRef.current.set(pageIndex, attempts + 1)
          const timerId = setTimeout(() => {
            if (cancelled) return
            const url = pages[pageIndex]
            if (!url) return
            const retryImg = new Image()
            createdImages.push(retryImg)
            retryImg.onload = onLoad
            retryImg.onerror = onError
            retryImg.src = `${url}${url.includes('?') ? '&' : '?'}retry=${attempts + 1}`
          }, 1000 * (attempts + 1))
          timers.push(timerId)
        } else {
          loadingImagesRef.current.delete(pageIndex)
          setFailedImages((prev) => {
            if (prev.has(pageIndex)) return prev
            const next = new Set(prev)
            next.add(pageIndex)
            return next
          })
        }
      }

      img.onload = onLoad
      img.onerror = onError
      img.src = pages[pageIndex]
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      createdImages.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
    }
  }, [currentSpread, pages, totalPages, totalSpreads, loadedImages, failedImages])
```

- [ ] **Step 3: Limpiar `loadingImagesRef` también en `retryPage`**

En [FlipBookViewer.tsx:314-321](../../../components/flipbook/FlipBookViewer.tsx#L314-L321) actualizar:

```tsx
  const retryPage = useCallback((pageIndex: number) => {
    setFailedImages((prev) => {
      const next = new Set(prev)
      next.delete(pageIndex)
      return next
    })
    retryCountRef.current.delete(pageIndex)
    loadingImagesRef.current.delete(pageIndex)
  }, [])
```

- [ ] **Step 4: Typecheck y commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Deduplicate image preload and cancel stale loads on cleanup"
```

### Task 1.3: UI para `status` processing/error

**Files:**
- Create: `app/(viewer)/view/[slug]/status-fallback.tsx`
- Modify: `app/(viewer)/view/[slug]/page.tsx`
- Modify: `app/(viewer)/embed/[slug]/page.tsx`

- [ ] **Step 1: Crear el componente de fallback**

```tsx
// app/(viewer)/view/[slug]/status-fallback.tsx
import Link from 'next/link'

interface StatusFallbackProps {
  status: 'uploading' | 'processing' | 'error'
  errorMessage?: string | null
  title?: string | null
}

export function StatusFallback({ status, errorMessage, title }: StatusFallbackProps) {
  const isError = status === 'error'

  return (
    <div className='min-h-screen bg-linear-to-br from-[#1C1917] via-[#292524] to-[#1C1917] flex items-center justify-center px-6'>
      <div className='max-w-md w-full bg-white/5 border border-white/10 rounded-[16px] p-8 text-center backdrop-blur'>
        {!isError ? (
          <>
            <div className='w-12 h-12 mx-auto mb-4 border-2 border-white/20 border-t-[#16a34a] rounded-full animate-spin' />
            <h1 className='serif text-2xl text-white mb-2'>
              Procesando tu FlipBook
            </h1>
            <p className='text-white/60 text-sm'>
              {title ? `"${title}" está generándose.` : 'Tu flipbook está generándose.'}{' '}
              Esto suele tardar menos de un minuto. Refresca la página en unos segundos.
            </p>
          </>
        ) : (
          <>
            <div className='w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center'>
              <svg className='w-6 h-6 text-red-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <h1 className='serif text-2xl text-white mb-2'>
              No se pudo generar este FlipBook
            </h1>
            <p className='text-white/60 text-sm mb-4'>
              {errorMessage || 'El PDF no pudo procesarse. Intenta subirlo de nuevo.'}
            </p>
            <Link
              href='/create'
              className='inline-block px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-sm font-medium rounded-full transition-colors'
            >
              Subir otro PDF
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Cambiar el filtrado en `getBook` para no excluir estados no-ready**

En [app/(viewer)/view/[slug]/page.tsx:14-30](../../../app/(viewer)/view/[slug]/page.tsx#L14-L30), quitar el filtro `.eq('status', 'ready')` y devolver el book completo:

```tsx
async function getBook(slug: string) {
  const supabase = await createClient()

  const { data: book, error } = await supabase
    .from('fb_books')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !book) {
    return null
  }

  return book
}
```

- [ ] **Step 3: Rendear el fallback cuando `status !== 'ready'`**

En el default export de la misma página, antes de rendear el viewer principal:

```tsx
import { StatusFallback } from './status-fallback'

// ...dentro de ViewPage tras el notFound():
  if (book.status !== 'ready') {
    return (
      <StatusFallback
        status={book.status as 'uploading' | 'processing' | 'error'}
        errorMessage={book.error_message}
        title={book.title}
      />
    )
  }
```

- [ ] **Step 4: Mismo tratamiento en embed page**

En [app/(viewer)/embed/[slug]/page.tsx](../../../app/(viewer)/embed/[slug]/page.tsx), quitar `.eq('status', 'ready')` y si `status !== 'ready'` rendear un mensaje minimal (el embed no debe saltar a la web principal):

```tsx
  if (book.status !== 'ready') {
    const isError = book.status === 'error'
    return (
      <div className='h-screen w-screen bg-[#1C1917] flex items-center justify-center text-white/70 text-sm px-6 text-center'>
        {isError ? 'Este FlipBook no se pudo generar.' : 'Este FlipBook se está generando…'}
      </div>
    )
  }
```

- [ ] **Step 5: Typecheck y commit**

```bash
pnpm exec tsc --noEmit
git add app/\(viewer\)/view/\[slug\] app/\(viewer\)/embed/\[slug\]
git commit -m "Show friendly fallback UI when book is processing or errored"
```

---

## Fase 2 — Aspect ratio real del PDF

Objetivos: eliminar el `2.8:1` hard-codeado. Persistir dimensiones detectadas y usarlas en el viewer.

### Task 2.1: Persistir `aspect_ratio` al terminar el render

**Files:**
- Modify: `lib/pdf/uploader.ts`
- Modify: `app/(main)/create/page.tsx`

- [ ] **Step 1: Extender `updateBookWithPages` para aceptar ratio**

En [lib/pdf/uploader.ts:67-86](../../../lib/pdf/uploader.ts#L67-L86):

```tsx
export async function updateBookWithPages(
  bookId: string,
  pagesUrls: string[],
  pageCount: number,
  pageAspectRatio?: number
): Promise<void> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('fb_books')
    .select('settings')
    .eq('id', bookId)
    .single()

  const settings = {
    ...((existing?.settings as Record<string, unknown>) || {}),
    ...(pageAspectRatio ? { page_aspect_ratio: pageAspectRatio } : {}),
  }

  const { error } = await supabase
    .from('fb_books')
    .update({
      pages_urls: pagesUrls,
      page_count: pageCount,
      settings,
      status: 'ready'
    })
    .eq('id', bookId)

  if (error) {
    throw new Error(`Failed to update book: ${error.message}`)
  }
}
```

- [ ] **Step 2: Calcular y pasar aspect ratio en `create/page.tsx`**

En [app/(main)/create/page.tsx:106-113](../../../app/(main)/create/page.tsx#L106-L113):

```tsx
        const pagesUrls = await uploadRenderedPages(
          bookId,
          renderedPages,
          onUploadProgress
        )

        const firstPage = renderedPages[0]
        const pageAspectRatio =
          firstPage && firstPage.height > 0
            ? firstPage.width / firstPage.height
            : undefined

        // Update book with pages
        await updateBookWithPages(bookId, pagesUrls, renderedPages.length, pageAspectRatio)
```

- [ ] **Step 3: Commit**

```bash
pnpm exec tsc --noEmit
git add lib/pdf/uploader.ts app/\(main\)/create/page.tsx
git commit -m "Persist per-page aspect ratio in book settings after PDF render"
```

### Task 2.2: Consumir aspect ratio en el viewer

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`
- Modify: `app/(viewer)/view/[slug]/FlipBookViewerWrapper.tsx`
- Modify: `app/(viewer)/view/[slug]/page.tsx`
- Modify: `app/(viewer)/embed/[slug]/EmbedViewerWrapper.tsx`
- Modify: `app/(viewer)/embed/[slug]/page.tsx`

- [ ] **Step 1: Añadir prop `pageAspectRatio` al viewer**

En `FlipBookViewer.tsx` props:

```tsx
interface FlipBookViewerProps {
  pages: string[]
  title?: string
  showWatermark?: boolean
  showControls?: boolean
  autoFlipSeconds?: number
  onPageChange?: (page: number) => void
  className?: string
  ownerName?: string | null
  pageAspectRatio?: number  // ancho/alto de una página individual
}
```

En la función: destructurar con default `pageAspectRatio = 1 / 1.414` (A4 portrait).

```tsx
export function FlipBookViewer({
  pages,
  title,
  showWatermark = true,
  showControls = true,
  autoFlipSeconds = 0,
  onPageChange,
  className = '',
  ownerName,
  pageAspectRatio = 1 / 1.414
}: FlipBookViewerProps) {
```

- [ ] **Step 2: Calcular aspect ratio del spread y usarlo en el contenedor**

En FlipBookViewer, justo antes del `return`:

```tsx
  // Spread aspect ratio = 2 páginas lado a lado (cuando no es cover).
  // Cover = 1 página sola pero mantenemos el mismo contenedor para
  // evitar que el layout "salte" al abrir el libro.
  const spreadAspectRatio = pageAspectRatio * 2
```

En el JSX (L393-400) reemplazar `aspectRatio: '2.8 / 1'`:

```tsx
          <div
            ref={containerRef}
            className={`relative select-none ${!zoomedWidth ? 'w-full max-w-7xl' : ''}`}
            style={{
              ...(zoomedWidth ? { width: `${zoomedWidth}px` } : {}),
              aspectRatio: `${spreadAspectRatio} / 1`,
              transition: 'width 0.3s ease',
            }}
```

- [ ] **Step 3: Pasar el ratio desde los wrappers**

En [FlipBookViewerWrapper.tsx](../../../app/(viewer)/view/[slug]/FlipBookViewerWrapper.tsx), añadir prop y pasar:

```tsx
interface FlipBookViewerWrapperProps {
  bookId: string
  pages: string[]
  title: string
  showWatermark: boolean
  autoFlipSeconds: number
  ownerName?: string | null
  pageAspectRatio?: number
}
```

Y en el JSX:

```tsx
  return (
    <FlipBookViewer
      pages={pages}
      title={title}
      showWatermark={showWatermark}
      showControls={true}
      autoFlipSeconds={autoFlipSeconds}
      onPageChange={handlePageChange}
      ownerName={ownerName}
      pageAspectRatio={pageAspectRatio}
    />
  )
```

Mismo cambio en [EmbedViewerWrapper.tsx](../../../app/(viewer)/embed/[slug]/EmbedViewerWrapper.tsx).

- [ ] **Step 4: Leer `settings.page_aspect_ratio` en las page.tsx**

En [view/[slug]/page.tsx](../../../app/(viewer)/view/[slug]/page.tsx):

```tsx
        <FlipBookViewerWrapper
          bookId={book.id}
          pages={pagesUrls}
          title={book.title}
          showWatermark={book.is_anonymous}
          autoFlipSeconds={book.settings?.auto_flip_seconds || 0}
          ownerName={owner?.full_name || null}
          pageAspectRatio={book.settings?.page_aspect_ratio}
        />
```

Mismo en [embed/[slug]/page.tsx](../../../app/(viewer)/embed/[slug]/page.tsx).

- [ ] **Step 5: Typecheck y commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx app/\(viewer\)
git commit -m "Use real PDF aspect ratio instead of hard-coded 2.8:1"
```

---

## Fase 3 — Zoom rework (implementar la spec)

Objetivos: zoom con `transform`, zoom-a-cursor, coalesced wheel con exponencial, pinch anchored al midpoint, sin recentrado forzado.

### Task 3.1: Refactor base del zoom a `transform` + sizer

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Añadir estados/refs nuevos**

Reemplazar las constantes y hooks relacionados con zoom. Dejar `MIN_ZOOM`, `MAX_ZOOM`, `ZOOM_STEP` como están.

Tras los refs existentes, añadir:

```tsx
  const currentZoomRef = useRef(1)
  const pendingDeltaRef = useRef(0)
  const rafScheduledRef = useRef(false)
  const anchorRef = useRef({ x: 0, y: 0 })
  const lastPinchEndedAtRef = useRef(0)
  const [transitionEnabled, setTransitionEnabled] = useState(false)
```

Mantener `currentZoom` state (ya existe). Mantener `baseWidth` state.

- [ ] **Step 2: Reemplazar useEffect de baseWidth por ResizeObserver**

Reemplazar el `useEffect` de measure (L72-81) por:

```tsx
  // Measure base width via ResizeObserver on scroll container.
  // Re-measure only when zoom is 1 to avoid feedback loops while zoomed.
  useEffect(() => {
    const container = scrollContainerRef.current
    const inner = containerRef.current
    if (!container || !inner) return

    const measure = () => {
      if (currentZoomRef.current <= 1) {
        const w = inner.offsetWidth
        if (w > 0) setBaseWidth(w)
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])
```

- [ ] **Step 3: Eliminar el useEffect que recentra en cada cambio de zoom**

Borrar el bloque [FlipBookViewer.tsx:83-93](../../../components/flipbook/FlipBookViewer.tsx#L83-L93) entero.

- [ ] **Step 4: Crear `applyZoom` helper**

Tras las definiciones de `clampZoom`:

```tsx
  const applyZoom = useCallback(
    (newZoom: number, anchorX: number, anchorY: number, animated = false) => {
      const container = scrollContainerRef.current
      if (!container) return
      const oldZoom = currentZoomRef.current
      const clamped = clampZoom(newZoom)
      if (clamped === oldZoom) return

      const contentX = container.scrollLeft + anchorX
      const contentY = container.scrollTop + anchorY
      const k = clamped / oldZoom

      currentZoomRef.current = clamped
      if (animated) setTransitionEnabled(true)
      setCurrentZoom(clamped)

      requestAnimationFrame(() => {
        container.scrollLeft = contentX * k - anchorX
        container.scrollTop = contentY * k - anchorY
      })
    },
    [clampZoom]
  )
```

- [ ] **Step 5: Reescribir zoomIn/zoomOut/zoomReset/handleDoubleClick para pasar por applyZoom**

Reemplazar las 4 funciones existentes (L153-168) por:

```tsx
  const getCenterAnchor = () => {
    const container = scrollContainerRef.current
    return {
      x: (container?.clientWidth ?? 0) / 2,
      y: (container?.clientHeight ?? 0) / 2
    }
  }

  const zoomIn = useCallback(() => {
    const anchor = getCenterAnchor()
    applyZoom(currentZoomRef.current + ZOOM_STEP, anchor.x, anchor.y, true)
  }, [applyZoom])

  const zoomOut = useCallback(() => {
    const anchor = getCenterAnchor()
    applyZoom(currentZoomRef.current - ZOOM_STEP, anchor.x, anchor.y, true)
  }, [applyZoom])

  const zoomReset = useCallback(() => {
    const container = scrollContainerRef.current
    currentZoomRef.current = 1
    setTransitionEnabled(true)
    setCurrentZoom(1)
    if (container) {
      requestAnimationFrame(() => {
        container.scrollLeft = 0
        container.scrollTop = 0
      })
    }
  }, [])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const container = scrollContainerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const anchorX = e.clientX - rect.left
      const anchorY = e.clientY - rect.top
      const target = currentZoomRef.current > 1 ? 1 : 2
      applyZoom(target, anchorX, anchorY, true)
    },
    [applyZoom]
  )
```

- [ ] **Step 6: Reemplazar handleWheel con coalesce + exponencial**

Reemplazar el useEffect del wheel (L244-258):

```tsx
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const ZOOM_SENSITIVITY = 0.0015

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      anchorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      pendingDeltaRef.current += e.deltaY
      if (rafScheduledRef.current) return
      rafScheduledRef.current = true
      requestAnimationFrame(() => {
        const factor = Math.exp(-pendingDeltaRef.current * ZOOM_SENSITIVITY)
        applyZoom(
          currentZoomRef.current * factor,
          anchorRef.current.x,
          anchorRef.current.y,
          false
        )
        pendingDeltaRef.current = 0
        rafScheduledRef.current = false
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [applyZoom])
```

- [ ] **Step 7: Reescribir touch handlers con anchor en midpoint + supresión swipe post-pinch**

Reemplazar `handleTouchStart/Move/End` (L266-309):

```tsx
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchStartDistance.current = Math.hypot(dx, dy)
      pinchStartZoom.current = currentZoomRef.current
    } else if (e.touches.length === 1) {
      isPinching.current = false
      touchStartX.current = e.touches[0].clientX
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    const container = scrollContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const distance = Math.hypot(dx, dy)
    if (pinchStartDistance.current <= 0) return
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
    const scale = distance / pinchStartDistance.current
    applyZoom(pinchStartZoom.current * scale, midX, midY, false)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching.current) {
      isPinching.current = false
      lastPinchEndedAtRef.current = Date.now()
      return
    }
    // Suprimir swipe durante 150ms tras terminar un pinch
    if (Date.now() - lastPinchEndedAtRef.current < 150) return
    if (currentZoomRef.current > 1) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
  }
```

- [ ] **Step 8: Actualizar el markup para usar sizer + transform**

Reemplazar la estructura de scroll/book container (L382-604) para introducir sizer.

El cambio clave: el div con `aspectRatio` y `width: zoomedWidth` deja de crecer. En vez, un wrapper "sizer" crece a `baseWidth * zoom` y el bookContainer mantiene `baseWidth` pero con `transform: scale(zoom)` y `transform-origin: 0 0`.

Reemplazar desde `<div ref={scrollContainerRef} className='flex-1 overflow-auto'>` (L382) hasta el cierre de su hijo directo (L604):

```tsx
      <div
        ref={scrollContainerRef}
        className='flex-1 overflow-auto'
      >
        <div
          className='flex items-center justify-center p-4'
          style={{
            minHeight: '100%',
            minWidth: isZoomed ? 'fit-content' : '100%'
          }}
        >
          {isZoomed && baseWidth > 0 ? (
            <div
              style={{
                width: baseWidth * currentZoom,
                height: (baseWidth / spreadAspectRatio) * currentZoom,
                position: 'relative'
              }}
            >
              <div
                ref={containerRef}
                className='select-none absolute top-0 left-0'
                style={{
                  width: baseWidth,
                  aspectRatio: `${spreadAspectRatio} / 1`,
                  transform: `scale(${currentZoom})`,
                  transformOrigin: '0 0',
                  transition: transitionEnabled ? 'transform 0.2s ease' : 'none',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                onTransitionEnd={() => setTransitionEnabled(false)}
              >
                {/* BOOK INNER HERE */}
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              className='relative select-none w-full max-w-7xl'
              style={{
                aspectRatio: `${spreadAspectRatio} / 1`
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
            >
              {/* BOOK INNER HERE */}
            </div>
          )}
        </div>
      </div>
```

**IMPORTANTE:** donde dice `{/* BOOK INNER HERE */}` copiar íntegro el contenido original desde `<div className='relative w-full h-full' style={{ perspective: '2000px' }}>` hasta su cierre correspondiente (el bloque de pages + FlipPage + navigation hints). Para evitar duplicar literalmente el JSX enorme, extraer a un componente interno `BookSpread` antes del return que encapsule todo ese subárbol y recibe props.

- [ ] **Step 9: Extraer `BookSpread` para evitar duplicación**

Antes del `return` del componente principal, crear el subárbol como una función que reciba todo lo necesario como closure. O preferiblemente, extraer a una variable JSX:

```tsx
  const bookInner = (
    <div
      className='relative w-full h-full'
      style={{ perspective: '2000px' }}
    >
      {/* …todo el contenido original desde L406 hasta L601… */}
    </div>
  )
```

Luego usar `{bookInner}` en ambas ramas del ternario.

- [ ] **Step 10: Typecheck + lint**

```bash
pnpm exec tsc --noEmit
pnpm exec eslint components/flipbook/FlipBookViewer.tsx
```

- [ ] **Step 11: Commit**

```bash
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Rework zoom: transform-based, zoom-to-cursor, coalesced wheel"
```

### Task 3.2: Reset scroll al cambiar de spread

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Al inicio de `goToSpread`, resetear scroll**

En [goToSpread L170-210](../../../components/flipbook/FlipBookViewer.tsx#L170-L210), tras `setCurrentZoom(1)` (L177):

```tsx
      // Reset zoom before flipping
      currentZoomRef.current = 1
      setCurrentZoom(1)
      const container = scrollContainerRef.current
      if (container) {
        container.scrollLeft = 0
        container.scrollTop = 0
      }
```

- [ ] **Step 2: Commit**

```bash
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Reset scroll position on spread change"
```

---

## Fase 4 — UX mejoras

Objetivos: navegador de páginas para libros grandes, modo móvil single-page, prefers-reduced-motion, hints clicables, autoFlip con loop.

### Task 4.1: Input "ir a página" en FlipControls

**Files:**
- Modify: `components/flipbook/FlipControls.tsx`
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Añadir `onJumpToSpread` a FlipBookViewer y FlipControls**

En FlipBookViewer, añadir función:

```tsx
  const jumpToSpread = useCallback(
    (target: number) => {
      if (isAnimating) return
      const clamped = Math.max(0, Math.min(totalSpreads - 1, target))
      if (clamped === currentSpread) return
      currentZoomRef.current = 1
      setCurrentZoom(1)
      setCurrentSpread(clamped)
      const newLeftPageIndex = clamped === 0 ? 0 : (clamped - 1) * 2 + 1
      onPageChange?.(newLeftPageIndex)
    },
    [isAnimating, totalSpreads, currentSpread, onPageChange]
  )
```

Pasarla a `FlipControls`:

```tsx
        <FlipControls
          currentSpread={currentSpread}
          totalPages={totalPages}
          totalSpreads={totalSpreads}
          onPrev={goToPrev}
          onNext={goToNext}
          onJumpToSpread={jumpToSpread}
          isAnimating={isAnimating}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          currentZoom={currentZoom}
        />
```

- [ ] **Step 2: Añadir input en FlipControls para libros > 10 spreads**

En `FlipControlsProps` añadir:

```tsx
  onJumpToSpread?: (target: number) => void
```

En el JSX, reemplazar el bloque del contador de página (L75-109). Si `totalSpreads > 10` mostrar input editable; si no, mantener dots.

```tsx
      {/* Page indicator */}
      <div className='flex items-center gap-4'>
        {totalSpreads <= 10 ? (
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
            onJumpToSpread={onJumpToSpread}
          />
        )}

        <div className='text-white/70 text-sm font-medium min-w-[80px] text-center'>
          <span className='text-white'>
            {isCoverSpread
              ? '1'
              : hasLeftPage && hasRightPage
                ? `${leftPageNum}-${rightPageNum}`
                : hasLeftPage
                  ? leftPageNum
                  : rightPageNum}
          </span>
          <span className='mx-1'>/</span>
          <span>{totalPages}</span>
        </div>
      </div>
```

Y añadir el componente `PageJumpInput` al final del archivo:

```tsx
function PageJumpInput({
  currentSpread,
  totalSpreads,
  totalPages,
  onJumpToSpread
}: {
  currentSpread: number
  totalSpreads: number
  totalPages: number
  onJumpToSpread?: (target: number) => void
}) {
  // El usuario piensa en página, no en spread. Convertimos de página -> spread.
  // Página 1 = spread 0, página 2 = spread 1 izquierda, página 3 = spread 1 derecha.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('page') as HTMLInputElement
    const n = parseInt(input.value, 10)
    if (!Number.isFinite(n) || n < 1) return
    const page = Math.min(totalPages, n)
    const targetSpread = page <= 1 ? 0 : Math.ceil((page - 1) / 2)
    onJumpToSpread?.(Math.min(totalSpreads - 1, targetSpread))
    input.blur()
  }

  const coverPage = currentSpread === 0 ? 1 : (currentSpread - 1) * 2 + 2

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2'>
      <label className='sr-only' htmlFor='page-jump'>Go to page</label>
      <input
        id='page-jump'
        name='page'
        type='number'
        min={1}
        max={totalPages}
        defaultValue={coverPage}
        key={currentSpread}
        className='w-14 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:border-[#16a34a]'
      />
      <button
        type='submit'
        className='text-xs text-white/70 hover:text-white transition-colors'
      >
        Ir
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipControls.tsx components/flipbook/FlipBookViewer.tsx
git commit -m "Add go-to-page input for books with more than 10 spreads"
```

### Task 4.2: Modo móvil single-page

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Detectar viewport móvil con matchMedia**

Tras los states/refs de zoom, añadir:

```tsx
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
```

- [ ] **Step 2: Recalcular `totalSpreads` y tripletas de índices cuando `isMobile`**

Cambiar:

```tsx
  const totalSpreads = 1 + Math.ceil((totalPages - 1) / 2)
```

Por:

```tsx
  const pagesPerSpread = isMobile ? 1 : 2
  const totalSpreads =
    pagesPerSpread === 1 ? totalPages : 1 + Math.ceil((totalPages - 1) / 2)

  const isCoverSpread = currentSpread === 0

  const leftPageIndex =
    pagesPerSpread === 1
      ? -1
      : isCoverSpread
        ? -1
        : (currentSpread - 1) * 2 + 1

  const rightPageIndex =
    pagesPerSpread === 1
      ? currentSpread
      : isCoverSpread
        ? 0
        : (currentSpread - 1) * 2 + 2

  const hasLeftPage = leftPageIndex >= 0 && leftPageIndex < totalPages
  const hasRightPage = rightPageIndex < totalPages
```

- [ ] **Step 3: Ajustar aspect ratio cuando `isMobile`**

```tsx
  const spreadAspectRatio = isMobile ? pageAspectRatio : pageAspectRatio * 2
```

- [ ] **Step 4: Ajustar cálculo de `nextSpread*`, `prevSpread*` para single-page**

En el bloque L341-350:

```tsx
  const nextSpread = currentSpread + 1
  const prevSpread = currentSpread - 1

  const spreadToLeftIndex = (s: number) => {
    if (pagesPerSpread === 1) return -1
    if (s <= 0) return -1
    return (s - 1) * 2 + 1
  }
  const spreadToRightIndex = (s: number) => {
    if (pagesPerSpread === 1) return s
    if (s === 0) return 0
    return (s - 1) * 2 + 2
  }

  const nextSpreadLeftIndex = spreadToLeftIndex(nextSpread)
  const nextSpreadRightIndex = spreadToRightIndex(nextSpread)
  const prevSpreadLeftIndex = spreadToLeftIndex(prevSpread)
  const prevSpreadRightIndex = spreadToRightIndex(prevSpread)
```

- [ ] **Step 5: Commit**

```bash
pnpm exec tsc --noEmit
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Add single-page mode on mobile viewport"
```

### Task 4.3: Respetar prefers-reduced-motion

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Detectar y deshabilitar animación de flip**

Tras el detector de isMobile, añadir:

```tsx
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
```

En `goToSpread`, si `prefersReducedMotion`, saltar a animación instantánea:

```tsx
      if (prefersReducedMotion) {
        const newSpread =
          direction === 'next' ? currentSpread + 1 : currentSpread - 1
        setCurrentSpread(newSpread)
        const newLeftPageIndex =
          newSpread === 0 ? 0 : (newSpread - 1) * 2 + 1
        onPageChange?.(newLeftPageIndex)
        return
      }

      setIsAnimating(true)
```

Y añadir `prefersReducedMotion` a las deps de `goToSpread`.

- [ ] **Step 2: Commit**

```bash
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Respect prefers-reduced-motion: skip flip animation"
```

### Task 4.4: Hints de navegación clicables

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Convertir hints en botones**

Reemplazar [L566-600](../../../components/flipbook/FlipBookViewer.tsx#L566-L600):

```tsx
              {currentSpread > 0 && (
                <button
                  type='button'
                  onClick={goToPrev}
                  className='absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors'
                  aria-label='Previous spread'
                >
                  <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
              )}
              {currentSpread < totalSpreads - 1 && (
                <button
                  type='button'
                  onClick={goToNext}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors'
                  aria-label='Next spread'
                >
                  <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </button>
              )}
```

- [ ] **Step 2: Commit**

```bash
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Make navigation hints clickable"
```

### Task 4.5: Keyboard espacio solo cuando el visor tiene foco

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Filtrar eventos de teclado fuera del visor**

Reemplazar el `useEffect` de keyboard (L216-229) por:

```tsx
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === ' ') {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          e.preventDefault()
          goToNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])
```

- [ ] **Step 2: Commit**

```bash
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Skip keyboard nav when typing in inputs; space only if viewer visible"
```

### Task 4.6: Auto-flip con loop

**Files:**
- Modify: `components/flipbook/FlipBookViewer.tsx`

- [ ] **Step 1: Al final, volver al primero**

Reemplazar useEffect de autoFlip (L232-241):

```tsx
  useEffect(() => {
    if (autoFlipSeconds <= 0 || isAnimating) return
    const timer = setTimeout(() => {
      if (currentSpread < totalSpreads - 1) {
        goToNext()
      } else {
        setCurrentSpread(0)
        onPageChange?.(0)
      }
    }, autoFlipSeconds * 1000)
    return () => clearTimeout(timer)
  }, [autoFlipSeconds, currentSpread, totalSpreads, goToNext, isAnimating, onPageChange])
```

- [ ] **Step 2: Commit**

```bash
git add components/flipbook/FlipBookViewer.tsx
git commit -m "Loop auto-flip back to first spread instead of stopping"
```

---

## Fase 5 — Verificación manual end-to-end

### Task 5.1: Arrancar el dev server y testear en navegador

- [ ] **Step 1: Levantar dev server**

```bash
cd /Users/vicentebarberatormo/Developer/VIBATO/flipbook
pnpm dev
```

- [ ] **Step 2: Matriz manual**

Abrir un flipbook existente en el navegador y verificar:

| Caso | Pasa si |
|---|---|
| Libro A4 retrato | No hay letterbox enorme; el contenedor tiene ratio real |
| Libro paisaje | Se ve correctamente también |
| Wheel + Ctrl/⌘ sobre una imagen | Zoom progresivo; punto bajo cursor estable |
| Pinch trackpad macOS | Suave, sin saltos |
| Pinch móvil | Anchor al midpoint |
| Botones +/− | Zoom animado centrado |
| Reset | Vuelve a 1x y scroll 0,0 |
| Flip en zoom > 1 | Resetea zoom y scroll |
| Flechas teclado | Navega. Tab a un input no navega |
| Espacio teclado | Avanza (o scrollea si viewer fuera de viewport) |
| Move al último con autoFlip | Vuelve al primero |
| Libro en `processing` | Muestra fallback amable, no 404 |
| Libro en `error` | Muestra error + link a /create |
| Móvil (≤640px) | Single-page mode |
| prefers-reduced-motion | No hay animación 3D |
| Página jump (libro 20 spreads) | Input aparece y funciona |
| Imagen falla + retry | Botón visible; reintento dispara nueva carga |

- [ ] **Step 3: Si todo verde, merge plan**

Revisar `git log --oneline`, dejar branch `improvements-01` lista para PR.

---

## Notas finales

- **Out of scope**: compresión PDF (3-pass re-encode), deduplicación de analytics visitas, opción de watermark por plan — están en la auditoría como P2 pero no se tocan en este plan para mantenerlo acotado.
- **Sin migration DB**: el aspect ratio se guarda en `settings` (jsonb), que ya existe.
- **No hay tests automatizados** para el viewer (confirmado en la spec). Verificación es manual.
