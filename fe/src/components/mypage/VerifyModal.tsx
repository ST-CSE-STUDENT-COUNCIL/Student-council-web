import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

export function VerifyModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    setFile(f)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
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
            {file ? `선택된 파일: ${file.name}` : 'JPG, PNG · 최대 10MB 권장'}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">취소</button>
          <button
            onClick={onClose}
            disabled={!file}
            className={`px-4 py-2 rounded-md text-sm text-white ${file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  )
}
