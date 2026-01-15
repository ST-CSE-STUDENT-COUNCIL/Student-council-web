import { motion } from 'framer-motion'
import { X } from 'lucide-react'

type ImagePreviewModalProps = {
    imageUrl: string
    onClose: () => void
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70]"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-4xl max-h-[90vh] p-2"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10"
                >
                    <X size={20} />
                </button>
                <img
                    src={imageUrl}
                    alt="학적 인증자료"
                    className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain bg-white"
                />
                <div className="text-center mt-3">
                    <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white text-sm underline"
                    >
                        새 탭에서 열기
                    </a>
                </div>
            </motion.div>
        </motion.div>
    )
}
