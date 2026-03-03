import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, Shield, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
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
} from '../../components/members/admin/list'

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
    blockReason?: string
    verificationImageUrl?: string
}

const formatDateTime = (date: string | null | undefined) => {
    if (!date) return undefined
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date.slice ? date.slice(0, 10) : undefined
    return parsed.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

const translateBlockReason = (reason?: string | null) => {
    if (!reason) return undefined
    switch (reason) {
        case 'permanent':
            return '영구'
        case '10_minutes':
            return '10분'
        case '1_hour':
        case '1_hours':
            return '1시간'
        default:
            return reason
    }
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
    status: user.is_banned ? 'blocked' : user.verification_status === 'rejected' ? 'rejected' : user.verification_status === 'pending' ? 'pending' : 'active',
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
    joinedAt: formatDateTime(user.blocked_at) ?? formatDateTime(user.block_until) ?? '',
    duesPaid: false,
    blockedAt: formatDateTime(user.created_at) ?? formatDateTime(user.blocked_at) ?? formatDateTime(user.block_until),
    rejectionReason: user.block_reason ?? undefined,
    blockReason: translateBlockReason(user.block_reason),
})

function RouteComponent() {
    const [view, setView] = useState<'pending' | 'all' | 'rejected' | 'blocked'>('all')
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

    // 회원 통계: 백엔드 /admin/stats API에서 만아는 전체 집계 값
    const [userStats, setUserStats] = useState<{
        total_users: number
        pending_users: number
        approved_users: number
        rejected_users: number
        membership_paid: number
        banned_users: number
    } | null>(null)

    // Pagination State
    const [pendingPage, setPendingPage] = useState(1)
    const [pendingTotal, setPendingTotal] = useState(0)
    const PENDING_LIMIT = 10

    const [membersPage, setMembersPage] = useState(1)
    const [membersTotal, setMembersTotal] = useState(0)
    const MEMBERS_LIMIT = 20

    // 회원 통계 데이터를 /admin/stats API에서 불러옵니다.
    // 페이지네이션된 목록(최대 20개)를 기준으로 통계를 계산하는 버그를 수정합니다.
    const fetchUserStats = useCallback(async () => {
        try {
            const data = await adminApi.getStats()
            setUserStats(data)
        } catch (error) {
            console.error('회원 통계 조회 실패:', error)
            // 통계 API 실패 시 페이지네이션 기반 집계 값으로 폴백 (setUserStats null 유지)
        }
    }, [])

    useEffect(() => {
        fetchUserStats()
    }, [fetchUserStats])

    const fetchPendingMembers = useCallback(async () => {
        setPendingLoading(true)
        setPendingError(null)
        try {
            const data = await adminApi.getPendingUsers({ page: pendingPage, limit: PENDING_LIMIT })
            const mapped = data.users.map(mapPendingUserToMember)
            setPendingMembers(mapped)
            setPendingTotal(data.total)
        } catch (error) {
            console.error('승인 대기 회원 조회 실패:', error)
            setPendingError('승인 대기 회원 목록을 불러오지 못했습니다.')
        } finally {
            setPendingLoading(false)
        }
    }, [pendingPage])

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
                page: membersPage,
                limit: MEMBERS_LIMIT,
            })
            const mapped = data.users.map(mapUserToMember)
            setMembers(mapped)
            setMembersTotal(data.total)
            setEditedRoles({})
        } catch (error) {
            console.error('회원 목록 조회 실패:', error)
            setMembersError('회원 목록을 불러오지 못했습니다.')
        } finally {
            setMembersLoading(false)
        }
    }, [roleFilter, duesFilter, membersPage])

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
            // 승인 후 통계 재조회
            await fetchUserStats()
            toast.success('회원 승인이 완료되었습니다.')
        } catch (error) {
            console.error('회원 승인 실패:', error)
            toast.error('회원 승인에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setApprovingId(null)
        }
    }

    const handleReject = async (id: string) => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: '회원 가입 거절',
            input: 'textarea',
            inputLabel: '거절 사유를 입력하세요',
            inputPlaceholder: '거절 사유를 상세히 입력해주세요...',
            inputAttributes: {
                'aria-label': '거절 사유'
            },
            showCancelButton: true,
            confirmButtonText: '거절',
            cancelButtonText: '취소',
            confirmButtonColor: '#ef4444',
            inputValidator: (value) => {
                if (!value?.trim()) {
                    return '거절 사유는 필수입니다.'
                }
            }
        })

        if (!isConfirmed || !reason) return

        setRejectingId(id)
        try {
            await adminApi.rejectUser(id, reason.trim())
            await fetchPendingMembers()
            await fetchRejectedMembers()
            // 거절 후 통계 재조회
            await fetchUserStats()
            toast.success('회원 가입이 거절되었습니다.')
        } catch (error) {
            console.error('회원 거절 실패:', error)
            toast.error('회원 거절에 실패했습니다. 다시 시도해주세요.')
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
            toast.success('역할이 변경되었습니다.')
        } catch (error) {
            console.error('역할 변경 실패:', error)
            toast.error('역할 변경에 실패했습니다. 다시 시도해주세요.')
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
            toast.success(`회비 상태가 ${nextPaid ? '납부' : '미납'}로 변경되었습니다.`)
        } catch (error) {
            console.error('회비 상태 변경 실패:', error)
            toast.error('회비 상태 변경에 실패했습니다. 다시 시도해주세요.')
            setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, duesPaid: target.duesPaid } : member)))
        } finally {
            setDuesUpdatingId(null)
        }
    }

    const handleUnblock = async (id: string) => {
        const target = blockedMembers.find((m) => m.id === id)
        const studentId = target?.studentId ?? id
        setUnblockingId(id)
        try {
            await adminApi.unblockUser(studentId)
            setBlockedMembers((prev) => prev.filter((m) => m.id !== id))
            if (target) {
                setMembers((membersState) => [
                    ...membersState,
                    { ...target, status: 'active', blockedAt: undefined, joinedAt: target.joinedAt || new Date().toISOString().slice(0, 10) },
                ])
            }
            toast.success('차단이 해제되었습니다.')
        } catch (error) {
            console.error('차단 해제 실패:', error)
            toast.error('차단 해제에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setUnblockingId(null)
        }
    }

    const handleBanUser = async (id: string, name: string) => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: `"${name}" 회원 차단`,
            html: '<p class="text-sm text-gray-600 mb-4">차단된 회원은 로그인할 수 없습니다.</p>',
            input: 'textarea',
            inputLabel: '차단 사유',
            inputPlaceholder: '차단 사유를 상세히 입력해주세요...',
            inputAttributes: {
                'aria-label': '차단 사유'
            },
            showCancelButton: true,
            confirmButtonText: '차단',
            cancelButtonText: '취소',
            confirmButtonColor: '#f97316',
            icon: 'warning',
            inputValidator: (value) => {
                if (!value?.trim()) {
                    return '차단 사유는 필수입니다.'
                }
            }
        })

        if (!isConfirmed || !reason) return

        try {
            await adminApi.banUser(id, reason.trim())
            toast.success('회원이 차단되었습니다.')
            await fetchMembers()
            await fetchBlockedMembers()
        } catch (error) {
            console.error('회원 차단 실패:', error)
            toast.error('회원 차단에 실패했습니다. 다시 시도해주세요.')
        }
    }

    const handleUnbanUser = async (id: string, name: string) => {
        const { isConfirmed } = await Swal.fire({
            title: `"${name}" 회원 차단 해제`,
            text: '차단을 해제하시겠습니까?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '해제',
            cancelButtonText: '취소',
            confirmButtonColor: '#10b981',
        })

        if (!isConfirmed) return

        try {
            await adminApi.unbanUser(id)
            toast.success('차단이 해제되었습니다.')
            await fetchMembers()
            await fetchBlockedMembers()
        } catch (error) {
            console.error('차단 해제 실패:', error)
            toast.error('차단 해제에 실패했습니다. 다시 시도해주세요.')
        }
    }

    const handleDeleteUser = async (id: string, name: string) => {
        const result = await Swal.fire({
            title: `"${name}" 회원 영구 삭제`,
            html: `
                <div class="text-left space-y-2">
                    <p class="text-red-600 font-semibold">⚠️ 경고: 이 작업은 되돌릴 수 없습니다</p>
                    <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
                        <li>회원의 모든 데이터가 영구적으로 삭제됩니다</li>
                        <li>작성한 게시글, 댓글 등 모든 활동 기록이 삭제됩니다</li>
                        <li>복구가 불가능합니다</li>
                    </ul>
                </div>
            `,
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            confirmButtonColor: '#dc2626',
            input: 'checkbox',
            inputValue: 0,
            inputPlaceholder: '위 내용을 확인했으며 삭제에 동의합니다',
            inputValidator: (result) => {
                return !result && '삭제하려면 확인란에 체크해주세요'
            }
        })

        if (!result.isConfirmed) return

        try {
            await adminApi.deleteUser(id)
            toast.success('회원이 삭제되었습니다.')
            await fetchMembers()
        } catch (error) {
            console.error('회원 삭제 실패:', error)
            toast.error('회원 삭제에 실패했습니다. 다시 시도해주세요.')
        }
    }

    const handlePreview = async (path: string) => {
        try {
            const { signed_url } = await adminApi.getSignedUrl(path)
            setPreviewImage(signed_url)
        } catch (error) {
            console.error('이미지 로딩 실패:', error)
            toast.error('이미지를 불러올 수 없습니다. 다시 시도해주세요.')
        }
    }

    // 통계 카드: userStats가 있으면 백엔드 집계 값 사용, 없으면 페이지네이션 기반 별도 집계 값으로 폴백
    const stats = [
        {
            label: '승인 대기',
            // pendingTotal: 페이지네이션 count(DB 전체 합계).
            // userStats.pending_users: /admin/stats API 값으로 더 정확함.
            value: userStats?.pending_users ?? pendingTotal,
            color: 'bg-amber-50 text-amber-700',
            icon: Clock3,
        },
        {
            label: '전체 회원',
            // membersTotal은 필터 적용 시 부정확할 수 있으므로 /admin/stats API 값 사용.
            value: userStats?.total_users ?? membersTotal,
            color: 'bg-sky-50 text-sky-700',
            icon: Users,
        },
        {
            label: '거절됨',
            // rejectedMembers.length는 한 페이지분만 반영.
            // userStats.rejected_users: rejected_users 테이블 전체 행 수.
            value: userStats?.rejected_users ?? rejectedMembers.length,
            color: 'bg-rose-50 text-rose-700',
            icon: XCircle,
        },
        {
            label: '차단됨',
            // blocked users는 저량 없이 모두 불러오도록 설계되어 있어 blockedMembers.length이 정확.
            // userStats.banned_users로 더 안정적으로 대체.
            value: userStats?.banned_users ?? blockedMembers.length,
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
                            onPreview={handlePreview}
                            page={pendingPage}
                            totalPages={Math.ceil(pendingTotal / PENDING_LIMIT)}
                            onPageChange={setPendingPage}
                        />
                    )}

                    {view === 'all' && (
                        <AllMembersTable
                            members={filteredMembers.map(m => ({
                                id: m.id,
                                name: m.name,
                                studentId: m.studentId,
                                major: m.major,
                                email: m.email,
                                phone: m.phone,
                                role: m.role,
                                duesPaid: m.duesPaid,
                                isBanned: m.status === 'blocked',
                                joinedAt: m.joinedAt
                            }))}
                            loading={membersLoading}
                            error={membersError}
                            editedRoles={editedRoles}
                            roleSavingId={roleSavingId}
                            duesUpdatingId={duesUpdatingId}
                            onRefresh={fetchMembers}
                            onRoleSelect={handleRoleSelect}
                            onRoleSave={handleRoleSave}
                            onToggleDues={handleToggleDues}
                            onBanUser={handleBanUser}
                            onUnbanUser={handleUnbanUser}
                            onDeleteUser={handleDeleteUser}
                            page={membersPage}
                            totalPages={Math.ceil(membersTotal / MEMBERS_LIMIT)}
                            onPageChange={setMembersPage}
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
