'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { FlipBook } from '@/lib/types'

interface FlipbookGridProps {
  flipbooks: FlipBook[]
}

function StatusBadge({ status }: { status: FlipBook['status'] }) {
  const config = {
    ready: {
      label: 'Publicado',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    processing: {
      label: 'Procesando',
      classes: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    uploading: {
      label: 'Subiendo',
      classes: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    error: {
      label: 'Error',
      classes: 'bg-red-50 text-red-700 border-red-200'
    }
  }

  const { label, classes } = config[status] || config.error

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${classes}`}
    >
      {label}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DeleteConfirmModal({
  bookTitle,
  onConfirm,
  onCancel,
  isDeleting
}: {
  bookTitle: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-sm'
        onClick={onCancel}
      />
      {/* Modal */}
      <div className='relative bg-white border border-stone-200 rounded-[16px] shadow-[0_24px_48px_-12px_rgba(28,25,23,0.16)] max-w-sm w-full p-6'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0'>
            <svg
              className='w-5 h-5 text-red-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </div>
          <div>
            <h3 className='text-stone-900 font-semibold'>Eliminar flipbook</h3>
            <p className='text-sm text-stone-500 mt-0.5'>
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>
        <p className='text-sm text-stone-600 mb-6'>
          ¿Estás seguro de que quieres eliminar{' '}
          <span className='font-medium text-stone-900'>&quot;{bookTitle}&quot;</span>?
          Se perderán todos los datos y analíticas asociadas.
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='px-4 py-2 text-sm font-medium text-stone-700 bg-white border-[1.5px] border-stone-300 rounded-full hover:bg-stone-50 transition-colors disabled:opacity-50'
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2'
          >
            {isDeleting ? (
              <>
                <svg
                  className='w-4 h-4 animate-spin'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FlipbookGrid({ flipbooks }: FlipbookGridProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<FlipBook | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = useCallback(async (book: FlipBook) => {
    setDeletingId(book.id)
    setError(null)

    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }

      setConfirmDelete(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el flipbook')
    } finally {
      setDeletingId(null)
    }
  }, [router])

  if (flipbooks.length === 0) {
    return (
      <div className='bg-white border border-stone-200 rounded-[10px] p-12 text-center'>
        <svg
          className='w-16 h-16 mx-auto text-stone-300 mb-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1.5}
            d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
          />
        </svg>
        <h3 className='text-lg font-medium text-stone-900 mb-2'>
          No tienes flipbooks aún
        </h3>
        <p className='text-stone-500 mb-6'>
          Crea tu primer flipbook subiendo un archivo PDF
        </p>
        <Link
          href='/create'
          className='inline-flex items-center gap-2 px-6 py-3 bg-[#166534] text-white font-medium rounded-full hover:bg-[#14532d] transition-all hover:-translate-y-[1px]'
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
              d='M12 4v16m8-8H4'
            />
          </svg>
          Crear flipbook
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Error toast */}
      {error && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-[10px] flex items-center justify-between'>
          <p className='text-red-800 text-sm flex items-center gap-2'>
            <svg
              className='w-5 h-5 shrink-0'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            className='text-red-500 hover:text-red-700 ml-3'
          >
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
        {flipbooks.map((book) => {
          const thumbnailUrl =
            book.pages_urls && book.pages_urls.length > 0
              ? book.pages_urls[0]
              : null

          return (
            <div
              key={book.id}
              className='group relative bg-white border border-stone-200 rounded-[10px] overflow-hidden hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] hover:border-stone-300 hover:-translate-y-[2px] transition-all duration-200'
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setConfirmDelete(book)
                }}
                className='absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all duration-200'
                title='Eliminar flipbook'
              >
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
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </button>

              <Link href={`/view/${book.slug}`}>
                {/* Thumbnail */}
                <div className='aspect-4/3 relative bg-stone-50 overflow-hidden'>
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={book.title}
                      fill
                      className='object-cover group-hover:scale-[1.02] transition-transform duration-300'
                      sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <svg
                        className='w-12 h-12 text-stone-300'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1.5}
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className='absolute top-2 right-2'>
                    <StatusBadge status={book.status} />
                  </div>
                </div>

                {/* Info */}
                <div className='p-4'>
                  <h3 className='font-medium text-stone-900 truncate group-hover:text-[#166534] transition-colors'>
                    {book.title}
                  </h3>
                  <div className='flex items-center gap-3 mt-2 text-xs text-stone-400'>
                    {book.page_count > 0 && (
                      <span className='flex items-center gap-1'>
                        <svg
                          className='w-3.5 h-3.5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                          />
                        </svg>
                        {book.page_count} págs.
                      </span>
                    )}
                    {book.pdf_size_bytes && (
                      <span>{formatFileSize(book.pdf_size_bytes)}</span>
                    )}
                    <span>{formatDate(book.created_at)}</span>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <DeleteConfirmModal
          bookTitle={confirmDelete.title}
          isDeleting={deletingId === confirmDelete.id}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => {
            if (!deletingId) {
              setConfirmDelete(null)
            }
          }}
        />
      )}
    </>
  )
}
