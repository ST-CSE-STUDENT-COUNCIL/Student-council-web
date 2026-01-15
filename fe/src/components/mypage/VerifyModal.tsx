import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { mypageApi } from '../../lib/api/mypage'

type VerifyModalProps = {
  onClose: () => void
  onUploaded?: () => Promise<void> | void
}

export function VerifyModal({ onClose, onUploaded }: VerifyModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
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
      const { presigned_url, public_url } = await mypageApi.getVerificationPresignedUrl(file.name)
      await mypageApi.uploadVerificationImageToStorage(presigned_url, file)
      await mypageApi.completeVerificationImageUpload(public_url)
      if (onUploaded) {
        await onUploaded()
      }
      onClose()
      alert('업로드가 완료되었습니다. 확인 중입니다.')
    } catch (err) {
      console.error('Failed to upload verification image', err)
      setError('업로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">학생 가입 인증</h3>
        <p className="text-sm text-gray-600 mb-4">
          학생증 또는 재학증명서를 선택해 주세요.
        </p>

        <div
          className={`border border-dashed rounded-lg p-4 text-center mb-3 transition ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <p className="text-sm text-gray-700 mb-2">이미지를 끌어오거나 클릭해서 선택하세요</p>
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
          <p className="text-xs text-gray-500 mt-2">
            {file ? `선택된 파일: ${file.name}` : 'JPG, PNG · 최대 5MB'}
          </p>
        </div>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">취소</button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`px-4 py-2 rounded-md text-sm text-white ${file && !isUploading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            {isUploading ? '업로드 중...' : '선택 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
