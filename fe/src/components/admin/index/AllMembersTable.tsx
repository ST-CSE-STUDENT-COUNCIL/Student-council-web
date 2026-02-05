import { BadgeCheck, Coins, RefreshCw } from 'lucide-react'

type RoleValue = 'student' | 'admin' | 'council'

type MemberRow = {
    id: string
    name: string
    studentId: string
    major: string
    email: string
    phone: string
    role: RoleValue
    duesPaid: boolean
    joinedAt: string
}

type AllMembersTableProps = {
    members: MemberRow[]
    loading: boolean
    error: string | null
    editedRoles: Record<string, RoleValue>
    roleSavingId: string | null
    duesUpdatingId: string | null
    onRefresh: () => void
    onRoleSelect: (id: string, role: 'student' | 'admin') => void
    onRoleSave: (id: string) => void
    onToggleDues: (id: string) => void
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

import { Pagination } from '../../ui/Pagination'

const formatPhone = (phone: string) => {
    const digits = (phone ?? '').replace(/\D/g, '')
    if (!digits) return phone || '-'
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    return phone
}

export function AllMembersTable({
    members,
    loading,
    error,
    editedRoles,
    roleSavingId,
    duesUpdatingId,
    onRefresh,
    onRoleSelect,
    onRoleSave,
    onToggleDues,
    page,
    totalPages,
    onPageChange,
}: AllMembersTableProps) {
    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">전체 회원</h2>
                    <p className="text-sm text-gray-500">역할 변경, 회비 납부 상태를 즉시 조정할 수 있습니다.</p>
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
                    회원 목록을 불러오는 중입니다.
                </div>
            ) : error ? (
                <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                    <p className="font-semibold">회원 목록을 불러오지 못했습니다.</p>
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
                <>
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
                                {members.map((member) => (
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
                                                    onChange={(e) => onRoleSelect(member.id, e.target.value as 'student' | 'admin')}
                                                    disabled={loading}
                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <option value="student">학생</option>
                                                    <option value="admin">관리자</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => onRoleSave(member.id)}
                                                    disabled={
                                                        loading ||
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
                                                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${member.duesPaid
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}
                                                onClick={() => onToggleDues(member.id)}
                                                disabled={duesUpdatingId === member.id || loading}
                                            >
                                                <Coins size={16} className={duesUpdatingId === member.id ? 'animate-spin' : ''} />
                                                {member.duesPaid ? '납부' : '미납'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col text-sm text-gray-700">
                                                <span>{member.email}</span>
                                                <span className="text-xs text-gray-500">{formatPhone(member.phone)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{member.joinedAt}</td>
                                    </tr>
                                ))}
                                {members.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>
                                            조건에 맞는 회원이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
                </>
            )}
        </div>
    )
}
