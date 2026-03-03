import { Link } from '@tanstack/react-router'
import { Instagram, Mail } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { privacyOfficerApi } from '../../lib/api/privacyOfficer'

export default function Footer() {
    // 개인정보 총책임자 정보 조회
    const { data: officerInfo } = useQuery({
        queryKey: ['privacyOfficerPublic'],
        queryFn: privacyOfficerApi.getPublic,
        staleTime: 1000 * 60 * 5, // 5분간 캐시
        gcTime: 1000 * 60 * 10, // 10분간 메모리에 유지
    })

    // 주소: API에서 가져오거나 기본값 사용
    const officeAddress = officerInfo?.office_address || '서울특별시 노원구 공릉로 232'
    const officerPhone = officerInfo?.phone || '010-0000-0000'
    const officerName = officerInfo?.name || '정학생회장'

    return (
        <footer className="border-t border-slate-800 bg-slate-900 text-slate-300 mt-auto">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Info */}
                    <div className="col-span-1 md:col-span-1 space-y-4">
                        <h3 className="text-white font-bold text-lg tracking-tight">Computer Science</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            서울과학기술대학교<br />컴퓨터공학과 학생회
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="https://www.instagram.com/seoultech_com/" className="text-slate-400 hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href={`mailto:${officerInfo?.email}`} className="text-slate-400 hover:text-white transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="hidden md:block">
                        <h4 className="text-white font-semibold mb-4">바로가기</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/intro" className="hover:text-blue-400 transition-colors">학생회 소개</a></li>
                            <li><a href="/activities" className="hover:text-blue-400 transition-colors">신청</a></li>
                            <li><a href="/notices" className="hover:text-blue-400 transition-colors">공지사항</a></li>
                            <li><a href="/welfare" className="hover:text-blue-400 transition-colors">학생 복지</a></li>
                            <li><a href="/clubs" className="hover:text-blue-400 transition-colors">동아리 소개</a></li>
                            <li><a href="/suggestion" className="hover:text-blue-400 transition-colors">건의함</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="hidden md:block">
                        <h4 className="text-white font-semibold mb-4">관련 사이트</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="https://www.seoultech.ac.kr/index.jsp" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">서울과학기술대학교 홈페이지</a></li>
                            <li><a href="https://computer.seoultech.ac.kr/" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">컴퓨터공학과 홈페이지</a></li>
                            <li><a href="https://portal.seoultech.ac.kr" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">학생포탈</a></li>
                            <li><a href="https://suis.seoultech.ac.kr/nxui/index.html#main" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">통합정보시스템</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Contact</h4>
                        <div className="space-y-2 text-sm text-slate-400">
                            <p>{officeAddress.includes('미래관') ? officeAddress : `${officeAddress}`}</p>
                            {!officeAddress.includes('미래관') && <p>미래관 305-4호 학생회실</p>}
                            <p>Tel {officerName}: {officerPhone}</p>
                            {officerInfo?.email && (
                                <p>
                                    <a href={`mailto:${officerInfo.email}`} className="hover:text-blue-400 transition-colors">
                                        {officerInfo.email}
                                    </a>
                                </p>
                            )}
                            <p className="pt-2 text-xs text-slate-500">
                                © 2025 Computer Engineering Student Council.<br />All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <div className="flex gap-4">
                        <Link to="/privacy" className="hover:text-slate-300">개인정보처리방침</Link>
                        <Link to="/terms" className="hover:text-slate-300">이용약관</Link>
                        <Link to="/non-member-policy" className="hover:text-slate-300">비회원 처리 규정</Link>
                    </div>
                    <div>
                        developed by{' '}
                        <Link to="/developers" className="hover:text-slate-300 font-semibold transition-colors">
                            SC Dev Team
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

