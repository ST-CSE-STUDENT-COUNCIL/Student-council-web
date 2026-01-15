type ImagePreviewModalProps = {
    imageUrl: string | null
    onClose: () => void
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
    if (!imageUrl) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] max-w-5xl rounded-xl bg-white p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt="학적 인증 원본 이미지"
                    className="max-h-[75vh] max-w-full rounded-lg object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={onClose}
                />
                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    )
}
