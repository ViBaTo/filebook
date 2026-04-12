# FlipBookViewer — Zoom Rework Design

**Date:** 2026-04-12
**Scope:** Rework the zoom implementation in `components/flipbook/FlipBookViewer.tsx` to fix laggy, imprecise behavior on wheel, pinch, and button inputs.
**Target file:** [components/flipbook/FlipBookViewer.tsx](../../../components/flipbook/FlipBookViewer.tsx)

## Problem

The current zoom implementation has multiple compounding issues that produce a laggy, unpredictable feel:

1. **Zoom changes DOM `width`** ([L396–400](../../../components/flipbook/FlipBookViewer.tsx#L396-L400)) — forces reflow of the entire subtree on every tick (images with `fill`, 3D perspective, aspect-ratio), instead of using GPU-compositable `transform`.
2. **`transition: width 0.3s ease`** ([L399](../../../components/flipbook/FlipBookViewer.tsx#L399)) runs during continuous wheel/pinch — each new event overrides the previous transition, producing a rubbery feel.
3. **Forced recentering on every zoom change** ([L84–93](../../../components/flipbook/FlipBookViewer.tsx#L84-L93)) — every wheel tick fires a `scrollTo({ behavior: 'smooth' })`, stacking dozens of competing smooth scrolls. User scroll is also reset every tick.
4. **No zoom-toward-cursor** — always recenters, so the point under the cursor drifts away. Biggest subjective UX problem.
5. **Linear `deltaY * 0.01`** ([L251](../../../components/flipbook/FlipBookViewer.tsx#L251)) — macOS trackpad pinches emit large discrete deltas, producing jumpy steps; sensation is the same at 1x and 3x (should be perceptually uniform).
6. **Fixed `aspectRatio: 2.8/1`** combined with `object-contain` — real image scaling is dampened by letterboxing.
7. **`baseWidth` only measured at zoom ≤ 1** ([L72–81](../../../components/flipbook/FlipBookViewer.tsx#L72-L81)) — stale if window resizes while zoomed.
8. **Upscaling blur** at 3x — PDF pages rasterize at `scale: 2` ([lib/pdf/renderer.ts:80](../../../lib/pdf/renderer.ts#L80)), so 3x zoom is ~1.5x beyond native. Acceptable with correct `image-rendering` hints.

## Goals

- Zoom at 60 fps regardless of input device.
- The point under the cursor / pinch midpoint stays fixed during zoom (within ~5 px).
- User can freely scroll at zoom > 1 without being auto-recentered.
- Discrete button/double-click interactions feel smooth (animated); continuous wheel/pinch feel direct (no transition lag).
- Preserve all existing flip-book semantics: aspect ratio, 3D flip animation, page preloading, swipe navigation when zoom = 1.

## Non-goals

- Rewriting flip animation.
- Changing image pipeline / rasterization resolution.
- Adding a separate "fit to width" mode.
- Page-level zoom (always zooms the full spread).

## Architecture

### Structure change

Current single element uses dynamic `width` inside `overflow-auto`. New structure introduces a sizer wrapper so transform-based scaling produces proper scroll extents:

```
scrollContainer  (overflow-auto, ref=scrollContainerRef)
 └── sizer       (width = baseW * zoom, height = baseH * zoom)
      └── bookContainer  (width = baseW, transform: scale(zoom), transform-origin: 0 0)
           └── ...spread / FlipPage / pages (unchanged)
```

Rationale:
- `transform` does not affect parent layout, so the sizer provides the scroll extents the browser needs.
- `transform-origin: 0 0` keeps the zoom math simple (content coords align with transform input).
- `bookContainer`'s internal layout (width × aspect-ratio) is unchanged; only its visual scale changes.
- `willChange: transform` applied during active interaction only (tracked by a ref flag).

**Zoom = 1 fallback:** when `zoom === 1`, the sizer collapses to `width: 100%` (no explicit dims), `bookContainer` keeps its current responsive classes (`w-full max-w-7xl`) and no `transform` is applied. The outer flex (`flex items-center justify-center`) handles centering as today. The sizer/transform path activates only when `zoom > 1`.

### Sizer height

CSS `aspect-ratio` on the `bookContainer` is retained for its own layout. The sizer needs an **explicit height** because transforms don't affect layout:

```ts
sizer.width  = baseWidth * zoom
sizer.height = (baseWidth / 2.8) * zoom
```

When `zoom === 1`, the sizer falls back to responsive layout (`w-full max-w-7xl`) with no explicit dimensions — as today.

### `baseWidth` measurement

Replace the `window.resize` listener with a `ResizeObserver` on `scrollContainerRef`. Chosen approach: keep `bookContainer` sized by CSS (`w-full max-w-7xl`) at zoom 1x and read its `offsetWidth` via `containerRef`. Cache in `baseWidth` state. The observer re-measures whenever the scroll container resizes **and** `currentZoomRef.current === 1` (skip re-measurement while zoomed to avoid feedback loops). When zoomed, `baseWidth` is last known good — sufficient for continued interaction; on reset to 1x the next observer tick will refresh it.

## Zoom-to-point

Single helper applies zoom and scroll atomically:

```ts
function applyZoom(newZoom: number, anchorX: number, anchorY: number) {
  const container = scrollContainerRef.current
  if (!container) return
  const oldZoom = currentZoomRef.current  // read from ref, not state
  const clamped = clampZoom(newZoom)
  if (clamped === oldZoom) return

  // anchor is in scrollContainer viewport coords (0,0 = top-left of viewport)
  const contentX = container.scrollLeft + anchorX
  const contentY = container.scrollTop + anchorY
  const k = clamped / oldZoom

  currentZoomRef.current = clamped
  setCurrentZoom(clamped)  // triggers re-render with new transform/sizer dims

  // Scroll must be adjusted *after* the sizer grows. Use a single rAF:
  requestAnimationFrame(() => {
    container.scrollLeft = contentX * k - anchorX
    container.scrollTop  = contentY * k - anchorY
  })
}
```

Using `currentZoomRef` avoids stale closure values when multiple rapid events fire before React re-renders.

### Anchor points per input

| Input | Anchor (X, Y) |
|---|---|
| Wheel + Ctrl/⌘ | `e.clientX - rect.left`, `e.clientY - rect.top` |
| Pinch (touch) | midpoint of 2 touches, relative to container rect |
| Double-click | `e.clientX/Y` relative to container rect |
| Buttons +/− / reset | center: `container.clientWidth/2`, `container.clientHeight/2` |

## Input handling

### Wheel / trackpad

Switch to exponential (multiplicative) scaling — perceptually uniform across zoom levels:

```ts
const ZOOM_SENSITIVITY = 0.0015
const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY)
const newZoom = clampZoom(currentZoomRef.current * factor)
```

Coalesce events per animation frame using a deltaY accumulator + `rAF` guard:

```ts
const pendingDelta = useRef(0)
const rafScheduled = useRef(false)

handleWheel = (e) => {
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  pendingDelta.current += e.deltaY
  anchorX.current = e.clientX - rect.left
  anchorY.current = e.clientY - rect.top
  if (!rafScheduled.current) {
    rafScheduled.current = true
    requestAnimationFrame(() => {
      const factor = Math.exp(-pendingDelta.current * ZOOM_SENSITIVITY)
      applyZoom(currentZoomRef.current * factor, anchorX.current, anchorY.current)
      pendingDelta.current = 0
      rafScheduled.current = false
    })
  }
}
```

### Pinch (touch)

Use the standard "start distance / current distance → scale factor" approach but anchored to midpoint:

```ts
onTouchMove(e):
  if (e.touches.length === 2):
    const midX = (t0.clientX + t1.clientX)/2 - rect.left
    const midY = (t0.clientY + t1.clientY)/2 - rect.top
    const dist = hypot(t0 - t1)
    const scale = dist / pinchStartDistance
    applyZoom(pinchStartZoom * scale, midX, midY)
```

The midpoint is recalculated each move (fingers drift during pinch).

**Suppress swipe-to-navigate** while pinching and for 150 ms after lifting. Track `lastPinchEndedAt` ref.

### Buttons / double-click

- `zoomIn`/`zoomOut`: discrete steps (1, 1.5, 2, 2.5, 3), anchor = viewport center.
- `zoomReset`: go to 1 and set `scrollLeft = scrollTop = 0`.
- Double-click: toggle 1x ↔ 2x, anchor = click point.
- Apply CSS `transition: transform 0.2s ease` to `bookContainer` **only** for these discrete actions. Implemented via a `transitionEnabled` state (boolean): set to `true` immediately before the `setCurrentZoom` call in button/double-click handlers, then cleared to `false` on the `bookContainer`'s `transitionend` event. Wheel/pinch handlers never set it, so the transition stays disabled for continuous input.

### Reset on page flip

Keep `setCurrentZoom(1)` at the start of `goToSpread` ([L177](../../../components/flipbook/FlipBookViewer.tsx#L177)), and additionally reset `scrollLeft = scrollTop = 0` imperatively in the same tick.

## Sharpness

- Explicit `image-rendering: auto` on the image wrappers (defensive — some legacy mobile browsers default to `optimizeSpeed`).
- `transform: translateZ(0)` + `backfaceVisibility: hidden` on `bookContainer` to force a dedicated GPU layer. Also benefits the existing flip-3D animation.
- No change to `NextImage unoptimized` / `sizes='50vw'` — zoom is purely visual, so `sizes` still reflects layout width.

## Removed / replaced code

- Delete the `useEffect` that recenters on zoom change ([L84–93](../../../components/flipbook/FlipBookViewer.tsx#L84-L93)).
- Replace the `window.resize` listener with a `ResizeObserver` ([L72–81](../../../components/flipbook/FlipBookViewer.tsx#L72-L81)).
- Remove `transition: width 0.3s ease` ([L399](../../../components/flipbook/FlipBookViewer.tsx#L399)).
- Replace the wheel handler ([L244–258](../../../components/flipbook/FlipBookViewer.tsx#L244-L258)) with the coalesced exponential version.
- Rewrite `handleTouchMove` / `handleTouchEnd` ([L280–309](../../../components/flipbook/FlipBookViewer.tsx#L280-L309)) to anchor pinch and suppress post-pinch swipe.
- Rewrite `zoomIn`/`zoomOut`/`handleDoubleClick` to go through `applyZoom`.

## State & refs summary

| Name | Type | Purpose |
|---|---|---|
| `currentZoom` | state `number` | Triggers re-render, source of truth for UI |
| `currentZoomRef` | ref `number` | Synchronous reads during rapid input events |
| `baseWidth` | state `number` | Intrinsic book width at zoom 1x |
| `pendingDelta` | ref `number` | Accumulated wheel delta within a frame |
| `rafScheduled` | ref `boolean` | Prevents scheduling multiple rAFs per frame |
| `pinchStartDistance` | ref `number` | (unchanged) |
| `pinchStartZoom` | ref `number` | (unchanged) |
| `isPinching` | ref `boolean` | (unchanged) |
| `lastPinchEndedAt` | ref `number` | Epoch ms, gate swipe for 150 ms after pinch |
| `transitionEnabled` | state `boolean` | Enables CSS transition for discrete zoom actions |

## Testing & verification

No automated tests exist for the viewer; verification is manual.

### Test matrix

| Input | Expected |
|---|---|
| Wheel + Ctrl/⌘ on an image | Progressive zoom; point under cursor stays within ~5 px |
| macOS trackpad pinch | Same as wheel, no jumps |
| Mobile touch pinch | Midpoint stays fixed |
| Double-click | Toggles 1x ↔ 2x anchored on click |
| Buttons +/− | Centered zoom, step 0.5 |
| Reset | Back to 1x, scroll at 0,0 |
| Swipe at zoom > 1 | Ignored (unchanged) |
| Flip at zoom > 1 | Zoom resets, normal navigation |
| Window resize during zoom | No desync on return to 1x |
| Right-click / text selection | Does not trigger double-click zoom |

### Edge cases

- Exactly zoom = 1 → responsive layout (`max-w-7xl`), no fixed width/sizer.
- `baseWidth === 0` on first render → no transform applied until `ResizeObserver` fires.
- `touchmove` with 1 finger after lifting one finger of a pinch → not treated as swipe.
- Fast wheel events → coalesced via rAF accumulator.

### Performance

- Chrome DevTools Performance: 5 s of continuous pinch 1x↔3x shows no layout/paint (red) frames, only composite.
- No React warnings about updates outside render phase.

### Acceptance criteria

1. Point under cursor/pinch midpoint drifts ≤ 5 px during any zoom gesture.
2. No visible stutter during continuous pinch 1x→3x→1x.
3. Free scrolling at zoom > 1 is not auto-recentered.
4. On spread change, zoom returns to 1x and scroll to origin.

## Out-of-scope notes

- Cleaning up `.cursor/debug*.log` files visible in `git status` — unrelated.
- PDF rasterization resolution — governed by [lib/pdf/renderer.ts](../../../lib/pdf/renderer.ts) and out of scope for this change.
