import React from 'react'
import { toast } from 'sonner'
import { welfareApi } from '../../../lib/api/welfare'
import { useAuthStore } from '../../../store/useAuthStore'

export function PrinterManagementView() {
    const { accessToken } = useAuthStore()
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string>('')
    const [uploadedUrl, setUploadedUrl] = React.useState<string>('')
    const [isUploading, setIsUploading] = React.useState(false)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null
        setSelectedFile(file)

        if (!file) {
            setPreviewUrl('')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(typeof reader.result === 'string' ? reader.result : '')
        }
        reader.readAsDataURL(file)
    }

    const handleReset = () => {
        setSelectedFile(null)
        setPreviewUrl('')
        toast.message('선택한 이미지가 초기화되었습니다.')
    }

    /**
     * 프린터 사용 안내 이미지 업로드 처리
     * 1. Presigned URL 획득
     * 2. 해당 URL로 직접 PUT 요청으로 이미지 업로드
     * 3. public_url을 저장하여 사용
     */
    const handleSave = async () => {
        if (!selectedFile) {
            toast.error('업로드할 이미지를 선택해주세요.')
            return
        }

        setIsUploading(true)
        try {
            // 1. Presigned URL 획득
            console.log('[프린터 이미지] 1단계: Presigned URL 요청 중...')
            const { presigned_url, public_url } = await welfareApi.getPrinterImagePresignedUrl(
                selectedFile.name,
                accessToken
            )
            console.log('[프린터 이미지] Presigned URL:', presigned_url)
            console.log('[프린터 이미지] Public URL:', public_url)

            // 2. Presigned URL로 직접 이미지 업로드 (PUT 요청)
            console.log('[프린터 이미지] 2단계: S3 업로드 시작...')
            await welfareApi.uploadImageToS3(presigned_url, selectedFile)
            console.log('[프린터 이미지] S3 업로드 완료')

            // 3. 업로드 성공 시 public_url 저장
            setUploadedUrl(public_url)

            toast.success('프린터 사용 안내 이미지가 업로드되었습니다.')
            console.log('[프린터 이미지] 업로드된 이미지 URL:', public_url)
        } catch (error: unknown) {
            console.error('[프린터 이미지] 업로드 실패:', error)
            // axios 에러인 경우 상세 정보 출력
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: unknown } }
                console.error('[프린터 이미지] 서버 응답:', axiosError.response?.status, axiosError.response?.data)
            }
            toast.error('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">프린터</h2>
                    <p className="text-gray-500 mt-1">프린터 사용 안내 이미지를 업로드합니다.</p>
                </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">사용 안내 이미지</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="printer-guide-image">
                            이미지 파일 선택
                        </label>
                        <input
                            id="printer-guide-image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
                        />
                        <p className="text-xs text-gray-500">PNG/JPG 권장. 최대 10MB까지 업로드 가능합니다.</p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isUploading || !selectedFile}
                                className="rounded-lg bg-gray-900 hover:bg-black text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? '업로드 중...' : '저장'}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm font-semibold transition-colors"
                            >
                                초기화
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700">미리보기</div>
                        <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                            {previewUrl ? (
                                <img src={previewUrl} alt="프린터 사용 안내 미리보기" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-sm text-gray-400">이미지를 선택하면 여기에 표시됩니다.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 업로드 완료된 URL 표시 */}
                {uploadedUrl && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-1">✓ 업로드 완료</p>
                        <p className="text-xs text-green-600 break-all">{uploadedUrl}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

