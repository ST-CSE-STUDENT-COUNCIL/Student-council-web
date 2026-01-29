import React from 'react'
import { toast } from 'sonner'

export function PrinterManagementView() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = React.useState<string>('')

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

    const handleSave = () => {
        if (!selectedFile) {
            toast.error('업로드할 이미지를 선택해주세요.')
            return
        }

        toast.message('아직 서버(API)가 준비되지 않아 저장은 동작하지 않습니다.')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">프린터</h2>
                    <p className="text-gray-500 mt-1">프린터 사용 안내 이미지를 업로드합니다. (UI만 제공)</p>
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
                        <p className="text-xs text-gray-500">PNG/JPG 권장. 업로드/저장은 추후 API 연결 후 활성화됩니다.</p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="rounded-lg bg-gray-900 hover:bg-black text-white px-4 py-2 text-sm font-semibold transition-colors"
                            >
                                저장
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
            </div>
        </div>
    )
}

