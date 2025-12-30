import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import type { Event } from '../../types/events'

// Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

interface EventCardProps {
    event: Event
    isActive?: boolean
}

export const EventCard = ({ event, isActive }: EventCardProps) => {
    // 이미지가 없거나 비어있는 경우, 단일 이미지 또는 플레이스홀더 사용
    const displayImages = event.images && event.images.length > 0
        ? event.images
        : [event.image || 'https://via.placeholder.com/600x450']

    return (
        <div className={`flex flex-row bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
            {/* Image Section - Left Side */}
            <div className="w-7/12 relative group bg-gray-100">
                {/* 4:5 Aspect Ratio Container using Padding Hack for cross-browser consistency */}
                <div className="relative w-full" style={{ paddingBottom: '125%' }}>
                    <div className="absolute inset-0 w-full h-full">
                        <Swiper
                            modules={[Pagination, Navigation]}
                            pagination={{ clickable: true }}
                            navigation={true}
                            className="w-full h-full"
                            spaceBetween={0}
                            slidesPerView={1}
                        >
                            {displayImages.map((img, idx) => (
                                <SwiperSlide key={idx}>
                                    <img
                                        src={img}
                                        alt={`${event.title} - ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>

                <div className="absolute top-4 left-4 z-10">
                    <span className={`px-3 py-1.5 text-sm font-bold rounded-full shadow-sm backdrop-blur-md ${event.status === 'active' ? 'bg-green-500/90 text-white' :
                        event.status === 'scheduled' ? 'bg-blue-500/90 text-white' :
                            'bg-gray-500/90 text-white'
                        }`}>
                        {event.status === 'active' ? '진행중' :
                            event.status === 'scheduled' ? '예정' : '마감'}
                    </span>
                </div>
            </div>

            {/* Content Section - Right Side */}
            <div className="absolute top-0 right-0 bottom-0 w-5/12 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4 shrink-0">
                    <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{event.title}</h2>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar pr-2">
                    <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                        {event.description}
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 mt-auto">
                    {!['notice', 'survey', 'kakao', 'payment'].includes(event.category || '') && (
                        <>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-gray-500">
                                    모집 현황
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                    {event.currentCount} <span className="text-gray-400 text-sm font-normal">/ {event.maxCount}명</span>
                                </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${event.status === 'active' ? 'bg-blue-600' : 'bg-gray-400'
                                        }`}
                                    style={{ width: `${Math.min((event.currentCount / event.maxCount) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </>
                    )}

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (event.status !== 'active') return;

                            if (event.category === 'survey' || event.category === 'kakao' || event.category === 'payment' || event.category === 'notice') {
                                if (event.externalUrl) window.open(event.externalUrl, '_blank');
                                return;
                            }
                        }}
                        disabled={event.status !== 'active' || (event.category !== 'notice' && event.category !== 'survey' && event.category !== 'payment' && event.currentCount >= event.maxCount)}
                        className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-sm ${event.status !== 'active'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : event.category === 'notice'
                                ? 'bg-gray-800 text-white hover:bg-gray-900'
                                : event.category === 'kakao'
                                    ? 'bg-[#FEE500] text-[#000000] hover:bg-[#FDD835]'
                                    : event.category === 'survey'
                                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                                        : event.category === 'payment'
                                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                                            : event.currentCount >= event.maxCount
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
                            }`}
                    >
                        {(() => {
                            if (event.status === 'closed') return '종료되었습니다';
                            if (event.status === 'scheduled') return '오픈 예정입니다';

                            switch (event.category) {
                                case 'notice': return '공지 확인하기';
                                case 'kakao': return '카톡방 초대 신청';
                                case 'survey': return '설문 참여하기';
                                case 'payment': return '학생회비 납부 신청';
                                case 'register':
                                default:
                                    return event.currentCount >= event.maxCount ? '마감되었습니다' : '참여 신청하기';
                            }
                        })()}
                    </button>
                </div>
            </div>
        </div>
    )
}