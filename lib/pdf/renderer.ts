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

export async function getPDFInfo(pdfData: ArrayBuffer): Promise<PDFInfo> {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
  const firstPage = await pdf.getPage(1)
  const viewport = firstPage.getViewport({ scale: 1 })

  return {
    pageCount: pdf.numPages,
    width: viewport.width,
    height: viewport.height
  }
}

export async function renderPDFToImages(
  pdfData: ArrayBuffer,
  onProgress?: (progress: RenderProgress) => void,
  scale: number = 2 // 2x for retina
): Promise<RenderedPage[]> {
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
  const totalPages = pdf.numPages
  const renderedPages: RenderedPage[] = []

  onProgress?.({ currentPage: 0, totalPages, status: 'loading' })

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({ currentPage: pageNum, totalPages, status: 'rendering' })

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    }).promise

    // Convert to WebP blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Failed to create blob'))
        },
        'image/webp',
        0.85 // Quality
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
