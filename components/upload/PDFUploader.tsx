'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils/slug'
import { formatBytes } from '@/lib/utils/format'
import { Button } from '@/components/ui/Button'

interface PDFUploaderProps {
  maxSizeMB?: number
  onUploadStart?: () => void
  onUploadComplete?: (bookId: string, slug: string, pdfUrl: string) => void
  onError?: (error: string) => void
}

export function PDFUploader({
  maxSizeMB = 10,
  onUploadStart,
  onUploadComplete,
  onError
}: PDFUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
            location: 'PDFUploader.tsx:37',
            message: 'H1: auth.getUser result',
            data: {
              hasUser: !!user,
              userId: user?.id || null,
              userEmail: user?.email || null,
              authError: authError?.message || null
            },
            hypothesisId: 'H1',
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion

      const slug = generateSlug()
      const fileExt = file.name.split('.').pop()
      const fileName = `${slug}.${fileExt}`
      const filePath = user ? `${user.id}/${fileName}` : `anonymous/${fileName}`

      // #region agent log
      fetch(
        'http://127.0.0.1:7243/ingest/794432fe-9e2f-465e-959b-553b78daa77c',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'PDFUploader.tsx:48',
            message: 'H2: filePath computed',
            data: { filePath, hasUser: !!user },
            hypothesisId: 'H2',
            timestamp: Date.now()
          })
        }
      ).catch(() => {})
      // #endregion

      // Upload PDF to storage
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
            location: 'PDFUploader.tsx:60',
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

      // Get the public URL (even though bucket is private, we use signed URLs later)
      const { data: urlData } = supabase.storage
        .from('flipbook-pdfs')
        .getPublicUrl(filePath)

      const pdfUrl = urlData.publicUrl

      // Create book record - explicitly set user_id for RLS compliance
      const isAnonymous = !user
      const insertData = {
        slug,
        pdf_url: pdfUrl,
        pdf_filename: file.name,
        pdf_size_bytes: file.size,
        user_id: user?.id || null, // Explicitly set user_id for RLS
        is_anonymous: isAnonymous,
        status: 'uploading',
        expires_at: isAnonymous
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days for anonymous
          : null
      }

      // #region agent log
      fetch(
        'http://127.0.0.1:7243/ingest/794432fe-9e2f-465e-959b-553b78daa77c',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'PDFUploader.tsx:88',
            message: 'H2: insert data before insert',
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
            location: 'PDFUploader.tsx:98',
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

      // Store the book ID in localStorage for anonymous users
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          onError?.(`File too large. Maximum size is ${maxSizeMB}MB`)
          return
        }
        setSelectedFile(file)
      }
    },
    [maxSizeMB, onError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const handleUpload = () => {
    if (selectedFile) {
      uploadFile(selectedFile)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

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
            <div className='mt-4 flex gap-3'>
              <Button onClick={handleReset} variant='ghost' className='flex-1'>
                Cancel
              </Button>
              <Button onClick={handleUpload} className='flex-1'>
                Upload PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
