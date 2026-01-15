import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, Shield, Users, XCircle } from 'lucide-react'
import { adminApi } from '../../lib/api/admin'
import type { PendingUserItem, UserListItem, RejectedUserItem, BlockedUserItem } from '../../types/users'
import {
    AdminFilters,
    AdminStatsCards,
    AllMembersTable,
    BlockedMembersList,
    ImagePreviewModal,
    PendingMembersList,
    RejectedMembersList,
} from '../../components/admin/index'

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
    const [previewImage, setPreviewImage] = useState<string | null>(null)

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
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-blue-600">유저 관리 시스템</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">회원 승인 · 역할 · 회비 관리</h1>
                        <p className="text-sm text-gray-500 mt-1">승인 대기, 거절, 차단 상태를 한 화면에서 확인하고 조치할 수 있습니다.</p>
                    </div>
                </div>

                <AdminStatsCards stats={stats} />

                <AdminFilters
                    search={search}
                    onSearchChange={setSearch}
                    roleFilter={roleFilter}
                    onRoleFilterChange={setRoleFilter}
                    duesFilter={duesFilter}
                    onDuesFilterChange={setDuesFilter}
                    view={view}
                    onViewChange={setView}
                />

                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {view === 'pending' && (
                        <PendingMembersList
                            members={filteredPending}
                            loading={pendingLoading}
                            error={pendingError}
                            approvingId={approvingId}
                            rejectingId={rejectingId}
                            onRefresh={fetchPendingMembers}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onPreview={(url) => setPreviewImage(url)}
                        />
                    )}

                    {view === 'all' && (
                        <AllMembersTable
                            members={filteredMembers}
                            loading={membersLoading}
                            error={membersError}
                            editedRoles={editedRoles}
                            roleSavingId={roleSavingId}
                            duesUpdatingId={duesUpdatingId}
                            onRefresh={fetchMembers}
                            onRoleSelect={handleRoleSelect}
                            onRoleSave={handleRoleSave}
                            onToggleDues={handleToggleDues}
                        />
                    )}

                    {view === 'rejected' && (
                        <RejectedMembersList
                            members={filteredRejected}
                            loading={rejectedLoading}
                            error={rejectedError}
                            onRefresh={fetchRejectedMembers}
                        />
                    )}

                    {view === 'blocked' && (
                        <BlockedMembersList
                            members={filteredBlocked}
                            loading={blockedLoading}
                            error={blockedError}
                            unblockingId={unblockingId}
                            onUnblock={handleUnblock}
                            onRefresh={fetchBlockedMembers}
                        />
                    )}
                </div>
            </div>

            <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
        </>
    )
}
