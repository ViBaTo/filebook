'use client'

import { useState, useCallback } from 'react'
import { ProcessingProgress } from '@/components/upload/ProcessingProgress'
import { PDFCompressor } from '@/components/upload/PDFCompressor'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import {
  type CompressionQuality,
  COMPRESSION_CONFIGS,
} from '@/lib/pdf/compressor'

type WizardStep = 'upload' | 'processing' | 'done' | 'error'

const COMPRESS_THRESHOLD_MB = 50

interface BookResult {
  id: string
  slug: string
  title: string
  pageCount: number
}

interface RenderProgress {
  currentPage: number
  totalPages: number
  status: 'loading' | 'rendering' | 'complete'
}

interface UploadProgress {
  currentPage: number
  totalPages: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
}

export default function CreatePage() {
  const [step, setStep] = useState<WizardStep>('upload')
  const [processingStatus, setProcessingStatus] = useState<
    'loading' | 'rendering' | 'uploading' | 'complete' | 'error'
  >('loading')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [bookResult, setBookResult] = useState<BookResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [compressionQuality, setCompressionQuality] = useState<CompressionQuality | null>(null)
  const [needsCompression, setNeedsCompression] = useState(false)

  const supabase = createClient()

  const processAndUpload = useCallback(
    async (bookId: string, file: File, quality?: CompressionQuality | null) => {
      try {
        setStep('processing')
        setProcessingStatus('loading')

        // Determine render settings based on compression quality
        const config = quality ? COMPRESSION_CONFIGS[quality] : null
        const renderScale = config?.renderScale ?? 2
        const webpQuality = config?.webpQuality ?? 0.85

        // Dynamically import PDF processing modules (browser-only)
        const { loadPDFFromFile, renderPDFToImages } =
          await import('@/lib/pdf/renderer')
        const { uploadRenderedPages, updateBookWithPages, markBookAsError } =
          await import('@/lib/pdf/uploader')

        // Load the PDF
        const pdfData = await loadPDFFromFile(file)

        // Render PDF to images
        const onRenderProgress = (p: RenderProgress) => {
          setProcessingStatus(
            p.status === 'complete' ? 'uploading' : 'rendering'
          )
          if (p.totalPages > 0) {
            // Rendering = 0-50% of total progress
            setProgress(Math.round((p.currentPage / p.totalPages) * 50))
          }
        }

        const renderedPages = await renderPDFToImages(pdfData, onRenderProgress, renderScale, webpQuality)

        // Update status to processing in DB
        await supabase
          .from('fb_books')
          .update({ status: 'processing' })
          .eq('id', bookId)

        // Upload rendered pages
        const onUploadProgress = (p: UploadProgress) => {
          setProcessingStatus(
            p.status === 'complete' ? 'complete' : 'uploading'
          )
          if (p.totalPages > 0) {
            // Uploading = 50-100% of total progress
            setProgress(50 + Math.round((p.currentPage / p.totalPages) * 50))
          }
        }

        const pagesUrls = await uploadRenderedPages(
          bookId,
          renderedPages,
          onUploadProgress
        )

        // Update book with pages
        await updateBookWithPages(bookId, pagesUrls, renderedPages.length)

        // Get the book info
        const { data: book } = await supabase
          .from('fb_books')
          .select('slug, title')
          .eq('id', bookId)
          .single()

        setBookResult({
          id: bookId,
          slug: book?.slug || '',
          title: book?.title || 'Sin título',
          pageCount: renderedPages.length
        })

        setProcessingStatus('complete')
        setStep('done')
      } catch (error) {
        console.error('Processing error:', error)
        const message =
          error instanceof Error
            ? error.message
            : 'An error occurred during processing'
        setErrorMessage(message)
        setProcessingStatus('error')
        setStep('error')

        // Mark book as error in DB
        const { markBookAsError } = await import('@/lib/pdf/uploader')
        await markBookAsError(bookId, message)
      }
    },
    [supabase]
  )

  const handleUploadComplete = useCallback(
    (bookId: string, slug: string, pdfUrl: string) => {
      if (pdfFile) {
        processAndUpload(bookId, pdfFile, compressionQuality)
      }
    },
    [pdfFile, compressionQuality, processAndUpload]
  )

  const handleUploadStart = useCallback(() => {
    // Just a hook for when upload starts
  }, [])

  const handleError = useCallback((error: string) => {
    setErrorMessage(error)
    setStep('error')
  }, [])

  const handleFileSelected = useCallback((file: File) => {
    setPdfFile(file)
    // Check if file needs compression (>50MB)
    if (file.size > COMPRESS_THRESHOLD_MB * 1024 * 1024) {
      setNeedsCompression(true)
    }
  }, [])

  const handleCompressed = useCallback((compressedFile: File, quality: CompressionQuality) => {
    setPdfFile(compressedFile)
    setCompressionQuality(quality)
    setStep('upload')
    setNeedsCompression(false)
  }, [])

  const handleSkipCompression = useCallback(() => {
    setCompressionQuality(null)
    setStep('upload')
    setNeedsCompression(false)
  }, [])

  const viewUrl = bookResult
    ? `${window.location.origin}/view/${bookResult.slug}`
    : ''
  const embedCode = bookResult
    ? `<iframe src="${window.location.origin}/embed/${bookResult.slug}" width="100%" height="600" style="border: none; border-radius: 8px;" allowfullscreen></iframe>`
    : ''

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRetry = () => {
    setStep('upload')
    setErrorMessage('')
    setPdfFile(null)
    setBookResult(null)
    setCompressionQuality(null)
    setNeedsCompression(false)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'>
      {/* Main content */}
      <main className='max-w-2xl mx-auto px-6 py-12'>
        {/* Step indicator */}
        <div className='flex items-center justify-center gap-2 mb-12'>
          {['Upload', 'Process', 'Done'].map((label, index) => {
            const stepIndex = {
              upload: 0,
              processing: 1,
              done: 2,
              error: step === 'error' ? 1 : 0
            }[step]
            const isActive = index === stepIndex
            const isComplete = index < stepIndex

            return (
              <div key={label} className='flex items-center gap-2'>
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isComplete ? 'bg-[#e94560] text-white' : ''}
                  ${isActive ? 'bg-white text-[#1a1a2e]' : ''}
                  ${!isComplete && !isActive ? 'bg-white/10 text-white/50' : ''}
                `}
                >
                  {isComplete ? (
                    <svg
                      className='w-4 h-4'
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
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-sm ${isActive ? 'text-white' : 'text-white/50'}`}
                >
                  {label}
                </span>
                {index < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${index < stepIndex ? 'bg-[#e94560]' : 'bg-white/20'}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Upload step */}
        {step === 'upload' && !needsCompression && (
          <div>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-white mb-2'>
                Create your FlipBook
              </h1>
              <p className='text-gray-400'>
                Upload a PDF and get a shareable interactive flipbook in seconds
              </p>
            </div>

            <PDFUploaderWithCapture
              key={compressionQuality ? 'compressed' : 'original'}
              maxSizeMB={500}
              initialFile={compressionQuality ? pdfFile : null}
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onError={handleError}
              onFileSelected={handleFileSelected}
            />

            <p className='text-center text-sm text-gray-500 mt-6'>
              Gratis: Hasta 30MB, 50 páginas.{' '}
              <a href='/pricing' className='text-[#e94560] hover:underline'>
                Ver planes
              </a>
            </p>
          </div>
        )}

        {/* Compress step (shown when file > 50MB) */}
        {(step === 'upload' && needsCompression) && pdfFile && (
          <div>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-white mb-2'>
                Comprimir PDF
              </h1>
              <p className='text-gray-400'>
                Tu archivo es grande. Elige un nivel de compresión para optimizarlo.
              </p>
            </div>

            <PDFCompressor
              file={pdfFile}
              onCompressed={handleCompressed}
              onSkip={handleSkipCompression}
              onError={handleError}
            />
          </div>
        )}

        {/* Processing step */}
        {step === 'processing' && (
          <div>
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-white mb-2'>
                Processing your PDF
              </h1>
              <p className='text-gray-400'>
                Converting pages to an interactive flipbook
              </p>
            </div>

            <ProcessingProgress
              progress={progress}
              status={processingStatus}
            />
          </div>
        )}

        {/* Done step */}
        {step === 'done' && bookResult && (
          <div>
            <div className='text-center mb-8'>
              <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center'>
                <svg
                  className='w-10 h-10 text-green-500'
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
              </div>
              <h1 className='text-3xl font-bold text-white mb-2'>
                Your FlipBook is ready!
              </h1>
              <p className='text-gray-400'>
                {bookResult.pageCount} pages • {bookResult.title}
              </p>
            </div>

            {/* Share link */}
            <div className='bg-white/5 border border-white/10 rounded-xl p-6 mb-4'>
              <label className='block text-sm font-medium text-gray-400 mb-2'>
                Share link
              </label>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={viewUrl}
                  readOnly
                  className='flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm'
                />
                <Button onClick={() => copyToClipboard(viewUrl)}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Embed code */}
            <div className='bg-white/5 border border-white/10 rounded-xl p-6 mb-6'>
              <label className='block text-sm font-medium text-gray-400 mb-2'>
                Embed code
              </label>
              <textarea
                value={embedCode}
                readOnly
                rows={3}
                className='w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm font-mono resize-none'
              />
              <Button
                onClick={() => copyToClipboard(embedCode)}
                variant='secondary'
                className='mt-2 w-full'
              >
                Copy embed code
              </Button>
            </div>

            {/* Actions */}
            <div className='flex gap-4'>
              <Button
                onClick={handleRetry}
                variant='secondary'
                className='flex-1'
              >
                Create another
              </Button>
              <Button
                onClick={() => window.open(viewUrl, '_blank')}
                className='flex-1'
              >
                View FlipBook
              </Button>
            </div>
          </div>
        )}

        {/* Error step */}
        {step === 'error' && (
          <div>
            <div className='text-center mb-8'>
              <div className='w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center'>
                <svg
                  className='w-10 h-10 text-red-500'
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
              </div>
              <h1 className='text-3xl font-bold text-white mb-2'>
                Something went wrong
              </h1>
              <p className='text-gray-400'>{errorMessage}</p>
            </div>

            <div className='flex justify-center'>
              <Button onClick={handleRetry}>Try again</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Extended PDFUploader that captures the file
function PDFUploaderWithCapture({
  maxSizeMB,
  initialFile,
  onUploadStart,
  onUploadComplete,
  onError,
  onFileSelected
}: {
  maxSizeMB: number
  initialFile?: File | null
  onUploadStart?: () => void
  onUploadComplete?: (bookId: string, slug: string, pdfUrl: string) => void
  onError?: (error: string) => void
  onFileSelected?: (file: File) => void
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [bookTitle, setBookTitle] = useState('')

  const supabase = createClient()

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      // #region agent log
      fetch(
        'http://127.0.0.1:7243/ingest/794432fe-9e2f-465e-959b-553b78daa77c',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'create/page.tsx:uploadFile',
            message: 'H1: auth state in PDFUploaderWithCapture',
            data: {
              hasUser: !!user,
              userId: user?.id || null,
              authError: authError?.message || null
            },
            hypothesisId: 'H1',
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion

      const { generateSlug } = await import('@/lib/utils/slug')
      const slug = generateSlug()
      const fileExt = file.name.split('.').pop()
      const fileName = `${slug}.${fileExt}`
      const filePath = user ? `${user.id}/${fileName}` : `anonymous/${fileName}`

      setUploadProgress(20)
      const { error: uploadError } = await supabase.storage
        .from('flipbook-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      // #region agent log
      fetch(
        'http://127.0.0.1:7243/ingest/794432fe-9e2f-465e-959b-553b78daa77c',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'create/page.tsx:storage',
            message: 'H5: storage upload result',
            data: {
              uploadSuccess: !uploadError,
              uploadErrorMsg: uploadError?.message || null
            },
            hypothesisId: 'H5',
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`)
      }

      setUploadProgress(60)

      const { data: urlData } = supabase.storage
        .from('flipbook-pdfs')
        .getPublicUrl(filePath)

      const pdfUrl = urlData.publicUrl

      const isAnonymous = !user
      const insertData = {
        slug,
        title: bookTitle.trim() || 'Sin título',
        pdf_url: pdfUrl,
        pdf_filename: file.name,
        pdf_size_bytes: file.size,
        user_id: user?.id || null,
        is_anonymous: isAnonymous,
        status: 'uploading',
        expires_at: isAnonymous
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null
      }

      // #region agent log
      fetch(
        'http://127.0.0.1:7243/ingest/794432fe-9e2f-465e-959b-553b78daa77c',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'create/page.tsx:insert',
            message: 'H2: insert data before fb_books insert',
            data: {
              user_id: insertData.user_id,
              is_anonymous: insertData.is_anonymous,
              slug: insertData.slug
            },
            hypothesisId: 'H2',
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion

      const { data: book, error: insertError } = await supabase
        .from('fb_books')
        .insert(insertData)
        .select()
        .single()

      // #region agent log
      fetch(
        'http://127.0.0.1:7243/ingest/794432fe-9e2f-465e-959b-553b78daa77c',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'create/page.tsx:insertResult',
            message: 'H2: insert result',
            data: {
              insertSuccess: !insertError,
              insertErrorMsg: insertError?.message || null,
              insertErrorCode: insertError?.code || null,
              bookId: book?.id || null
            },
            hypothesisId: 'H2',
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion

      if (insertError) {
        throw new Error(`Error creating book: ${insertError.message}`)
      }

      setUploadProgress(100)

      const anonymousBooks = JSON.parse(
        localStorage.getItem('anonymousBooks') || '[]'
      )
      anonymousBooks.push({ id: book.id, slug: book.slug })
      localStorage.setItem('anonymousBooks', JSON.stringify(anonymousBooks))

      onUploadComplete?.(book.id, book.slug, pdfUrl)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred'
      onError?.(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`File too large. Maximum size is ${maxSizeMB}MB`)
        return
      }
      setSelectedFile(file)
      onFileSelected?.(file)
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      uploadFile(selectedFile)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setBookTitle('')
  }

  // Import dropzone dynamically to handle SSR
  const { useDropzone } = require('react-dropzone')
  const { formatBytes } = require('@/lib/utils/format')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  return (
    <div className='w-full max-w-xl mx-auto'>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-out
            ${
              isDragActive
                ? 'border-[#e94560] bg-[#e94560]/10 scale-[1.02]'
                : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className='flex flex-col items-center gap-4'>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragActive ? 'bg-[#e94560]/20' : 'bg-white/10'}`}
            >
              <svg
                className={`w-8 h-8 ${isDragActive ? 'text-[#e94560]' : 'text-gray-400'}`}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                />
              </svg>
            </div>

            <div>
              <p className='text-lg font-medium text-white'>
                {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
              </p>
              <p className='text-sm text-gray-400 mt-1'>
                or click to browse (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='border border-white/20 rounded-2xl p-6 bg-white/5'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-lg bg-[#e94560]/20 flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-6 h-6 text-[#e94560]'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>

            <div className='flex-1 min-w-0'>
              <p className='text-white font-medium truncate'>
                {selectedFile.name}
              </p>
              <p className='text-sm text-gray-400'>
                {formatBytes(selectedFile.size)}
              </p>
            </div>

            {!isUploading && (
              <button
                onClick={handleReset}
                className='p-2 text-gray-400 hover:text-white transition-colors'
              >
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
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            )}
          </div>

          {isUploading && (
            <div className='mt-4'>
              <div className='h-2 bg-white/10 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-[#e94560] transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className='text-sm text-gray-400 mt-2 text-center'>
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {!isUploading && (
            <div className='mt-4 space-y-3'>
              <div>
                <label
                  htmlFor='book-title'
                  className='block text-sm font-medium text-gray-400 mb-1.5'
                >
                  Título del FlipBook
                </label>
                <input
                  id='book-title'
                  type='text'
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder='Ej: Catálogo de productos 2026'
                  className='w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] transition-colors'
                />
              </div>
              <div className='flex gap-3'>
                <Button onClick={handleReset} variant='ghost' className='flex-1'>
                  Cancel
                </Button>
                <Button onClick={handleUpload} className='flex-1'>
                  Create FlipBook
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
