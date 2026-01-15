import { useState, useEffect } from 'react'
import type { Club, ClubImage } from '../../types/clubs'
import { clubApi } from '../../lib/api/clubs'

type Props = {
    club: Club | null
    onClose: () => void
}

export function ClubDetailModal({ club, onClose }: Props) {
    const [clubDetail, setClubDetail] = useState<Club | null>(null)
    const [introImages, setIntroImages] = useState<ClubImage[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!club) return

        // 동아리 상세 정보와 소개 이미지 가져오기
        async function loadClubDetail() {
            setLoading(true)
            try {
                const detail = await clubApi.getById(club.id)
                setClubDetail(detail)
                
                // 소개 이미지 별도 조회
                try {
                    const images = await clubApi.getIntroImages(club.id)
                    setIntroImages(images.sort((a, b) => a.display_order - b.display_order))
                } catch (imgErr) {
                    console.error('소개 이미지를 불러오는데 실패했습니다.', imgErr)
                    setIntroImages([])
                }
            } catch (err) {
                console.error('동아리 상세 정보를 불러오는데 실패했습니다.', err)
                // 실패 시 전달받은 club 정보 사용
                setClubDetail(club)
                setIntroImages([])
            } finally {
                setLoading(false)
            }
        }

        loadClubDetail()
    }, [club])

    const displayClub = clubDetail || club
    if (!displayClub) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{displayClub.name}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                        동아리 정보를 불러오는 중...
                    </div>
                ) : (
                    <div className="px-6 py-4 space-y-6">
                        {/* 소개 이미지들 */}
                        {introImages.length > 0 ? (
                            <div className="space-y-4">
                                {introImages.map((image, index) => (
                                    <div key={index} className="w-full">
                                        <img
                                            src={image.image_url}
                                            alt={`${displayClub.name} 소개 이미지 ${index + 1}`}
                                            className="w-full h-auto object-contain rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                                <span className="text-sm">소개 이미지가 없습니다.</span>
                            </div>
                        )}

                        {/* 동아리 설명 */}
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">동아리 소개</h4>
                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                                {displayClub.description}
                            </p>
                        </div>

                        {/* 웹사이트 링크 */}
                        {displayClub.website_url && (
                            <div className="border-t border-gray-200 pt-4">
                                <a
                                    href={displayClub.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                                >
                                    공식 웹사이트 방문 →
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
