import { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import type { Activity, ActivityListItem } from '../../types/activities'
import { getActivityStatus } from '../../types/activities'
import { ActivityRegistrationModal } from './modals'
import { useQueryClient } from '@tanstack/react-query'
import { activityKeys } from '../../hooks/queries/useActivities'

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
    const [currentTime, setCurrentTime] = useState(Date.now())
    const queryClient = useQueryClient()

    // 1초마다 현재 시간 업데이트 (남은 시간 실시간 표시용 & 상태 자동 업데이트용)
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000) // 1초마다 업데이트

        return () => clearInterval(timer)
    }, [])

    // currentTime이 1초마다 업데이트되므로, status도 매초 재계산되어 실시간으로 반영됨
    const status = getActivityStatus(activity)

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

    const handleRegistrationSubmit = async (_data: unknown) => {
        // 성공적으로 신청 완료 시 쿼리 무효화 -> 데이터 최신화
        await queryClient.invalidateQueries({ queryKey: activityKeys.all })
    }

    // 남은 시간 계산 함수
    const getTimeRemaining = (targetDate: string): string => {
        const target = new Date(targetDate).getTime()
        const diff = target - currentTime

        if (diff <= 0) return ''

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        if (days > 0) {
            return `${days}일 ${hours}시간`
        } else if (hours > 0) {
            return `${hours}시간 ${minutes}분`
        } else if (minutes > 0) {
            return `${minutes}분`
        } else {
            return `${seconds}초`
        }
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
        // 종료된 경우
        if (status === 'closed') return '종료되었습니다'

        // 오픈 예정인 경우 - 남은 시간 표시
        if (status === 'scheduled' && activity.registration_start) {
            const remaining = getTimeRemaining(activity.registration_start)
            return remaining ? `오픈까지 ${remaining}` : '오픈 예정입니다'
        }

        // 진행중인 경우
        if (status === 'active') {
            // 공지사항
            if (activity.type === 'notice') {
                return '공지 확인하기'
            }

            // 정원 마감
            if (activity.type === 'event' && isFull) {
                return '마감되었습니다'
            }

            // 타입별 기본 텍스트
            switch (activity.type) {
                case 'kakao_invite':
                    return '카톡방 초대 신청'
                case 'survey':
                    return '설문 참여하기'
                case 'demand_survey':
                    return '수요조사 참여하기'
                case 'event':
                default:
                    return '참여 신청하기'
            }
        }

        return '참여 신청하기'
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
            <div className={`flex flex-col md:flex-row items-stretch bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Image Section */}
                <div className="w-full md:w-7/12 relative group bg-gray-100 dark:bg-slate-800">
                    <div className="relative w-full" style={{ paddingBottom: '133%' }}>
                        <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-slate-800">
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
                                        <SwiperSlide key={idx} className="bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
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
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                    <img src="/assets/logo.svg" alt="Logo" className="w-16 h-16 opacity-20 mb-2 brightness-0 dark:brightness-200" />
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
                <div className="w-full md:w-5/12 p-6 flex flex-col bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-start mb-2 shrink-0">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{activity.title}</h2>
                    </div>

                    {/* 신청 기간 정보 (상단 이동) */}
                    {(activity.registration_start || activity.registration_end) && (
                        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">신청 기간</span>
                            <span className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-1"></span>
                            <span className="font-medium font-numeric tracking-tight truncate">
                                {activity.registration_start ? new Date(activity.registration_start).toLocaleString('ko-KR', {
                                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                                }) : ''}
                                <span className="mx-1 text-gray-400">~</span>
                                {activity.registration_end ? new Date(activity.registration_end).toLocaleString('ko-KR', {
                                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                                }) : ''}
                            </span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar pr-2 min-h-[100px] md:min-h-0">
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap break-words">
                            <span className="text-base">{activity.description}</span>
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-5 mt-auto">
                        {/* 정원 표시 (notice, survey 제외) */}
                        {activity.max_capacity && !['notice', 'survey', 'demand_survey'].includes(activity.type) && (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">모집 현황</span>
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {activity.current_count} <span className="text-gray-400 dark:text-gray-500 text-sm font-normal">/ {activity.max_capacity}명</span>
                                    </span>
                                </div>

                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mb-5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${status === 'active' ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-400 dark:bg-slate-600'}`}
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
