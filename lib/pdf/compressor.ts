'use client'

import { PDFDocument } from 'pdf-lib'

export type CompressionQuality = 'low' | 'medium' | 'optimal'

export interface CompressionConfig {
  /** Target file size range in bytes [min, max] */
  targetBytes: [number, number]
  /** Canvas scale for rendering pages (higher = sharper source for JPEG) */
  canvasScale: number
  /** Scale used for flipbook WebP rendering */
  renderScale: number
  /** WebP quality used for flipbook rendering */
  webpQuality: number
  targetLabel: string
  label: string
  description: string
}

const MB = 1024 * 1024

export const COMPRESSION_CONFIGS: Record<CompressionQuality, CompressionConfig> = {
  low: {
    targetBytes: [20 * MB, 30 * MB],
    canvasScale: 1.5,
    renderScale: 1.0,
    webpQuality: 0.60,
    targetLabel: '20-30 MB',
    label: 'Baja',
    description: 'Menor tamaño, calidad reducida',
  },
  medium: {
    targetBytes: [30 * MB, 40 * MB],
    canvasScale: 1.5,
    renderScale: 1.5,
    webpQuality: 0.75,
    targetLabel: '30-40 MB',
    label: 'Media',
    description: 'Equilibrio entre tamaño y calidad',
  },
  optimal: {
    targetBytes: [40 * MB, 50 * MB],
    canvasScale: 2.0,
    renderScale: 2.0,
    webpQuality: 0.85,
    targetLabel: '40-50 MB',
    label: 'Óptima',
    description: 'Mejor calidad, tamaño mayor',
  },
}

export interface CompressionProgress {
  currentPage: number
  totalPages: number
  phase: 'rendering' | 'calibrating' | 'building' | 'complete'
}

// Common document loading options for proper font/cMap/WASM rendering
const getDocumentOptions = (data: ArrayBuffer) => ({
  data,
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/standard_fonts/',
  wasmUrl: '/wasm/',
})

/**
 * Convert a canvas to a JPEG blob at the given quality.
 */
function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b)
        else reject(new Error('Failed to create JPEG blob'))
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Binary-search for the JPEG quality that makes a single page's JPEG
 * approximately equal to `targetSizeBytes`.
 * Returns the quality value (0.0 – 1.0).
 */
async function findJpegQualityForTargetSize(
  canvas: HTMLCanvasElement,
  targetSizeBytes: number,
  iterations: number = 10
): Promise<number> {
  let low = 0.05
  let high = 1.0
  let bestQuality = 0.5

  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2
    const blob = await canvasToJpegBlob(canvas, mid)

    if (blob.size < targetSizeBytes) {
      low = mid  // Need higher quality → bigger file
    } else {
      high = mid // Need lower quality → smaller file
    }
    bestQuality = mid
  }

  return bestQuality
}

/**
 * Compress a PDF file by re-rendering pages at reduced quality and
 * rebuilding the PDF with JPEG images using pdf-lib.
 *
 * Uses adaptive JPEG quality: binary-searches on a sample page to find
 * the quality that produces the target total file size, then applies
 * that quality to every page.
 */
export async function compressPDF(
  file: File,
  quality: CompressionQuality,
  onProgress?: (progress: CompressionProgress) => void
): Promise<File> {
  const config = COMPRESSION_CONFIGS[quality]
  const [targetMin, targetMax] = config.targetBytes
  const targetMid = (targetMin + targetMax) / 2

  // Dynamically import pdfjs-dist to avoid SSR issues (DOMMatrix not defined)
  const pdfjsLib = await import('pdfjs-dist')
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }

  // 1. Read the file into an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // 2. Load PDF with pdfjs-dist
  const pdf = await pdfjsLib.getDocument(getDocumentOptions(arrayBuffer)).promise
  const totalPages = pdf.numPages

  onProgress?.({ currentPage: 0, totalPages, phase: 'rendering' })

  // 3. Render all pages to canvases
  const canvases: HTMLCanvasElement[] = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({ currentPage: pageNum, totalPages, phase: 'rendering' })

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: config.canvasScale })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height

    // Fill with white background first
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({
      canvasContext: context,
      viewport: viewport,
      intent: 'display',
    } as Parameters<typeof page.render>[0]).promise

    canvases.push(canvas)
  }

  // 4. Calibrate: find the JPEG quality that will produce the target total size
  onProgress?.({ currentPage: 0, totalPages, phase: 'calibrating' })

  // Estimate PDF overhead per page (~1-2 KB for page objects, xref, etc.)
  const pdfOverheadPerPage = 2048
  const pdfBaseOverhead = 4096
  const totalOverhead = pdfBaseOverhead + pdfOverheadPerPage * totalPages
  const targetImageBytes = targetMid - totalOverhead
  const targetPerPage = targetImageBytes / totalPages

  // Use up to 3 sample pages spread across the document to get a representative quality
  const sampleIndices: number[] = []
  if (totalPages <= 3) {
    for (let i = 0; i < totalPages; i++) sampleIndices.push(i)
  } else {
    sampleIndices.push(0) // first page
    sampleIndices.push(Math.floor(totalPages / 2)) // middle page
    sampleIndices.push(totalPages - 1) // last page
  }

  let qualitySum = 0
  for (const idx of sampleIndices) {
    const q = await findJpegQualityForTargetSize(canvases[idx], targetPerPage)
    qualitySum += q
  }
  let jpegQuality = qualitySum / sampleIndices.length

  // Clamp quality to reasonable bounds
  jpegQuality = Math.max(0.05, Math.min(1.0, jpegQuality))

  // 5. Build the PDF with the calibrated quality
  //    We may need up to 2 passes if the first result is outside the target range
  let compressedFile: File | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const newPdfDoc = await PDFDocument.create()

    for (let i = 0; i < totalPages; i++) {
      onProgress?.({ currentPage: i + 1, totalPages, phase: 'building' })

      const canvas = canvases[i]
      const jpegBlob = await canvasToJpegBlob(canvas, jpegQuality)
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer())
      const jpegImage = await newPdfDoc.embedJpg(jpegBytes)

      // Get original page dimensions (PDF points, not scaled)
      const page = await pdf.getPage(i + 1)
      const originalViewport = page.getViewport({ scale: 1 })
      const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height])

      newPage.drawImage(jpegImage, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      })
    }

    const newPdfBytes = await newPdfDoc.save()
    const pdfArrayBuffer = newPdfBytes.buffer.slice(
      newPdfBytes.byteOffset,
      newPdfBytes.byteOffset + newPdfBytes.byteLength
    ) as ArrayBuffer

    const resultSize = pdfArrayBuffer.byteLength

    // Check if within target range
    if (resultSize >= targetMin && resultSize <= targetMax) {
      compressedFile = new File([pdfArrayBuffer], file.name, { type: 'application/pdf' })
      break
    }

    // If the result is smaller than original target min but we're already at max quality, accept it
    if (jpegQuality >= 0.99) {
      compressedFile = new File([pdfArrayBuffer], file.name, { type: 'application/pdf' })
      break
    }

    // Adjust quality proportionally: newQuality = oldQuality * (targetSize / actualSize)
    const ratio = targetMid / resultSize
    jpegQuality = Math.max(0.05, Math.min(1.0, jpegQuality * ratio))

    // On last attempt, just accept whatever we got
    if (attempt === 2) {
      compressedFile = new File([pdfArrayBuffer], file.name, { type: 'application/pdf' })
    }
  }

  onProgress?.({ currentPage: totalPages, totalPages, phase: 'complete' })

  return compressedFile!
}
