import type { Club } from '../../types/clubs'

type Props = {
    club: Club
    onDetail?: () => void
}

export function ClubCard({ club, onDetail }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden flex flex-col">
            {/* 이미지 영역 */}
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center flex-shrink-0">
                {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                ) : club.detail_image_url ? (
                    <img src={club.detail_image_url} alt={club.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">이미지 준비 중</span>
                    </div>
                )}
            </div>

            {/* 텍스트 영역 */}
            <div className="p-6 flex flex-col flex-grow text-center">
                <div className="flex items-center justify-center mb-3 flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{club.name}</h3>
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
                        {club.category}
                    </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{club.description}</p>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onDetail}
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        자세히 보기
                    </button>
                </div>
            </div>
        </div>
    )
}
