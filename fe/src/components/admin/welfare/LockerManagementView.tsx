const lockerSummaryCards = [
    {
        title: '배정된 사물함',
        value: '420/480',
        badge: '87.5% 사용 중',
        description: '올 학기 전체 사물함 운영 현황',
    },
    {
        title: '반납 요청',
        value: '18건',
        badge: '이번 주 마감',
        description: '반납 승인 대기 중인 건수',
    },
    {
        title: '연장 신청',
        value: '36건',
        badge: '검토 필요',
        description: '연장 자격 확인 필요 건수',
    },
]

const lockerTimeline = [
    { label: '대여 신청', value: '01.02 ~ 01.09', color: 'border-blue-500 bg-blue-50 text-blue-600' },
    { label: '사용 기간', value: '01.15 ~ 06.21', color: 'border-emerald-500 bg-emerald-50 text-emerald-600' },
    { label: '반납 기간', value: '06.22 ~ 06.28', color: 'border-amber-500 bg-amber-50 text-amber-600' },
]

const lockerRequests = [
    { zone: '어의관 B1', locker: 'B-214', applicant: '김OO', status: '연장 요청', date: '01.10' },
    { zone: '어의관 2F', locker: 'F2-031', applicant: '박OO', status: '반납 요청', date: '01.09' },
    { zone: '창학관 3F', locker: 'C3-118', applicant: '최OO', status: '대기', date: '01.08' },
]

const lockerZones = [
    { title: '어의관', total: 210, available: 12, manager: '총무국' },
    { title: '창학관', total: 150, available: 6, manager: '복지국' },
    { title: '무궁관', total: 120, available: 21, manager: '복지국' },
]

export function LockerManagementView() {
    return (
        <div className="space-y-10">
            <section className="grid gap-6 md:grid-cols-3">
                {lockerSummaryCards.map((card) => (
                    <article key={card.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                        <p className="text-xs font-semibold text-gray-400">{card.title}</p>
                        <div className="mt-3 flex items-end justify-between">
                            <span className="text-3xl font-extrabold text-gray-900">{card.value}</span>
                            <span className="text-xs font-semibold text-emerald-600">{card.badge}</span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">{card.description}</p>
                    </article>
                ))}
            </section>

            <section className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">운영 타임라인</h2>
                                <p className="text-sm text-gray-500">기간을 업데이트하면 사용자 페이지에 바로 반영됩니다.</p>
                            </div>
                            <button className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800">기간 수정</button>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {lockerTimeline.map((stage) => (
                                <div key={stage.label} className={`rounded-2xl border px-4 py-4 text-center ${stage.color}`}>
                                    <p className="text-xs font-semibold uppercase tracking-wide">{stage.label}</p>
                                    <p className="mt-2 text-lg font-bold">{stage.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">사물함 요청</h2>
                                <p className="text-sm text-gray-500">연장 및 반납 요청을 검토해주세요.</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">필터</button>
                                <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500">일괄 처리</button>
                            </div>
                        </div>
                        <div className="mt-6 divide-y divide-gray-100">
                            {lockerRequests.map((req) => (
                                <div key={`${req.zone}-${req.locker}`} className="flex flex-wrap items-center gap-4 py-4 text-sm">
                                    <div className="min-w-[160px]">
                                        <p className="font-semibold text-gray-900">{req.zone}</p>
                                        <p className="text-xs text-gray-400">{req.locker}</p>
                                    </div>
                                    <span className="text-gray-600">신청자 {req.applicant}</span>
                                    <span className="ml-auto text-xs font-semibold text-gray-400">{req.date}</span>
                                    <button
                                        className={`rounded-full px-4 py-1 text-xs font-semibold ${
                                            req.status === '연장 요청'
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : req.status === '반납 요청'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {req.status}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-6">
                        <h3 className="text-lg font-bold text-gray-900">사물함 존 현황</h3>
                        <p className="mt-2 text-sm text-gray-500">존별 가용 수량을 빠르게 파악하세요.</p>
                        <div className="mt-6 space-y-4">
                            {lockerZones.map((zone) => (
                                <div key={zone.title} className="rounded-xl bg-white/80 p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900">{zone.title}</p>
                                        <span className="text-xs text-gray-400">담당 {zone.manager}</span>
                                    </div>
                                    <div className="mt-3 flex items-end justify-between">
                                        <span className="text-2xl font-bold text-gray-900">{zone.total}EA</span>
                                        <span className="text-xs font-semibold text-emerald-600">여유 {zone.available}개</span>
                                    </div>
                                    <div className="mt-3 h-1.5 rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${(zone.available / zone.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                        <h3 className="text-lg font-bold text-gray-900">운영 메모</h3>
                        <p className="mt-2 text-sm text-gray-500">진행 중인 공지나 작업 메모를 남겨보세요.</p>
                        <div className="mt-4 space-y-3 text-sm text-gray-600">
                            <p>• 01.11 전기점검 일정 안내 필요</p>
                            <p>• 반납 유예 대상자 4명 OTP 확인</p>
                            <p>• 신규 사물함 라벨 교체 01.18 예정</p>
                        </div>
                        <button className="mt-6 w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-white">
                            메모 업데이트
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}
