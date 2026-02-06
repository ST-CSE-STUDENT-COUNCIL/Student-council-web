import React from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { toast } from 'sonner'
import { mypageApi } from '../../lib/api/mypage'


type EditProfileModalProps = {
  onClose: () => void
  initialName?: string
  initialStudentId?: string
  verificationStatus?: string
}

export function EditProfileModal({ onClose, initialName = '', initialStudentId = '', verificationStatus }: EditProfileModalProps) {
  const [name, setName] = React.useState(initialName)
  const [studentId, setStudentId] = React.useState(initialStudentId)
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function setFileWithPreview(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setError(null)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFileWithPreview(selectedFile)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (!droppedFile) return
    setFileWithPreview(droppedFile)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
  }

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function readFileAsDataUrl(targetFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('이미지 데이터를 읽지 못했습니다.'))
        }
      }

      reader.onerror = () => {
        reject(new Error('이미지 파일 읽기에 실패했습니다.'))
      }

      reader.readAsDataURL(targetFile)
    })
  }

  const isReady = name.trim().length > 0 && studentId.trim().length > 0 && Boolean(file)

  async function handleSubmit() {
    if (!file || isSubmitting) return

    const trimmedName = name.trim()
    const trimmedStudentId = studentId.trim()
    const nameChanged = trimmedName !== initialName
    const studentIdChanged = trimmedStudentId !== initialStudentId
    const sendNameForStudentIdOnly = studentIdChanged && !nameChanged && trimmedName.length > 0

    if (!nameChanged && !studentIdChanged) {
      setError('변경할 이름 또는 학번을 입력해주세요.')
      return
    }

    if (studentIdChanged && !/^\d{8}$/.test(trimmedStudentId)) {
      setError('학번은 8자리 숫자여야 합니다.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const verificationImageUrl = await readFileAsDataUrl(file)
      const requests: Array<Promise<unknown>> = []

      if (nameChanged || sendNameForStudentIdOnly) {
        requests.push(
          mypageApi.requestProfileUpdate({
            field_name: 'name',
            new_value: trimmedName,
            verification_image_url: verificationImageUrl
          })
        )
      }

      if (studentIdChanged) {
        requests.push(
          mypageApi.requestProfileUpdate({
            field_name: 'student_id',
            new_value: trimmedStudentId,
            verification_image_url: verificationImageUrl
          })
        )
      }

      await Promise.all(requests)
      toast.success('변경 요청이 접수되었습니다. 관리자 승인 후 반영됩니다.')
      onClose()
    } catch (err) {
      console.error('Failed to request profile update', err)
      setError('요청에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">내 정보 수정 요청</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            닫기
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          이름과 학번 변경 요청을 위해 학적인증 이미지를 첨부해주세요.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="변경할 이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">학번</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="변경할 학번을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">학적인증 이미지</label>
            <div
              className={`border border-dashed rounded-lg p-4 text-center transition ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-slate-600'
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
                <div className="max-h-64 overflow-hidden bg-white dark:bg-slate-900">
                  <img
                    src={previewUrl}
                    alt="선택한 학적인증 이미지"
                    className="w-full h-full max-h-64 object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!isReady || isSubmitting}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-md text-sm text-white ${isReady && !isSubmitting ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'}`}
          >
            {isSubmitting ? '요청 중...' : '요청하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
