import { LockOpen, RefreshCw } from 'lucide-react'

type BlockedMember = {
    id: string
    name: string
    studentId: string
    major: string
    blockedAt?: string
    blockReason?: string
}

type BlockedMembersListProps = {
    members: BlockedMember[]
    loading: boolean
    error: string | null
    unblockingId: string | null
    onUnblock: (id: string) => void
    onRefresh: () => void
}

export function BlockedMembersList({
    members,
    loading,
    error,
    unblockingId,
    onUnblock,
    onRefresh,
}: BlockedMembersListProps) {
    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">차단된 회원</h2>
                    <p className="text-sm text-gray-500">차단 해제 후 회원 목록으로 복귀시킬 수 있습니다.</p>
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
                    차단된 회원을 불러오는 중입니다.
                </div>
            ) : error ? (
                <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                    <p className="font-semibold">차단된 회원 목록을 불러오지 못했습니다.</p>
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
                        <div
                            key={member.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-semibold text-slate-900">{member.name}</span>
                                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">차단됨</span>
                                    {member.blockReason && (
                                        <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                                            {member.blockReason}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">학번 {member.studentId} · {member.major}</p>
                                <p className="text-xs text-gray-500">차단일 {member.blockedAt || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={() => onUnblock(member.studentId)}
                                    disabled={unblockingId === member.id || loading}
                                >
                                    <LockOpen size={16} className={unblockingId === member.id ? 'animate-spin' : ''} />
                                    {unblockingId === member.id ? '해제 중...' : '차단 해제'}
                                </button>
                            </div>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                            차단된 회원이 없습니다.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
