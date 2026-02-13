'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { formatBytes } from '@/lib/utils/format'
import {
  type CompressionQuality,
  type CompressionProgress,
  COMPRESSION_CONFIGS,
  compressPDF,
} from '@/lib/pdf/compressor'

interface PDFCompressorProps {
  file: File
  onCompressed: (compressedFile: File, quality: CompressionQuality) => void
  onSkip: () => void
  onError: (error: string) => void
}

export function PDFCompressor({
  file,
  onCompressed,
  onSkip,
  onError,
}: PDFCompressorProps) {
  const [selectedQuality, setSelectedQuality] = useState<CompressionQuality>('optimal')
  const [isCompressing, setIsCompressing] = useState(false)
  const [progress, setProgress] = useState<CompressionProgress | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)

  const qualityOptions: { key: CompressionQuality; icon: string }[] = [
    { key: 'low', icon: '⚡' },
    { key: 'medium', icon: '⚖️' },
    { key: 'optimal', icon: '✨' },
  ]

  const handleCompress = async () => {
    setIsCompressing(true)
    setCompressedFile(null)

    try {
      const result = await compressPDF(file, selectedQuality, (p) => {
        setProgress(p)
      })
      setCompressedFile(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al comprimir el PDF'
      onError(message)
    } finally {
      setIsCompressing(false)
    }
  }

  const handleContinue = () => {
    if (compressedFile) {
      onCompressed(compressedFile, selectedQuality)
    }
  }

  const progressPercent = progress
    ? progress.phase === 'rendering'
      ? Math.round((progress.currentPage / progress.totalPages) * 45)
      : progress.phase === 'calibrating'
        ? 48
        : progress.phase === 'building'
          ? 50 + Math.round((progress.currentPage / progress.totalPages) * 48)
          : 100
    : 0

  const progressLabel = progress
    ? progress.phase === 'building'
      ? `Generando PDF... (página ${progress.currentPage} de ${progress.totalPages})`
      : progress.phase === 'calibrating'
        ? 'Calibrando calidad óptima...'
        : progress.phase === 'complete'
          ? 'Compresión completada'
          : `Renderizando página ${progress.currentPage} de ${progress.totalPages}`
    : ''

  return (
    <div className='w-full max-w-xl mx-auto'>
      {/* File info */}
      <div className='flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-[10px] mb-6'>
        <div className='w-12 h-12 rounded-[10px] bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center flex-shrink-0'>
          <svg
            className='w-6 h-6 text-[#166534]'
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
          <p className='text-stone-900 font-medium truncate'>{file.name}</p>
          <p className='text-sm text-stone-400'>
            Tamaño original: <span className='text-[#166534] font-medium'>{formatBytes(file.size)}</span>
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className='flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[10px] mb-6'>
        <svg
          className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z'
          />
        </svg>
        <div>
          <p className='text-amber-800 text-sm font-medium'>
            Tu archivo supera los 50 MB
          </p>
          <p className='text-amber-700/70 text-sm mt-0.5'>
            Selecciona un nivel de compresión para optimizar el archivo antes de crear el flipbook.
          </p>
        </div>
      </div>

      {/* Quality selector */}
      {!compressedFile && (
        <div className='space-y-3 mb-6'>
          <label className='block text-sm font-medium text-stone-600'>
            Nivel de compresión
          </label>
          <div className='grid grid-cols-3 gap-3'>
            {qualityOptions.map(({ key, icon }) => {
              const config = COMPRESSION_CONFIGS[key]
              const isSelected = selectedQuality === key
              return (
                <button
                  key={key}
                  onClick={() => !isCompressing && setSelectedQuality(key)}
                  disabled={isCompressing}
                  className={`
                    relative p-4 rounded-[10px] border-2 transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-[#166534] bg-[#f0fdf4]'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-[0_1px_3px_0_rgba(28,25,23,0.06)]'
                    }
                    ${isCompressing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isSelected && (
                    <div className='absolute top-2 right-2 w-5 h-5 rounded-full bg-[#166534] flex items-center justify-center'>
                      <svg className='w-3 h-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  )}
                  <div className='text-2xl mb-2'>{icon}</div>
                  <p className={`font-medium text-sm ${isSelected ? 'text-stone-900' : 'text-stone-600'}`}>
                    {config.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-[#166534]' : 'text-stone-400'}`}>
                    {config.targetLabel}
                  </p>
                  <p className='text-xs text-stone-400 mt-1'>
                    {config.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Compression progress */}
      {isCompressing && progress && (
        <div className='mb-6'>
          <div className='h-2 bg-stone-100 rounded-full overflow-hidden mb-2'>
            <div
              className='h-full bg-[#166534] transition-all duration-300 ease-out'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className='text-sm text-stone-400 text-center'>{progressLabel}</p>
        </div>
      )}

      {/* Compression result */}
      {compressedFile && (
        <div className='p-4 bg-emerald-50 border border-emerald-200 rounded-[10px] mb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0'>
              <svg className='w-5 h-5 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-emerald-800 font-medium text-sm'>Compresión completada</p>
              <p className='text-emerald-700/70 text-sm'>
                {formatBytes(file.size)} → <span className='text-emerald-800 font-medium'>{formatBytes(compressedFile.size)}</span>
                <span className='text-emerald-600/60 ml-2'>
                  ({Math.round((1 - compressedFile.size / file.size) * 100)}% reducido)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex gap-3'>
        {!compressedFile ? (
          <>
            <Button
              onClick={onSkip}
              variant='ghost'
              className='flex-1'
              disabled={isCompressing}
            >
              Omitir
            </Button>
            <Button
              onClick={handleCompress}
              className='flex-1'
              isLoading={isCompressing}
              disabled={isCompressing}
            >
              {isCompressing ? 'Comprimiendo...' : 'Comprimir'}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                setCompressedFile(null)
                setProgress(null)
              }}
              variant='ghost'
              className='flex-1'
            >
              Cambiar calidad
            </Button>
            <Button onClick={handleContinue} className='flex-1'>
              Continuar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
