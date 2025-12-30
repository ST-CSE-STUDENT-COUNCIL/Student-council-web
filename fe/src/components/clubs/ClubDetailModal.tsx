import type { Club } from './ClubCard'

interface Props {
    club: Club | null
    onClose: () => void
}

export function ClubDetailModal({ club, onClose }: Props) {
    if (!club) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-[90vw] overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                    <div>
                        <p className="text-sm text-gray-500">{club.category}</p>
                        <h3 className="text-xl font-bold text-gray-900">{club.name}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>
                <div className="bg-gray-50 p-4">
                    {club.detail_image_url ? (
                        <img
                            src={club.detail_image_url}
                            alt={club.name}
                            className="w-full max-h-[70vh] object-contain bg-white"
                        />
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center text-gray-400 bg-white rounded-lg">
                            <span className="text-sm">상세 이미지가 없습니다.</span>
                        </div>
                    )}
                </div>
                <div className="px-4 py-3 text-sm text-gray-700 border-t border-gray-200">
                    <p className="mb-4">{club.description}</p>
                    <a
                        href="https://www.naver.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                        공식 링크 방문 →
                    </a>
                </div>
            </div>
        </div>
    )
}
