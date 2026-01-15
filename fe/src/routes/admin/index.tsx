import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    BadgeCheck,
    CheckCircle2,
    Clock3,
    Coins,
    Eye,
    Filter,
    LockOpen,
    RefreshCw,
    Search,
    Shield,
    Users,
    XCircle,
} from 'lucide-react'
import { adminApi } from '../../lib/api/admin'
import type { PendingUserItem, UserListItem, RejectedUserItem, BlockedUserItem } from '../../types/users'

export const Route = createFileRoute('/admin/')({
    component: RouteComponent,
})

type Role = 'student' | 'council' | 'admin'
type MemberStatus = 'pending' | 'active' | 'rejected' | 'blocked'

type Member = {
    id: string
    name: string
    studentId: string
    role: Role
    status: MemberStatus
    major: string
    email: string
    phone: string
    joinedAt: string
    duesPaid: boolean
    rejectionReason?: string
    blockedAt?: string
    verificationImageUrl?: string
}

const mapPendingUserToMember = (user: PendingUserItem): Member => ({
    id: user.id,
    name: user.name,
    studentId: user.student_id,
    role: 'student',
    status: 'pending',
    major: user.department ?? '학과 미정',
    email: user.email,
    phone: user.phone ?? '-',
    joinedAt: user.created_at.slice(0, 10),
    duesPaid: false,
    verificationImageUrl: user.verification_image_url ?? undefined,
})

const mapUserToMember = (user: UserListItem): Member => ({
    id: user.id,
    name: user.name,
    studentId: user.student_id,
    role: (user.role as Role) ?? 'student',
    status: user.verification_status === 'rejected' ? 'rejected' : user.verification_status === 'pending' ? 'pending' : 'active',
    major: user.department ?? '학과 미정',
    email: user.email,
    phone: user.phone ?? '-',
    joinedAt: user.created_at.slice(0, 10),
    duesPaid: Boolean(user.membership_paid),
})

const mapRejectedUserToMember = (user: RejectedUserItem): Member => ({
    id: user.original_user_id ?? String(user.id),
    name: user.name ?? '이름 없음',
    studentId: user.student_id ?? '-',
    role: 'student',
    status: 'rejected',
    major: user.department ?? '학과 미정',
    email: user.email,
    phone: user.phone ?? '-',
    joinedAt: user.rejected_at ? user.rejected_at.slice(0, 10) : '',
    duesPaid: false,
    rejectionReason: user.rejection_reason ?? '승인 거절 처리됨',
})

const mapBlockedUserToMember = (user: BlockedUserItem): Member => ({
    id: String(user.student_id ?? user.id ?? 'unknown'),
    name: user.name ?? '이름 없음',
    studentId: user.student_id ?? '-',
    role: 'student',
    status: 'blocked',
    major: user.department ?? '학과 미정',
    email: user.email ?? '-',
    phone: user.phone ?? '-',
    joinedAt: user.blocked_at ? user.blocked_at.slice(0, 10) : user.block_until ? user.block_until.slice(0, 10) : '',
    duesPaid: false,
    blockedAt: user.block_until ?? user.blocked_at ?? undefined,
    rejectionReason: user.block_reason ?? undefined,
})

