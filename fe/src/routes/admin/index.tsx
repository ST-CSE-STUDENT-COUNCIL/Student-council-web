import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
    BadgeCheck,
    CheckCircle2,
    Clock3,
    Coins,
    Filter,
    LockOpen,
    RefreshCw,
    Search,
    Shield,
    ShieldCheck,
    Users,
    XCircle,
} from 'lucide-react'

export const Route = createFileRoute('/admin/')({
    component: RouteComponent,
})

type Role = 'student' | 'council' | 'admin'
type MemberStatus = 'pending' | 'active' | 'rejected' | 'blocked'

type Member = {
    id: number
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
}

const MOCK_PENDING: Member[] = [
    {
        id: 301,
        name: '김지원',
        studentId: '20201234',
        role: 'student',
        status: 'pending',
        major: '컴퓨터공학과',
        email: 'jiwon@student.ac.kr',
        phone: '010-1234-5678',
        joinedAt: '2024-03-18',
        duesPaid: false,
    },
    {
        id: 302,
        name: '이윤호',
        studentId: '20214567',
        role: 'student',
        status: 'pending',
        major: '컴퓨터공학과',
        email: 'yoonho@student.ac.kr',
        phone: '010-8765-4321',
        joinedAt: '2024-03-17',
        duesPaid: false,
    },
    {
        id: 303,
        name: '박수현',
        studentId: '20227890',
        role: 'student',
        status: 'pending',
        major: '인공지능전공',
        email: 'soohyun@student.ac.kr',
        phone: '010-9988-1122',
        joinedAt: '2024-03-16',
        duesPaid: false,
    },
]

const MOCK_MEMBERS: Member[] = [
    {
        id: 101,
        name: '정해빈',
        studentId: '20191234',
        role: 'admin',
        status: 'active',
        major: '컴퓨터공학과',
        email: 'haebin@school.ac.kr',
        phone: '010-2222-3333',
        joinedAt: '2021-03-02',
        duesPaid: true,
    },
    {
        id: 102,
        name: '오시원',
        studentId: '20203579',
        role: 'council',
        status: 'active',
        major: '컴퓨터공학과',
        email: 'siwon@school.ac.kr',
        phone: '010-4444-5555',
        joinedAt: '2022-02-26',
        duesPaid: false,
    },
    {
        id: 103,
        name: '류다현',
        studentId: '20214321',
        role: 'student',
        status: 'active',
        major: '소프트웨어전공',
        email: 'dahyun@school.ac.kr',
        phone: '010-1010-1212',
        joinedAt: '2023-03-01',
        duesPaid: true,
    },
    {
        id: 104,
        name: '문채은',
        studentId: '20227851',
        role: 'student',
        status: 'active',
        major: '컴퓨터공학과',
        email: 'chaeun@school.ac.kr',
        phone: '010-6161-7171',
        joinedAt: '2023-09-01',
        duesPaid: false,
    },
]

const MOCK_REJECTED: Member[] = [
    {
        id: 401,
        name: '권민재',
        studentId: '20214588',
        role: 'student',
        status: 'rejected',
        major: '컴퓨터공학과',
        email: 'minjae@school.ac.kr',
        phone: '010-9999-1234',
        joinedAt: '2024-03-10',
        duesPaid: false,
        rejectionReason: '제출 서류 미비',
    },
    {
        id: 402,
        name: '최서연',
        studentId: '20228765',
        role: 'student',
        status: 'rejected',
        major: '소프트웨어전공',
        email: 'seoyeon@school.ac.kr',
        phone: '010-2222-9090',
        joinedAt: '2024-03-08',
        duesPaid: false,
        rejectionReason: '정보 확인 불가',
    },
]

