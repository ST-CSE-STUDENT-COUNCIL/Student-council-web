import { useState, useEffect } from 'react'
import type { Club, ClubImage } from '../../types/clubs'
import { clubApi } from '../../lib/api/clubs'
import { Modal } from '../common/Modal'

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

        const clubId = club.id
        const currentClub = club

        // 동아리 상세 정보와 소개 이미지 가져오기
        async function loadClubDetail() {
            setLoading(true)
            try {
                const detail = await clubApi.getById(clubId)
                setClubDetail(detail)

                // 소개 이미지 별도 조회
                try {
                    const images = await clubApi.getIntroImages(clubId)
                    setIntroImages(images.sort((a, b) => a.display_order - b.display_order))
                } catch (imgErr) {
                    console.error('소개 이미지를 불러오는데 실패했습니다.', imgErr)
                    setIntroImages([])
                }
            } catch (err) {
                console.error('동아리 상세 정보를 불러오는데 실패했습니다.', err)
                // 실패 시 전달받은 club 정보 사용
                setClubDetail(currentClub)
                setIntroImages([])
            } finally {
                setLoading(false)
            }
        }

        loadClubDetail()
    }, [club])

    const displayClub = clubDetail || club

    return (
        <Modal
            isOpen={!!displayClub}
            onClose={onClose}
            title={displayClub?.name || ''}
            maxWidth="max-w-4xl"
        >
            {loading ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    동아리 정보를 불러오는 중...
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 소개 이미지들 */}
                    {introImages.length > 0 ? (
                        <div className="space-y-4">
                            {introImages.map((image, index) => (
                                <div key={index} className="w-full">
                                    <img
                                        src={image.image_url}
                                        alt={`${displayClub?.name} 소개 이미지 ${index + 1}`}
                                        className="w-full h-auto object-contain rounded-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm">소개 이미지가 없습니다.</span>
                        </div>
                    )}

                    {/* 동아리 설명 */}
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">동아리 소개</h4>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                            {displayClub?.description}
                        </p>
                    </div>

                    {/* 웹사이트 링크 */}
                    {displayClub?.website_url && (
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
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
        </Modal>
    )
}