function RouteComponent() {
    const [view, setView] = useState<'pending' | 'all' | 'rejected' | 'blocked'>('pending')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
    const [duesFilter, setDuesFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
    const [pendingMembers, setPendingMembers] = useState<Member[]>([])
    const [pendingLoading, setPendingLoading] = useState(false)
    const [pendingError, setPendingError] = useState<string | null>(null)
    const [approvingId, setApprovingId] = useState<string | null>(null)
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [membersLoading, setMembersLoading] = useState(false)
    const [membersError, setMembersError] = useState<string | null>(null)
    const [roleSavingId, setRoleSavingId] = useState<string | null>(null)
    const [editedRoles, setEditedRoles] = useState<Record<string, Role>>({})
    const [duesUpdatingId, setDuesUpdatingId] = useState<string | null>(null)
    const [rejectedMembers, setRejectedMembers] = useState<Member[]>([])
    const [rejectedLoading, setRejectedLoading] = useState(false)
    const [rejectedError, setRejectedError] = useState<string | null>(null)
    const [blockedMembers, setBlockedMembers] = useState<Member[]>([])
    const [blockedLoading, setBlockedLoading] = useState(false)
    const [blockedError, setBlockedError] = useState<string | null>(null)
    const [unblockingId, setUnblockingId] = useState<string | null>(null)

    const fetchPendingMembers = useCallback(async () => {
        setPendingLoading(true)
        setPendingError(null)
        try {
            const data = await adminApi.getPendingUsers()
            const mapped = data.users.map(mapPendingUserToMember)
            setPendingMembers(mapped)
        } catch (error) {
            console.error('승인 대기 회원 조회 실패:', error)
            setPendingError('승인 대기 회원 목록을 불러오지 못했습니다.')
        } finally {
            setPendingLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPendingMembers()
    }, [fetchPendingMembers])

    const fetchBlockedMembers = useCallback(async () => {
        setBlockedLoading(true)
        setBlockedError(null)
        try {
            const data = await adminApi.getBlockedUsers()
            const usersPayload =
                Array.isArray(data) ? data :
                Array.isArray((data as { blocked_users?: unknown })?.blocked_users) ? (data as { blocked_users: unknown[] }).blocked_users :
                Array.isArray((data as { users?: unknown })?.users) ? (data as { users: unknown[] }).users :
                Array.isArray((data as { items?: unknown })?.items) ? (data as { items: unknown[] }).items :
                []
            const mapped = (usersPayload as BlockedUserItem[]).map(mapBlockedUserToMember)
            setBlockedMembers(mapped)
        } catch (error) {
            console.error('차단 회원 조회 실패:', error)
            setBlockedError('차단된 회원 목록을 불러오지 못했습니다.')
        } finally {
            setBlockedLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBlockedMembers()
    }, [fetchBlockedMembers])

    const fetchRejectedMembers = useCallback(async () => {
        setRejectedLoading(true)
        setRejectedError(null)
        try {
            const data = await adminApi.getRejectedUsers()
            const items = Array.isArray(data?.items) ? data.items : []
            const mapped = items.map(mapRejectedUserToMember)
            setRejectedMembers(mapped)
        } catch (error) {
            console.error('거절 회원 조회 실패:', error)
            setRejectedError('거절된 회원 목록을 불러오지 못했습니다.')
        } finally {
            setRejectedLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchRejectedMembers()
    }, [fetchRejectedMembers])

    const fetchMembers = useCallback(async () => {
        setMembersLoading(true)
        setMembersError(null)
        try {
            const data = await adminApi.getUsers({
                role: roleFilter === 'all' ? null : roleFilter,
                membership_paid: duesFilter === 'all' ? null : duesFilter === 'paid',
                verification_status: null,
            })
            const mapped = data.users.map(mapUserToMember)
            setMembers(mapped)
            setEditedRoles({})
        } catch (error) {
            console.error('회원 목록 조회 실패:', error)
            setMembersError('회원 목록을 불러오지 못했습니다.')
        } finally {
            setMembersLoading(false)
        }
    }, [roleFilter, duesFilter])

    useEffect(() => {
        fetchMembers()
    }, [fetchMembers])

    const filterBySearch = <T extends Member>(list: T[]) => {
        const term = search.trim().toLowerCase()
        if (!term) return list

        return list.filter((member) =>
            [member.name, member.studentId, member.major, member.email, member.phone]
                .some((value) => value.toLowerCase().includes(term))
        )
    }

    const filteredPending = useMemo(
        () => filterBySearch(pendingMembers),
        [pendingMembers, search]
    )

    const filteredMembers = useMemo(() => {
        return filterBySearch(members).filter((member) => {
            const matchesRole = roleFilter === 'all' || member.role === roleFilter
            const matchesDues =
                duesFilter === 'all' ||
                (duesFilter === 'paid' ? member.duesPaid : !member.duesPaid)
            return matchesRole && matchesDues
        })
    }, [members, search, roleFilter, duesFilter])

    const filteredRejected = useMemo(
        () => filterBySearch(rejectedMembers),
        [rejectedMembers, search]
    )
    const filteredBlocked = useMemo(
        () => filterBySearch(blockedMembers),
        [blockedMembers, search]
    )

    const handleApprove = async (id: string) => {
        setApprovingId(id)
        try {
            await adminApi.approveUser(id)
            await fetchPendingMembers()
        } catch (error) {
            console.error('회원 승인 실패:', error)
            alert('회원 승인에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setApprovingId(null)
        }
    }

    const handleReject = async (id: string) => {
        const reasonInput = window.prompt('거절 사유를 입력하세요.')
        if (reasonInput === null) return

        const reason = reasonInput.trim()
        if (!reason) {
            alert('거절 사유는 필수입니다.')
            return
        }

        setRejectingId(id)
        try {
            await adminApi.rejectUser(id, reason)
            await fetchPendingMembers()
            await fetchRejectedMembers()
        } catch (error) {
            console.error('회원 거절 실패:', error)
            alert('회원 거절에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setRejectingId(null)
        }
    }

    const handleRoleSelect = (id: string, nextRole: Role) => {
        setEditedRoles((prev) => ({ ...prev, [id]: nextRole }))
    }

    const handleRoleSave = async (id: string) => {
        const currentRole = members.find((member) => member.id === id)?.role
        const nextRole = editedRoles[id] ?? currentRole

        if (!currentRole || !nextRole || currentRole === nextRole) return

        if (nextRole !== 'student' && nextRole !== 'admin') return

        setRoleSavingId(id)
        try {
            await adminApi.updateUserRole(id, nextRole)
            setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role: nextRole } : member)))
            setEditedRoles((prev) => {
                const updated = { ...prev }
                delete updated[id]
                return updated
            })
        } catch (error) {
            console.error('역할 변경 실패:', error)
            alert('역할 변경에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setRoleSavingId(null)
        }
    }

    const handleToggleDues = async (id: string) => {
        const target = members.find((member) => member.id === id)
        if (!target) return

        const nextPaid = !target.duesPaid
        setDuesUpdatingId(id)
        setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, duesPaid: nextPaid } : member)))

        try {
            await adminApi.updateMembershipPaid(id, nextPaid)
        } catch (error) {
            console.error('회비 상태 변경 실패:', error)
            alert('회비 상태 변경에 실패했습니다. 다시 시도해주세요.')
            setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, duesPaid: target.duesPaid } : member)))
        } finally {
            setDuesUpdatingId(null)
        }
    }

    const handleUnblock = async (id: string) => {
        const target = blockedMembers.find((m) => m.id === id)
        setUnblockingId(id)
        try {
            await adminApi.unblockUser(id)
            setBlockedMembers((prev) => prev.filter((m) => m.id !== id))
            if (target) {
                setMembers((membersState) => [
                    ...membersState,
                    { ...target, status: 'active', blockedAt: undefined, joinedAt: target.joinedAt || new Date().toISOString().slice(0, 10) },
                ])
            }
        } catch (error) {
            console.error('차단 해제 실패:', error)
            alert('차단 해제에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setUnblockingId(null)
        }
    }

    const stats = [
        {
            label: '승인 대기',
            value: pendingMembers.length,
            color: 'bg-amber-50 text-amber-700',
            icon: Clock3,
        },
        {
            label: '전체 회원',
            value: members.length,
            color: 'bg-sky-50 text-sky-700',
            icon: Users,
        },
        {
            label: '거절됨',
            value: rejectedMembers.length,
            color: 'bg-rose-50 text-rose-700',
            icon: XCircle,
        },
        {
            label: '차단됨',
            value: blockedMembers.length,
            color: 'bg-slate-100 text-slate-700',
            icon: Shield,
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-blue-600">유저 관리 시스템</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">회원 승인 · 역할 · 회비 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">승인 대기, 거절, 차단 상태를 한 화면에서 확인하고 조치할 수 있습니다.</p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-1">실시간 상태 반영</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full flex-1 min-w-[240px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="이름, 학번, 전공, 연락처로 검색"
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                        <Filter size={16} className="text-gray-500" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
                            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
                        >
                            <option value="all">전체 역할</option>
                            <option value="student">학생</option>
                            <option value="admin">관리자</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                        <Coins size={16} className="text-gray-500" />
                        <select
                            value={duesFilter}
                            onChange={(e) => setDuesFilter(e.target.value as 'all' | 'paid' | 'unpaid')}
                            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
                        >
                            <option value="all">회비 전체</option>
                            <option value="paid">회비 납부</option>
                            <option value="unpaid">미납</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 py-1">
                        {[
                            { key: 'pending', label: '승인 대기' },
                            { key: 'all', label: '전체 회원' },
                            { key: 'rejected', label: '거절' },
                            { key: 'blocked', label: '차단' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setView(item.key as typeof view)}
                                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                    view === item.key
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-700 hover:bg-white'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                {view === 'pending' && (
                    <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">승인 대기 회원</h2>
                                <p className="text-sm text-gray-500">등록 정보 확인 후 승인 또는 거절하세요.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {pendingError && <span className="text-sm font-semibold text-rose-600">{pendingError}</span>}
                                <button
                                    type="button"
                                    onClick={fetchPendingMembers}
                                    disabled={pendingLoading}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCw size={16} className={pendingLoading ? 'animate-spin' : ''} />
                                    {pendingLoading ? '불러오는 중' : '새로고침'}
                                </button>
                            </div>
                        </div>

                        {pendingLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                                승인 대기 회원을 불러오는 중입니다.
                            </div>
                        ) : pendingError ? (
                            <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                                <p className="font-semibold">승인 대기 회원 목록을 불러오지 못했습니다.</p>
                                <button
                                    type="button"
                                    onClick={fetchPendingMembers}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    <RefreshCw size={16} />
                                    다시 시도
                                </button>
                            </div>
                        ) : filteredPending.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                                승인 대기 중인 회원이 없습니다.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredPending.map((member) => (
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
                                                <a
                                                    href={member.verificationImageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    <Eye size={16} />
                                                    학적인증
                                                </a>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    onClick={() => handleApprove(member.id)}
                                                    disabled={pendingLoading || approvingId === member.id || rejectingId === member.id}
                                                >
                                                    <CheckCircle2 size={16} className={approvingId === member.id ? 'animate-spin' : ''} />
                                                    {approvingId === member.id ? '승인 중...' : '승인'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    onClick={() => handleReject(member.id)}
                                                    disabled={pendingLoading || rejectingId === member.id || approvingId === member.id}
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
                )}

                {view === 'all' && (
                    <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">전체 회원</h2>
                                <p className="text-sm text-gray-500">역할 변경, 회비 납부 상태를 즉시 조정할 수 있습니다.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {membersError && <span className="text-sm font-semibold text-rose-600">{membersError}</span>}
                                <button
                                    type="button"
                                    onClick={fetchMembers}
                                    disabled={membersLoading}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCw size={16} className={membersLoading ? 'animate-spin' : ''} />
                                    {membersLoading ? '불러오는 중' : '새로고침'}
                                </button>
                            </div>
                        </div>

                        {membersLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                                회원 목록을 불러오는 중입니다.
                            </div>
                        ) : membersError ? (
                            <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                                <p className="font-semibold">회원 목록을 불러오지 못했습니다.</p>
                                <button
                                    type="button"
                                    onClick={fetchMembers}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    <RefreshCw size={16} />
                                    다시 시도
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                                <table className="min-w-full divide-y divide-slate-100 text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">회원</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">역할</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">회비</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">연락처</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">가입일</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredMembers.map((member) => (
                                            <tr key={member.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900">{member.name}</span>
                                                        <span className="text-xs text-gray-500">학번 {member.studentId} · {member.major}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={editedRoles[member.id] ?? member.role}
                                                            onChange={(e) => handleRoleSelect(member.id, e.target.value as Role)}
                                                            disabled={membersLoading}
                                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <option value="student">학생</option>
                                                            <option value="admin">관리자</option>
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRoleSave(member.id)}
                                                            disabled={
                                                                membersLoading ||
                                                                roleSavingId === member.id ||
                                                                (editedRoles[member.id] ?? member.role) === member.role
                                                            }
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <BadgeCheck size={14} className={roleSavingId === member.id ? 'animate-spin' : ''} />
                                                            저장
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                                                            member.duesPaid
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}
                                                        onClick={() => handleToggleDues(member.id)}
                                                        disabled={duesUpdatingId === member.id || membersLoading}
                                                    >
                                                        <Coins size={16} className={duesUpdatingId === member.id ? 'animate-spin' : ''} />
                                                        {member.duesPaid ? '납부' : '미납'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col text-sm text-gray-700">
                                                        <span>{member.email}</span>
                                                        <span className="text-xs text-gray-500">{member.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{member.joinedAt}</td>
                                            </tr>
                                        ))}
                                        {filteredMembers.length === 0 && (
                                            <tr>
                                                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>
                                                    조건에 맞는 회원이 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {view === 'rejected' && (
                    <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">거절된 회원</h2>
                                <p className="text-sm text-gray-500">거절 사유를 확인하고 필요 시 재신청을 안내하세요.</p>
                            </div>
                        </div>

                        {rejectedLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                                거절된 회원을 불러오는 중입니다.
                            </div>
                        ) : rejectedError ? (
                            <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                                <p className="font-semibold">거절된 회원 목록을 불러오지 못했습니다.</p>
                                <button
                                    type="button"
                                    onClick={fetchRejectedMembers}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    <RefreshCw size={16} />
                                    다시 시도
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredRejected.map((member) => (
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
                                {filteredRejected.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                                        거절된 회원이 없습니다.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {view === 'blocked' && (
                    <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">차단된 회원</h2>
                                <p className="text-sm text-gray-500">차단 해제 후 회원 목록으로 복귀시킬 수 있습니다.</p>
                            </div>
                        </div>

                        {blockedLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                                차단된 회원을 불러오는 중입니다.
                            </div>
                        ) : blockedError ? (
                            <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                                <p className="font-semibold">차단된 회원 목록을 불러오지 못했습니다.</p>
                                <button
                                    type="button"
                                    onClick={fetchBlockedMembers}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    <RefreshCw size={16} />
                                    다시 시도
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredBlocked.map((member) => (
                                    <div key={member.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-semibold text-slate-900">{member.name}</span>
                                                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">차단됨</span>
                                            </div>
                                            <p className="text-sm text-gray-600">학번 {member.studentId} · {member.major}</p>
                                            <p className="text-xs text-gray-500">차단일 {member.blockedAt || '-'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                onClick={() => handleUnblock(member.id)}
                                                disabled={unblockingId === member.id || blockedLoading}
                                            >
                                                <LockOpen size={16} className={unblockingId === member.id ? 'animate-spin' : ''} />
                                                {unblockingId === member.id ? '해제 중...' : '차단 해제'}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {filteredBlocked.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-gray-500">
                                        차단된 회원이 없습니다.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
