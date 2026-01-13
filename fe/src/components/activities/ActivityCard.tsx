import { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import type { Activity, ActivityListItem, ActivityStatus } from '../../types/activities'
import { getActivityStatus } from '../../types/activities'
import { ActivityRegistrationModal, ActivitySurveyModal } from './modals'

// Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

type ActivityCardProps = {
    activity: Activity | ActivityListItem
    isActive?: boolean
}

export const ActivityCard = ({ activity, isActive }: ActivityCardProps) => {
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false)
    const [status, setStatus] = useState<ActivityStatus>(() => getActivityStatus(activity))

    // 신청 시작/종료 시간에 맞춰 상태 자동 업데이트
    useEffect(() => {
        // 시간 문자열을 Date 객체로 변환
        const parseAsLocalTime = (dateString: string): Date => {
            return new Date(dateString)
        }

        const updateStatus = () => {
            setStatus(getActivityStatus(activity))
        }

        // 다음 상태 변경 시점 계산
        const getNextUpdateTime = (): number | null => {
            const now = Date.now()

            if (activity.registration_start) {
                const startTime = parseAsLocalTime(activity.registration_start).getTime()
                if (startTime > now) {
                    return startTime - now
                }
            }

            if (activity.registration_end) {
                const endTime = parseAsLocalTime(activity.registration_end).getTime()
                if (endTime > now) {
                    return endTime - now
                }
            }

            return null
        }

        // 초기 상태 업데이트
        updateStatus()

        // 다음 상태 변경 시점에 타이머 설정
        const nextUpdate = getNextUpdateTime()
        if (nextUpdate !== null && nextUpdate > 0) {
            // 1초 여유를 두고 업데이트 (정확한 시간에 맞추기 위해)
            const timerId = setTimeout(() => {
                updateStatus()
            }, nextUpdate + 1000)

            return () => clearTimeout(timerId)
        }
    }, [activity.registration_start, activity.registration_end, activity.is_active, status])

    // 정원 마감 여부 계산
    const isFull = activity.max_capacity
        ? activity.current_count >= activity.max_capacity
        : false

    // 이미지 처리: image_urls가 있으면 사용, 없으면 thumbnail_url 사용
    const displayImages: string[] = (() => {
        // Activity 타입인 경우 image_urls 확인
        if ('images' in activity && activity.images && activity.images.length > 0) {
            return activity.images.map(image => image.image_url)
        }
        // 썸네일이 있으면 사용
        if (activity.thumbnail_url) {
            return [activity.thumbnail_url]
        }
        return []
    })()

    const handleRegistrationSubmit = async (data: any) => {
        console.log('Registration Submitted:', data)
        // API 호출은 모달 내부에서 처리
    }

    const handleSurveySubmit = async (data: any) => {
        console.log('Survey Submitted:', data)
        // API 호출은 모달 내부에서 처리
    }

    const getButtonStyle = () => {
        if (status !== 'active') {
            return 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }

        switch (activity.type) {
            case 'notice':
                return 'bg-gray-800 text-white hover:bg-gray-900'
            case 'kakao_invite':
                return 'bg-[#FEE500] text-[#000000] hover:bg-[#FDD835]'
            case 'survey':
            case 'demand_survey':
                return 'bg-purple-600 text-white hover:bg-purple-700'
            case 'event':
            default:
                if (isFull) {
                    return 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
                return 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
        }
    }

    const getButtonText = () => {
        if (status === 'closed') return '종료되었습니다'
        if (status === 'scheduled') return '오픈 예정입니다'

        switch (activity.type) {
            case 'notice':
                return '공지 확인하기'
            case 'kakao_invite':
                return '카톡방 초대 신청'
            case 'survey':
                return '설문 참여하기'
            case 'demand_survey':
                return '수요조사 참여하기'
            case 'event':
            default:
                return isFull ? '마감되었습니다' : '참여 신청하기'
        }
    }

    const handleButtonClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (status !== 'active') return

        // 공지 타입: 외부 링크로 이동
        if (activity.type === 'notice') {
            const config = 'config' in activity ? activity.config : {}
            if (config?.external_link) {
                window.open(config.external_link, '_blank')
            }
            return
        }



        // 나머지 타입(event, demand_survey, kakao_invite): 신청 모달 열기
        setIsRegistrationModalOpen(true)
    }

    return (
        <>
            <div className={`flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Image Section */}
                <div className="w-full md:w-7/12 relative group bg-gray-100">
                    <div className="relative w-full" style={{ paddingBottom: '133%' }}>
                        <div className="absolute inset-0 w-full h-full bg-gray-200">
                            {displayImages.length > 0 ? (
                                <Swiper
                                    modules={[Pagination, Navigation]}
                                    pagination={{ clickable: true }}
                                    navigation={true}
                                    className="w-full h-full"
                                    spaceBetween={0}
                                    slidesPerView={1}
                                >
                                    {displayImages.map((img, idx) => (
                                        <SwiperSlide key={idx} className="bg-gray-50 flex items-center justify-center">
                                            <img
                                                src={img}
                                                alt={`${activity.title} - ${idx + 1}`}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <img src="/assets/logo.svg" alt="Logo" className="w-16 h-16 opacity-20 mb-2 brightness-0" />
                                    <span className="text-sm font-medium">이미지가 없습니다</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <span className={`px-3 py-1.5 text-sm font-bold rounded-full shadow-sm backdrop-blur-md ${status === 'active' ? 'bg-green-500/90 text-white' :
                            status === 'scheduled' ? 'bg-blue-500/90 text-white' :
                                'bg-gray-500/90 text-white'
                            }`}>
                            {status === 'active' ? '진행중' :
                                status === 'scheduled' ? '예정' : '마감'}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="relative w-full md:absolute md:top-0 md:right-0 md:bottom-0 md:w-5/12 p-6 flex flex-col bg-white">
                    <div className="flex justify-between items-start mb-4 shrink-0">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{activity.title}</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar pr-2 min-h-[100px] md:min-h-0">
                        <p className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                            {activity.description}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 mt-auto">
                        {/* 정원 표시 (notice, survey 제외) */}
                        {activity.max_capacity && !['notice', 'survey', 'demand_survey'].includes(activity.type) && (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-semibold text-gray-500">모집 현황</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {activity.current_count} <span className="text-gray-400 text-sm font-normal">/ {activity.max_capacity}명</span>
                                    </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${status === 'active' ? 'bg-blue-600' : 'bg-gray-400'}`}
                                        style={{ width: `${Math.min((activity.current_count / activity.max_capacity) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </>
                        )}

                        <button
                            onClick={handleButtonClick}
                            disabled={status !== 'active' || (activity.type === 'event' && isFull)}
                            className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-sm ${getButtonStyle()}`}
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ActivityRegistrationModal
                isOpen={isRegistrationModalOpen}
                onClose={() => setIsRegistrationModalOpen(false)}
                activity={activity}
                onSubmit={handleRegistrationSubmit}
            />


        </>
    )
}
