import React from 'react'
import { toast } from 'sonner'
import { welfareApi, type PrinterInfo } from '../../../lib/api/welfare'
import { PrinterImageSection } from './PrinterImageSection'
import { useAuthStore } from '../../../store/useAuthStore'

export function PrinterManagementView() {
    const { accessToken } = useAuthStore()
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string>('')
    const [uploadedUrl, setUploadedUrl] = React.useState<string>('')
    const [isUploading, setIsUploading] = React.useState(false)
    const [printerInfo, setPrinterInfo] = React.useState<PrinterInfo | null>(null)

    const fetchPrinterInfo = React.useCallback(async () => {
        try {
            const info = await welfareApi.getPrinterInfo()
            setPrinterInfo(info)
        } catch (error) {
            console.error('[프린터 이미지] 정보 로드 실패:', error)
            toast.error('프린터 정보를 불러오지 못했습니다.')
        }
    }, [])

    React.useEffect(() => {
        fetchPrinterInfo()
    }, [fetchPrinterInfo])

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

            // 3. 업로드 완료 알림
            await welfareApi.completePrinterImageUpload(public_url, accessToken)

            // 4. 업로드 성공 시 public_url 저장 및 정보 갱신
            setUploadedUrl(public_url)
            await fetchPrinterInfo()

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

            <PrinterImageSection
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                uploadedUrl={uploadedUrl}
                isUploading={isUploading}
                printerInfo={printerInfo}
                onFileChange={handleFileChange}
                onSave={handleSave}
                onReset={handleReset}
            />

        </div>
    )
}

