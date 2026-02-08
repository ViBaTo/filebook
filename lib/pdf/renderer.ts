'use client'

import * as pdfjsLib from 'pdfjs-dist'

// Set up the worker - use local copy from public/
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

export interface RenderProgress {
  currentPage: number
  totalPages: number
  status: 'loading' | 'rendering' | 'complete'
}

export interface RenderedPage {
  pageNumber: number
  blob: Blob
  width: number
  height: number
}

export interface PDFInfo {
  pageCount: number
  width: number
  height: number
}

// Common document loading options for proper font/cMap/WASM rendering
const getDocumentOptions = (data: ArrayBuffer) => ({
  data,
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/standard_fonts/',
  wasmUrl: '/wasm/',
})

export async function getPDFInfo(pdfData: ArrayBuffer): Promise<PDFInfo> {
  const pdf = await pdfjsLib.getDocument(getDocumentOptions(pdfData)).promise
  const firstPage = await pdf.getPage(1)
  const viewport = firstPage.getViewport({ scale: 1 })

  return {
    pageCount: pdf.numPages,
    width: viewport.width,
    height: viewport.height
  }
}

// Check if a canvas is mostly blank (white) by sampling pixels
function isCanvasBlank(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  // Sample 20 points spread across the canvas
  const samplePoints = [
    [0.25, 0.25], [0.5, 0.25], [0.75, 0.25],
    [0.25, 0.5],  [0.5, 0.5],  [0.75, 0.5],
    [0.25, 0.75], [0.5, 0.75], [0.75, 0.75],
    [0.1, 0.1],   [0.9, 0.9],  [0.1, 0.9],
    [0.9, 0.1],   [0.3, 0.6],  [0.6, 0.3],
    [0.4, 0.8],   [0.8, 0.4],  [0.2, 0.35],
    [0.65, 0.65], [0.45, 0.15],
  ]

  let nonWhiteCount = 0
  for (const [rx, ry] of samplePoints) {
    const x = Math.floor(rx * width)
    const y = Math.floor(ry * height)
    const pixel = context.getImageData(x, y, 1, 1).data
    // Check if pixel is NOT white/near-white (allow threshold of 250)
    if (pixel[0] < 250 || pixel[1] < 250 || pixel[2] < 250) {
      nonWhiteCount++
    }
  }
  // If fewer than 2 non-white samples, consider it blank
  return nonWhiteCount < 2
}

export async function renderPDFToImages(
  pdfData: ArrayBuffer,
  onProgress?: (progress: RenderProgress) => void,
  scale: number = 2, // 2x for retina
  quality: number = 0.85 // WebP quality (0-1)
): Promise<RenderedPage[]> {
  const pdf = await pdfjsLib.getDocument(getDocumentOptions(pdfData)).promise
  const totalPages = pdf.numPages
  const renderedPages: RenderedPage[] = []

  // Get optional content config with 'any' intent to show ALL layers
  const allLayersConfig = pdf.getOptionalContentConfig({ intent: 'any' })

  onProgress?.({ currentPage: 0, totalPages, status: 'loading' })

  // Rendering strategies to try in order
  const renderStrategies = [
    { intent: 'display' as const, label: 'display' },
    { intent: 'print' as const, label: 'print' },
    { intent: 'any' as const, label: 'any-with-all-layers', useAllLayers: true },
  ]

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({ currentPage: pageNum, totalPages, status: 'rendering' })

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    let finalCanvas: HTMLCanvasElement | null = null
    let finalContext: CanvasRenderingContext2D | null = null

    for (const strategy of renderStrategies) {
      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height

      // Build render params
      const renderParams: Record<string, unknown> = {
        canvasContext: context,
        viewport: viewport,
        intent: strategy.intent,
      }

      // For 'any-with-all-layers' strategy, use the all-layers config
      if (strategy.useAllLayers) {
        renderParams.optionalContentConfigPromise = allLayersConfig
      }

      // Render page to canvas
      await page.render(renderParams as Parameters<typeof page.render>[0]).promise

      finalCanvas = canvas
      finalContext = context

      // Check if the canvas has content (not blank)
      if (!isCanvasBlank(context, canvas.width, canvas.height)) {
        break // This strategy produced content, use it
      }
    }

    // Convert to WebP blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      finalCanvas!.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Failed to create blob'))
        },
        'image/webp',
        quality
      )
    })

    renderedPages.push({
      pageNumber: pageNum,
      blob,
      width: viewport.width,
      height: viewport.height
    })
  }

  onProgress?.({ currentPage: totalPages, totalPages, status: 'complete' })

  return renderedPages
}

export async function loadPDFFromUrl(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`)
  }
  return response.arrayBuffer()
}

export async function loadPDFFromFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
