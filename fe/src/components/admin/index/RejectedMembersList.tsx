import { RefreshCw } from 'lucide-react'

type RejectedMember = {
    id: string
    name: string
    studentId: string
    major: string
    rejectionReason?: string
    joinedAt: string
}

type RejectedMembersListProps = {
    members: RejectedMember[]
    loading: boolean
    error: string | null
    onRefresh: () => void
}

export function RejectedMembersList({ members, loading, error, onRefresh }: RejectedMembersListProps) {
    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">거절된 회원</h2>
                    <p className="text-sm text-gray-500">거절 사유를 확인하고 필요 시 재신청을 안내하세요.</p>
                </div>
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

            {loading ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                    거절된 회원을 불러오는 중입니다.
                </div>
            ) : error ? (
                <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                    <p className="font-semibold">거절된 회원 목록을 불러오지 못했습니다.</p>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        <RefreshCw size={16} />
                        다시 시도
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-start justify-between rounded-xl border border-rose-100 bg-rose-50 p-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-rose-800">{member.name}</span>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-700">거절됨</span>
                                </div>
                                <p className="text-sm text-rose-700">학번 {member.studentId} · {member.major}</p>
                                <p className="text-sm text-rose-700">사유: {member.rejectionReason}</p>
                                <p className="text-xs text-rose-600">신청일 {member.joinedAt}</p>
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                            거절된 회원이 없습니다.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
