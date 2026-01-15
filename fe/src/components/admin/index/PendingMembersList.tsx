import { CheckCircle2, Eye, RefreshCw, XCircle } from 'lucide-react'

type PendingMember = {
    id: string
    name: string
    studentId: string
    major: string
    email: string
    phone: string
    joinedAt: string
    verificationImageUrl?: string | null
}

type PendingMembersListProps = {
    members: PendingMember[]
    loading: boolean
    error: string | null
    approvingId: string | null
    rejectingId: string | null
    onRefresh: () => void
    onApprove: (id: string) => void
    onReject: (id: string) => void
    onPreview: (url: string) => void
}

export function PendingMembersList({
    members,
    loading,
    error,
    approvingId,
    rejectingId,
    onRefresh,
    onApprove,
    onReject,
    onPreview,
}: PendingMembersListProps) {
    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">승인 대기 회원</h2>
                    <p className="text-sm text-gray-500">등록 정보 확인 후 승인 또는 거절하세요.</p>
                </div>
                <div className="flex items-center gap-2">
                    {error && <span className="text-sm font-semibold text-rose-600">{error}</span>}
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? '불러오는 중' : '새로고침'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                    승인 대기 회원을 불러오는 중입니다.
                </div>
            ) : error ? (
                <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                    <p className="font-semibold">승인 대기 회원 목록을 불러오지 못했습니다.</p>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <RefreshCw size={16} />
                        다시 시도
                    </button>
                </div>
            ) : members.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                    승인 대기 중인 회원이 없습니다.
                </div>
            ) : (
                <div className="grid gap-3">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-slate-900">{member.name}</span>
                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        승인 대기
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-medium">학번 {member.studentId}</span>
                                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-medium">{member.major}</span>
                                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-medium">{member.email}</span>
                                    <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-medium">{member.phone}</span>
                                </div>
                                <p className="text-xs text-gray-500">신청일 {member.joinedAt}</p>
                            </div>

                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                {member.verificationImageUrl && (
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={member.verificationImageUrl}
                                            alt={`${member.name} 학적 인증 이미지`}
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                            className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onPreview(member.verificationImageUrl as string)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                        >
                                            <Eye size={16} />
                                            원본 보기
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={() => onApprove(member.id)}
                                        disabled={loading || approvingId === member.id || rejectingId === member.id}
                                    >
                                        <CheckCircle2 size={16} className={approvingId === member.id ? 'animate-spin' : ''} />
                                        {approvingId === member.id ? '승인 중...' : '승인'}
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={() => onReject(member.id)}
                                        disabled={loading || rejectingId === member.id || approvingId === member.id}
                                    >
                                        <XCircle size={16} className={rejectingId === member.id ? 'animate-spin' : ''} />
                                        {rejectingId === member.id ? '거절 중...' : '거절'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