const MOCK_BLOCKED: Member[] = [
    {
        id: 501,
        name: '윤예진',
        studentId: '20205555',
        role: 'student',
        status: 'blocked',
        major: '컴퓨터공학과',
        email: 'yejin@school.ac.kr',
        phone: '010-7777-8888',
        joinedAt: '2022-03-01',
        blockedAt: '2024-01-12',
        duesPaid: false,
    },
    {
        id: 502,
        name: '박태현',
        studentId: '20206666',
        role: 'student',
        status: 'blocked',
        major: '소프트웨어전공',
        email: 'taehyun@school.ac.kr',
        phone: '010-3333-2222',
        joinedAt: '2022-03-01',
        blockedAt: '2024-02-03',
        duesPaid: false,
    },
]

function RouteComponent() {
    const [view, setView] = useState<'pending' | 'all' | 'rejected' | 'blocked'>('pending')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
    const [duesFilter, setDuesFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
    const [pendingMembers, setPendingMembers] = useState<Member[]>(MOCK_PENDING)
    const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS)
    const [rejectedMembers, setRejectedMembers] = useState<Member[]>(MOCK_REJECTED)
    const [blockedMembers, setBlockedMembers] = useState<Member[]>(MOCK_BLOCKED)

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

    const handleApprove = (id: number) => {
        setPendingMembers((prev) => {
            const target = prev.find((m) => m.id === id)
            if (target) {
                setMembers((membersState) => [
                    ...membersState,
                    { ...target, status: 'active', duesPaid: false, joinedAt: new Date().toISOString().slice(0, 10) },
                ])
            }
            return prev.filter((m) => m.id !== id)
        })
    }

    const handleReject = (id: number) => {
        setPendingMembers((prev) => {
            const target = prev.find((m) => m.id === id)
            if (target) {
                setRejectedMembers((rejectedState) => [
                    ...rejectedState,
                    { ...target, status: 'rejected', rejectionReason: '승인 거절 처리됨' },
                ])
            }
            return prev.filter((m) => m.id !== id)
        })
    }

    const handleRoleChange = (id: number, nextRole: Role) => {
        setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role: nextRole } : member)))
    }

    const handleToggleDues = (id: number) => {
        setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, duesPaid: !member.duesPaid } : member)))
    }

    const handleUnblock = (id: number) => {
        setBlockedMembers((prev) => {
            const target = prev.find((m) => m.id === id)
            if (target) {
                setMembers((membersState) => [
                    ...membersState,
                    { ...target, status: 'active', blockedAt: undefined },
                ])
            }
            return prev.filter((m) => m.id !== id)
        })
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
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={() => setSearch('')}
                    >
                        <RefreshCw size={16} />
                        새로고침
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                        onClick={() => setView('pending')}
                    >
                        <BadgeCheck size={16} />
                        승인 관리 바로가기
                    </button>
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
                        </div>

                        {filteredPending.length === 0 ? (
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
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                                    onClick={() => handleApprove(member.id)}
                                                >
                                                    <CheckCircle2 size={16} />
                                                    승인
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                                                    onClick={() => handleReject(member.id)}
                                                >
                                                    <XCircle size={16} />
                                                    거절
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
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-100 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">회원</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">역할</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">회비</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">연락처</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">가입일</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-600">관리</th>
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
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="student">학생</option>
                                                    <option value="admin">관리자</option>
                                                </select>
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
                                                >
                                                    <Coins size={16} />
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
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex gap-2">
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                        상태: 활동중
                                                    </span>
                                                </div>
                                            </td>
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

                        <div className="grid gap-3">
                            {filteredBlocked.map((member) => (
                                <div key={member.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-semibold text-slate-900">{member.name}</span>
                                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">차단됨</span>
                                        </div>
                                        <p className="text-sm text-gray-600">학번 {member.studentId} · {member.major}</p>
                                        <p className="text-xs text-gray-500">차단일 {member.blockedAt}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-100"
                                        >
                                            <ShieldCheck size={16} />
                                            상세 보기
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                            onClick={() => handleUnblock(member.id)}
                                        >
                                            <LockOpen size={16} />
                                            차단 해제
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
                    </div>
                )}
            </div>
        </div>
    )
}
