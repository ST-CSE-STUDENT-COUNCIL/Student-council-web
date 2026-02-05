import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { toast } from 'sonner'
import { mypageApi } from '../../lib/api/mypage'

type VerifyModalProps = {
  onClose: () => void
  onUploaded?: () => Promise<void> | void
}

export function VerifyModal({ onClose, onUploaded }: VerifyModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setFileWithPreview(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setError(null)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileWithPreview(f)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setFileWithPreview(f)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
  }

  async function handleUpload() {
    if (!file || isUploading) return
    if (file.size > 5 * 1024 * 1024) {
      setError('5MB 이하의 이미지를 업로드해주세요.')
      return
    }

    setError(null)
    setIsUploading(true)
    try {
      await mypageApi.uploadVerificationImage(file)
      if (onUploaded) {
        await onUploaded()
      }
      onClose()
      toast.success('업로드가 완료되었습니다. 확인 중입니다.')
    } catch (err) {
      console.error('Failed to upload verification image', err)
      setError('업로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">학적 인증</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          학번과 학적상태가 포함되어있는 통정시 화면을 업로드해주세요.
        </p>
        <div className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-400">
          한번 업로드하면 수정할 수 없습니다. 신중하게 올려주세요.
        </div>

        <div
          className={`border border-dashed rounded-lg p-4 text-center mb-3 transition ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-slate-600'
            }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">이미지를 끌어오거나 클릭해서 선택하세요</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            파일 선택
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onChange}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {file ? `선택된 파일: ${file.name}` : 'JPG, PNG · 최대 5MB'}
          </p>
        </div>

        {previewUrl && (
          <div className="mt-3 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-800">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
              <span>선택한 이미지</span>
              <span className="font-medium text-gray-800 dark:text-white">{file?.name}</span>
            </div>
            <div className="max-h-72 overflow-hidden bg-white dark:bg-slate-900">
              <img
                src={previewUrl}
                alt="선택한 인증 이미지"
                className="w-full h-full max-h-72 object-contain"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">취소</button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`px-4 py-2 rounded-md text-sm text-white ${file && !isUploading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'}`}
          >
            {isUploading ? '업로드 중...' : '선택 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
