import { Server, Database, Code, Shield, Terminal, Layout, Monitor, BookOpen, Code2, Megaphone, Calendar, Users, AlertTriangle, CheckSquare, Cloud, FileText, Key, Paintbrush } from 'lucide-react'

interface AdminManualContentProps {
    activePart: 'user' | 'admin' | 'frontend' | 'backend'
}

export const AdminManualContent = ({ activePart }: AdminManualContentProps) => {
    return (
        <div className="flex-1 min-w-0 pr-0 xl:pr-8 pb-20">
            <div className="prose prose-slate dark:prose-invert max-w-none">

                {/* PART 1. 사용자 가이드 */}
                {activePart === 'user' && (
                    <>
                        {/* 1. 시스템 개요 */}
                        <section id="user-intro" className="scroll-mt-24 mb-16">
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-slate-800">
                                1. 시스템 개요
                            </h1>
                            <p className="lead text-lg text-gray-600 dark:text-gray-400">
                                본 시스템은 컴퓨터공학부 학생들의 편의를 위해 제작되었습니다. 공지사항 확인, 행사 신청, 복지 물품 대여 신청 등 학생회에서 제공하는 다양한 서비스를 이용하실 수 있습니다.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                        <Monitor className="w-4 h-4" />
                                        접속 환경
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        PC, 모바일, 태블릿 등 모든 기기에서 최적화된 화면을 제공합니다. 별도의 앱 설치 없이 웹 브라우저를 통해 접속 가능합니다.
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                    <h4 className="font-bold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                                        <Key className="w-4 h-4" />
                                        회원가입 및 승인
                                    </h4>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        정확한 서비스 이용을 위해 재학 증명이 필요합니다. 가입 후 관리자의 승인 절차를 거치면 모든 서비스를 이용하실 수 있습니다.
                                    </p>
                                    <br />
                                    <span className="text-sm text-green-800 dark:text-green-200">
                                        가입 후 승인된 사용자는 행사 신청시, 기본정보 자동 입력 및 보안 인증 검사 미진행, 건의함 이용가능 등의 서비스를 이용가능합니다.
                                    </span>
                                </div>
                            </div>
                        </section>
                        {/* 2. 메인 화면 구성 */}
                        <section id="user-interface" className="scroll-mt-24 mb-16">
                            {/* 메인 화면 구성 헤더 */}
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Layout className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                2. 메인 화면 구성
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                사용자 페이지는 학우분들이 필요한 정보를 가장 빠르게 찾을 수 있도록 직관적으로 설계되었습니다.
                            </p>

                            <div className="space-y-8">
                                {/* 상단 네비게이션 설명 */}
                                <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800/50">
                                    <h3 className="text-lg font-bold mb-4">2.1 상단 네비게이션</h3>
                                    <div className=" gap-6">
                                        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                            <li className="flex gap-2">
                                                <span className="font-bold text-indigo-600 shrink-0">메뉴 이동:</span>
                                                공지사항, 행사신청, 복지사업 등 주요 서비스로 즉시 이동할 수 있습니다.
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="font-bold text-indigo-600 shrink-0">마이페이지:</span>
                                                본인의 행사 신청 현황, 납부 내역 확인 및 정보 수정을 할 수 있습니다.
                                            </li>
                                            <li className="flex gap-2">
                                                <span className="font-bold text-indigo-600 shrink-0">다크모드:</span>
                                                우측 상단 토글을 통해 시스템 테마를 변경할 수 있습니다.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                {/* 메인 대시보드 설명 */}
                                <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800/50">
                                    <h3 className="text-lg font-bold mb-4">2.2 메인 대시보드</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        로그인 후 첫 화면에서는 현재 진행 중인 핵심 이벤트와 공지사항을 요약해서 보여줍니다.
                                    </p>
                                    <img src="/assets/manual/main_dashboard.png" alt="Main Dashboard" className="w-full h-full object-cover" />
                                </div>
                                {/* 푸터 설명 */}
                                <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800/50">
                                    <h3 className="text-lg font-bold mb-4">2.3 푸터</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        푸터는 학교 정보와 다양한 바로가기 및 관련 사이트 링크, 학생회 연락처(현행 학생회장) 등으로 구성되어 있습니다.
                                    </p>
                                    <img src="/assets/manual/footer.png" alt="Footer" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </section>

                        {/* 3. 회원가입 및 로그인 */}
                        <section id="user-signup" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                3. 회원가입 및 로그인
                            </h2>

                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-bold mb-4">3.1 회원가입 프로세스</h3>
                                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">1</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold mb-1">학번 중복 확인</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">이미 가입된 학번인지 실시간으로 확인합니다. 중복된 학번은 가입할 수 없습니다.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">2</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold mb-1">이메일 인증</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">이메일로 6자리 인증번호가 발송됩니다. 5분 내에 인증번호를 입력해야 합니다.</p>
                                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded text-xs text-yellow-800 dark:text-yellow-200">
                                                💡 이메일이 오지 않는다면 스팸메일함을 확인하세요.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">3</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold mb-1">학적 증빙 자료 업로드</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">재학증명서 또는 학생증 사진을 업로드합니다. 이름과 학번이 명확히 보여야 합니다.</p>
                                            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-2">
                                                <li>지원 형식: JPG, PNG (10MB 이하)</li>
                                                <li>개인정보는 암호화되어 안전하게 저장됩니다</li>
                                                <li>승인 후 자동으로 삭제됩니다</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">4</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold mb-1">관리자 승인 대기</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">관리자가 학적 증빙을 확인한 후 24시간 내에 승인됩니다. 승인 전까지는 일부 기능만 이용 가능합니다.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4">3.2 비밀번호 찾기</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">학번을 입력하면 등록된 이메일로 비밀번호 재설정 링크가 전송됩니다.</p>
                                <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
                                    <li>로그인 화면에서 '비밀번호 찾기' 클릭</li>
                                    <li>학번 입력 → 이메일로 인증번호 수신</li>
                                    <li>인증번호 확인 후 새 비밀번호 설정</li>
                                </ol>
                            </div>
                        </section>

                        {/* 4. 주요 기능 가이드 */}
                        <section id="user-features" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <Megaphone className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                4. 주요 기능 가이드
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 학생회 소개 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-500" />
                                        학생회 소개
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        학생회의 역할 및 소개 <br />
                                        현행 학생회 공약, 조직도, 연락처 등을 소개합니다.
                                    </p>
                                </div>
                                {/* 공지사항 확인 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-500" />
                                        공지사항 확인
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        학생회 소식을 공유하는 공간입니다. 중요 공지는 상단에 고정되어 표시됩니다.
                                    </p>
                                    <div className="mb-4 overflow-hidden border border-gray-100 dark:border-slate-700 rounded-lg">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500">
                                                <tr>
                                                    <th className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">대분류</th>
                                                    <th className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">소분류</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-600 dark:text-gray-400">
                                                <tr className="border-b border-gray-50 dark:border-slate-700/50">
                                                    <td className="px-3 py-2 font-semibold text-indigo-600 dark:text-indigo-400">학생회</td>
                                                    <td className="px-3 py-2">행사, 복지, 공지</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-3 py-2 font-semibold text-indigo-600 dark:text-indigo-400">정보공개</td>
                                                    <td className="px-3 py-2">공고, 고시, 대표자 회의, 학생회칙</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">•</span>
                                            <span className="text-gray-600 dark:text-gray-400">카테고리별 필터링으로 원하는 공지만 볼 수 있습니다</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">•</span>
                                            <span className="text-gray-600 dark:text-gray-400">제목/내용 검색 기능 제공</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">•</span>
                                            <span className="text-gray-600 dark:text-gray-400">첨부파일 다운로드 가능</span>
                                        </div>
                                    </div>
                                </div>
                                {/* 행사 및 사업 신청 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-500" />
                                        행사 및 사업 신청
                                    </h3>
                                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                        <p>
                                            간식행사, MT, 개강총회 등 다양한 행사에 참여할 수 있습니다.
                                        </p>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg space-y-2">
                                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-xs">활동 유형</h4>
                                            <ul className="text-xs space-y-1">
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-blue-600">•</span>
                                                    <span><strong>행사 (Event):</strong> 간식행사, MT, 개강파티 등</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-blue-600">•</span>
                                                    <span><strong>설문조사 (Survey):</strong> 의견 수렴용 설문</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-blue-600">•</span>
                                                    <span><strong>수요조사 (Demand):</strong> 굿즈, 과잠, 간식행사, 행사 수요 파악</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-bold text-blue-600">•</span>
                                                    <span><strong>카톡방 초대:</strong> 학번별 단톡방 초대</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex gap-2">
                                                <span>✓</span>
                                                <span>실시간 참가 인원 확인</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span>✓</span>
                                                <span>승인된 회원은 기본정보 자동 입력</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span>✓</span>
                                                <span>마이페이지에서 신청 내역 조회</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* 복지 물품 대여 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-purple-500" />
                                        복지 사업
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="border-l-4 border-purple-500 pl-3">
                                            <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100 mb-1">물품 대여</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                우산, 보조배터리 등의 실시간 재고 확인 및 구글폼으로 대여 신청
                                            </p>
                                        </div>
                                        <div className="border-l-4 border-blue-500 pl-3">
                                            <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100 mb-1">사물함</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                배치도 확인, 신청/반납연장 구글폼, 신청 기간 안내
                                            </p>
                                        </div>
                                        <div className="border-l-4 border-green-500 pl-3">
                                            <h4 className="font-bold text-sm text-green-900 dark:text-green-100 mb-1">프린터</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                학생회실 프린터 사용 매뉴얼 이미지 제공
                                            </p>
                                        </div>
                                        <div className="border-l-4 border-orange-500 pl-3">
                                            <h4 className="font-bold text-sm text-orange-900 dark:text-orange-100 mb-1">신입생 가이드북</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                학교 생활에 필요한 정보를 담은 노션 가이드북 바로가기
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* 마이페이지 관리 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-orange-500" />
                                        마이페이지
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">내 정보 관리</p>
                                        <ul className="space-y-1 text-xs ml-4">
                                            <li className="flex gap-2"><span>•</span><span>행사 신청 내역 및 승인 상태 확인</span></li>
                                            <li className="flex gap-2"><span>•</span><span>학생회비 납부 여부 조회</span></li>
                                            <li className="flex gap-2"><span>•</span><span>개인정보 수정 요청 (이름, 학번, 이메일, 전화번호)</span></li>
                                            <li className="flex gap-2"><span>•</span><span>비밀번호 변경</span></li>
                                            <li className="flex gap-2"><span>•</span><span>회원 탈퇴</span></li>
                                        </ul>
                                    </div>
                                </div>
                                {/* 건의함 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-pink-500" />
                                        건의함
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <p>학생회에 건의사항을 제출할 수 있습니다.</p>
                                        <div className="bg-pink-50 dark:bg-pink-900/10 p-3 rounded-lg text-xs space-y-1">
                                            <div className="flex gap-2"><span className="text-pink-600">•</span><span>승인된 회원만 작성 가능</span></div>
                                            <div className="flex gap-2"><span className="text-pink-600">•</span><span>작성자는 관리자에게만 표시됩니다</span></div>
                                            <div className="flex gap-2"><span className="text-pink-600">•</span><span>상태: 접수/검토중/승인/반려</span></div>
                                            <div className="flex gap-2"><span className="text-pink-600">•</span><span>처리 결과 및 답변 확인 가능</span></div>
                                        </div>
                                    </div>
                                </div>
                                {/* 동아리 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl 1bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-cyan-500" />
                                        동아리
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <p>컴퓨터공학부 동아리 정보를 확인할 수 있습니다.</p>
                                        <ul className="space-y-1 text-xs ml-4">
                                            <li className="flex gap-2"><span>•</span><span>카테고리별 필터링 (학술, 스포츠 등)</span></li>
                                            <li className="flex gap-2"><span>•</span><span>동아리 로고, 소개, 연락처 확인</span></li>
                                            <li className="flex gap-2"><span>•</span><span>사진 갤러리로 활동 모습 보기</span></li>
                                        </ul>
                                    </div>
                                </div>
                                {/* 검색 */}
                                <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-500" />
                                        통합 검색
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <p>공지사항과 행사를 한 번에 검색할 수 있습니다.</p>
                                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg text-xs space-y-1">
                                            <div className="flex gap-2"><span className="text-indigo-600">•</span><span>제목 및 내용 통합 검색</span></div>
                                            <div className="flex gap-2"><span className="text-indigo-600">•</span><span>최신순/오래된순 정렬</span></div>
                                            <div className="flex gap-2"><span className="text-indigo-600">•</span><span>공지사항/행사 탭 구분</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
                {/* PART 2. 관리자 가이드 */}
                {activePart === 'admin' && (
                    <>
                        {/* 1. 관리자 접속 */}
                        <section id="admin-intro" className="scroll-mt-24 mb-16">
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-slate-800">
                                1. 관리자 접속 및 권한
                            </h1>
                            <p className="lead text-lg text-gray-600 dark:text-gray-400">
                                관리자 페이지는 학생회 임원들이 시스템을 운영하고 데이터를 관리하는 공간입니다. 보안을 위해 승인된 계정으로만 접근이 가능합니다.
                            </p>

                            <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl">
                                <h4 className="font-bold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    관리자 권한 획득 방법
                                </h4>
                                <ol className="list-decimal list-inside text-sm text-red-700 dark:text-red-300 space-y-2">
                                    <li>먼저 사용자 페이지에서 회원가입을 완료합니다.</li>
                                    <li>기존 관리자에게 본인의 학번을 전달하여 권한 승격 요청을 합니다.</li>
                                    <li>관리자가 DB 또는 관리자 페이지에서 권한을 'Admin'으로 변경하면 접속이 가능해집니다.</li>
                                </ol>
                            </div>

                            <div className="mt-6 flex flex-col md:flex-row gap-4">
                                <div className="flex-1 p-4 border border-gray-200 dark:border-slate-700 rounded-xl">
                                    <h4 className="font-bold mb-2">접속 주소</h4>
                                    <code className="text-sm text-blue-600 dark:text-blue-400 font-mono">https://stcse-student.com/admin</code>
                                </div>
                                <div className="flex-1 p-4 border border-gray-200 dark:border-slate-700 rounded-xl">
                                    <h4 className="font-bold mb-2">주의사항</h4>
                                    <p className="text-xs text-gray-500">공용 PC 사용 시 반드시 로그아웃을 해주시기 바랍니다.</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. 대시보드 구조 */}
                        <section id="admin-structure" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Layout className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                </div>
                                2. 대시보드 구조
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                관리자 화면은 효율적인 업무 처리를 위해 기능별로 구분된 좌측 사이드바와 메인 컨텐츠 영역으로 구성됩니다.
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                    <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl">
                                        <h3 className="font-bold text-sm mb-2 text-indigo-600">좌측 사이드바 메뉴</h3>
                                        <ul className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
                                            <li><strong>통계/대시보드:</strong> 전체 회원 수, 승인 대기 수 등 요약 지표</li>
                                            <li><strong>프로필 변경 요청:</strong> 유저의 개인정보 변경 요청 관리</li>
                                            <li><strong>회장 정보 관리:</strong> 회장 정보 관리 | 대가 바뀌어도 유지보수 하기 위함</li>
                                            <li><strong>학생회 소개:</strong> 학생회 소개 | 대가 바뀌어도 유지보수 하기 위함</li>
                                            <li><strong>공지사항 관리:</strong> 공지사항 관리</li>
                                            <li><strong>행사 공지 신청:</strong> 행사 생성, 신청자 관리 및 출석 (선착순 마감 기능)</li>
                                            <li><strong>수요 설문 조사:</strong>설문조사, 수요조사 생성 (기명/익명 선택 가능)(추가 설문조사 기능 활용) </li>
                                            <li><strong>카톡방 초대:</strong> 학번별 카톡방 초대시 활용, 편입전과복부전교환 관리</li>
                                            <li><strong>복지 사업 관리:</strong> 물품 대여 링크 연결, 사물함 배정표, 프린터 매뉴얼, 신입생 가이드북</li>
                                            <li><strong>동아리 관리:</strong> 학과 동아리 홍보용</li>
                                            <li><strong>건의함 관리:</strong> 건의함을 통한 소통창구 마련</li>
                                            <li><strong>시스템 매뉴얼:</strong> 홈페이지 유지보수 및 관리 매뉴얼</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl">
                                        <h3 className="font-bold text-sm mb-2 text-green-600">상단 툴바</h3>
                                        <ul className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
                                            <li><strong>홈 바로가기:</strong> 사용자 메인 페이지로 즉시 이동</li>
                                            <li><strong>프로필:</strong> 내 정보 확인 및 로그아웃</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. 상세 기능 가이드 */}
                        <section id="admin-features" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                3. 상세 기능 가이드
                            </h2>

                            <div className="space-y-12">
                                {/* 3.1 회원 관리 */}
                                <div className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-500" />
                                        3.1 회원 관리
                                    </h3>

                                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 mb-4">
                                        <h4 className="font-bold mb-3">신규 회원 승인 프로세스</h4>
                                        <ol className="list-decimal list-inside space-y-3 text-sm">
                                            <li><strong>[회원 관리] &gt; [승인 대기]</strong> 메뉴로 이동합니다.</li>
                                            <li>학생이 업로드한 <strong>재학증명서/학생증 이미지</strong>를 클릭하여 정보를 확인합니다.</li>
                                            <li>이름, 학번, 학과가 일치하면 <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">승인</span> 버튼을 클릭합니다.</li>
                                            <li>정보가 불확실한 경우 반려 사유를 입력하고 <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">반려</span> 처리합니다.</li>
                                            <li>반려 사유는 해당 유저가 로그인 시, 모달로 알릴 수 있습니다.</li>
                                        </ol>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">전체 회원 관리</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 회원 목록 조회 및 검색 (이름, 학번)</li>
                                                <li>• 상태별 필터링 (승인/반려/대기)</li>
                                                <li>• 회원 상세 정보 보기</li>
                                                <li>• 관리자 권한 부여/회수</li>
                                                <li>• 학생회비 납부 여부 표시</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">정보 수정 요청 관리</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 회원이 요청한 개인정보 수정 내역 확인</li>
                                                <li>• 수정 요청 승인 또는 반려</li>
                                                <li>• 반려 시 사유 입력</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* 3.2 공지사항 관리 */}
                                <div className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-500" />
                                        3.2 공지사항 관리
                                    </h3>

                                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 mb-4">
                                        <h4 className="font-bold mb-3">공지사항 작성 방법</h4>
                                        <ol className="list-decimal list-inside space-y-3 text-sm">
                                            <li><strong>[콘텐츠 관리] &gt; [공지사항]</strong> 메뉴에서 '새 공지사항 작성' 클릭</li>
                                            <li>대분류 선택: <span className="text-indigo-600 font-mono text-xs">학생회</span> 또는 <span className="text-indigo-600 font-mono text-xs">정보공개</span></li>
                                            <li>소분류 선택: 행사, 복지, 공지, 공고, 고시, 대표자회의, 학생회칙</li>
                                            <li>제목과 내용 작성 (마크다운 지원)</li>
                                            <li>첫 번째 설정에서 '상단 고정' 체크 시 메인 페이지에 고정 표시</li>
                                            <li>첨부파일 업로드 (Cloudflare R2 사용)</li>
                                            <li>'미리보기'로 최종 확인 후 '게시' 클릭</li>
                                        </ol>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">공지사항 수정/삭제</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 기존 공지사항 목록에서 수정 가능</li>
                                                <li>• 첨부파일 추가/삭제 가능</li>
                                                <li>• 삭제 시 첨부파일도 자동 삭제</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* 3.3 행사 및 활동 관리 */}
                                <div className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-green-500" />
                                        3.3 행사 및 활동 관리
                                    </h3>

                                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 mb-4">
                                        <h4 className="font-bold mb-3">행사 생성 방법</h4>
                                        <ol className="list-decimal list-inside space-y-3 text-sm">
                                            <li><strong>[사업 관리] &gt; [행사/공지]</strong> 메뉴에서 '새 활동 만들기' 클릭</li>
                                            <li>활동 유형 선택:
                                                <ul className="ml-6 mt-1 space-y-1 text-xs">
                                                    <li>• <strong>event</strong>: 일반 행사 (간식행사, MT 등)</li>
                                                    <li>• <strong>survey</strong>: 설문조사</li>
                                                    <li>• <strong>demand_survey</strong>: 수요조사</li>
                                                    <li>• <strong>kakao_invite</strong>: 카톡방 초대 신청</li>
                                                    <li>• <strong>notice</strong>: 단순 공지</li>
                                                </ul>
                                            </li>
                                            <li>기본 정보 입력:
                                                <ul className="ml-6 mt-1 space-y-1 text-xs">
                                                    <li>• 제목, 설명, 썸네일 이미지</li>
                                                    <li>• 신청 기간 (시작/종료 일시)</li>
                                                    <li>• 최대 정원(선택사항)</li>
                                                    <li>• 학생회비 납부자 필수 여부(사용하지 않기를 권장)</li>
                                                </ul>
                                            </li>
                                            <li><strong>폼 부가 필드 추가</strong>:
                                                <ul className="ml-6 mt-1 space-y-1 text-xs">
                                                    <li>• 단답형: 이름, 학번, 이메일, 전화번호 등</li>
                                                    <li>• 긴 텍스트: 의견, 요청사항</li>
                                                    <li>• 체크박스: 동의함, 여러 선택지</li>
                                                    <li>• 라디오: 한 가지만 선택</li>
                                                    <li>• 선택: 드롭다운 메뉴</li>
                                                    <li>• 날짜: 날짜 입력칸</li>
                                                    <li>• 파일: 이미지 또는 파일 업로드</li>
                                                </ul>
                                            </li>
                                            <li>'미리보기'로 확인 후 '생성' 클릭</li>
                                        </ol>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">신청자 관리</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 신청자 목록 조회</li>
                                                <li>• 상태별 필터링</li>
                                                <li>• 신청 내용 상세 보기</li>
                                                <li>• 승인/거절 처리</li>
                                                <li>• Excel 다운로드</li>
                                                <li>• 출석체크(승인된 자에 한해서, 학번입력을 통해)</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">설문 결과 분석</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 각 질문별 응답 통계</li>
                                                <li>• 그래프로 시각화</li>
                                                <li>• 주관식 응답 목록</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">출석 체크</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 학번으로 출석 조회</li>
                                                <li>• 출석 승인 클릭</li>
                                                <li>• 출석 시간 기록</li>
                                                <li>• 출석자 목록 다운로드</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* 3.4 복지 사업 관리 */}
                                <div className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-purple-500" />
                                        3.4 복지 사업 관리
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">물품 대여</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• Google Sheets와 연동하여 재고 실시간 동기화</li>
                                                <li>• 물품 목록 추가/수정/삭제</li>
                                                <li>• 물품 이미지 업로드</li>
                                                <li>• 대여 신청 구글폼 URL 연결</li>
                                                <li>• 활성화/비활성화 토글</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">사물함 관리</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 배치도 이미지 업로드</li>
                                                <li>• 신청/반납 구글폼 URL 설정</li>
                                                <li>• 신청 기간 설정</li>
                                                <li>• 안내 메시지 작성</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">프린터 안내</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 사용 매뉴얼 이미지 업로드</li>
                                                <li>• 안내 설명 텍스트 작성</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">신입생 가이드북</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 노션(Notion) URL 설정</li>
                                                <li>• 제목 및 설명 수정</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* 3.5 건의함 관리 */}
                                <div className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-pink-500" />
                                        3.5 건의함 관리
                                    </h3>

                                    <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                                        <h4 className="font-bold mb-3">처리 프로세스</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 w-20 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold text-center">접수</div>
                                                <p className="text-gray-700 dark:text-gray-300">새로운 건의 접수 상태 (기본값)</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 w-20 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold text-center">검토중</div>
                                                <p className="text-gray-700 dark:text-gray-300">관리자가 검토 중인 상태로 변경</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 w-20 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold text-center">승인</div>
                                                <p className="text-gray-700 dark:text-gray-300">건의 사항이 반영되었을 때, 해결 내용 작성</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 w-20 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold text-center">반려</div>
                                                <p className="text-gray-700 dark:text-gray-300">건의 사항이 반영할 수 없을 때, 반려 사유 필수</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded text-xs">
                                            💡 <strong>팁:</strong> 작성자는 관리자에게만 표시되며, 일반 사용자에게는 익명으로 표시됩니다.
                                        </div>
                                    </div>
                                </div>

                                {/* 3.6 동아리 관리 */}
                                <div className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-cyan-500" />
                                        3.6 동아리 관리
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">동아리 등록</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 동아리 이름, 카테고리 입력</li>
                                                <li>• 동아리 설명 작성</li>
                                                <li>• 로고 이미지 업로드</li>
                                                <li>• 관련 사이트 연결</li>
                                                <li>• 연락처 정보 입력</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">활동 사진 관리</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 동아리별 활동 사진 추가</li>
                                                <li>• 사진 설명 및 순서 설정</li>
                                                <li>• 사진 삭제</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* 3.7 학생회 소개 관리 */}
                                <div className="scroll-mt-24">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-500" />
                                        3.7 학생회 소개 관리
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">공약 관리</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 공약 제목 및 내용 작성</li>
                                                <li>• 각 공약별 설명 추가</li>
                                                <li>• 공약 진행 상태 표시</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">조직도 및 연락처</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 조직도 이미지 업로드</li>
                                                <li>• 부서별 담당자 정보 입력</li>
                                                <li>• 학생회장 연락처 설정</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 border rounded-xl p-4">
                                            <h4 className="font-bold text-sm mb-2">개인정보 처리 담당자</h4>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                <li>• 담당자 이름, 부서, 연락처</li>
                                                <li>• 업무 및 이메일 주소 입력</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* PART 3. 프론트엔드 가이드 */}
                {activePart === 'frontend' && (
                    <>
                        {/* 1. 기술 스택 */}
                        <section id="fe-intro" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <Code2 className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                                1. 기술 스택 (Tech Stack)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                                    <h3 className="font-bold text-blue-600 mb-2">Core</h3>
                                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                                        <li>React 18</li>
                                        <li>TypeScript 5.x</li>
                                        <li>Vite (Build Tool)</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                                    <h3 className="font-bold text-pink-600 mb-2">Routing & State</h3>
                                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                                        <li>TanStack Router (File-based)</li>
                                        <li>TanStack Query (Async State)</li>
                                        <li>Zustand (Global State)</li>
                                    </ul>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                                    <h3 className="font-bold text-cyan-600 mb-2">Styling</h3>
                                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                                        <li>Tailwind CSS 3.x</li>
                                        <li>Lucide React (Icons)</li>
                                        <li>clsx & tw-merge</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 2. 프로젝트 구조 */}
                        <section id="fe-structure" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Layout className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                2. 프로젝트 구조 (Project Structure)
                            </h2>

                            <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                src/<br />
                                ├── components/         # 재사용 가능한 UI 컴포넌트<br />
                                │   ├── common/         # 범용 컴포넌트 (Button, Input, Modal 등)<br />
                                │   ├── business/       # 특정 도메인 로직이 포함된 컴포넌트<br />
                                │   └── layout/         # Header, Sidebar 등 레이아웃 관련<br />
                                ├── routes/             # 페이지 라우팅 (TanStack Router)<br />
                                │   ├── __root.tsx      # 최상위 레이아웃<br />
                                │   ├── index.tsx       # 메인 페이지 (/)<br />
                                │   └── admin/          # 관리자 페이지 그룹<br />
                                ├── hooks/              # 커스텀 훅 (useAuth, useToast 등)<br />
                                ├── lib/                # 외부 라이브러리 설정 및 유틸리티<br />
                                │   ├── api/            # API 호출 함수 모음 (Axios)<br />
                                │   └── utils.ts        # 공용 유틸리티 함수 (cn 등)<br />
                                ├── schemas/            # Zod 스키마 정의<br />
                                ├── store/              # 전역 상태 관리 (Zustand)<br />
                                ├── styles/             # 전역 스타일 (Tailwind CSS)<br />
                                └── types/              # TypeScript 타입 정의 (DTO, Interface)
                            </div>
                        </section>

                        {/* 3. 라우팅 */}
                        <section id="fe-routing" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                3. 라우팅 (TanStack Router)
                            </h2>
                            <p className="mb-4 text-gray-700 dark:text-gray-300">
                                <strong>File-system based Routing</strong>을 사용합니다. 파일명과 폴더 구조가 곧 URL이 됩니다.
                            </p>

                            <div className="space-y-4">
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                    <h4 className="font-bold mb-2">📌 주요 규칙</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li><code>__root.tsx</code>: 모든 페이지를 감싸는 최상위 래퍼입니다. (Providers 설정)</li>
                                        <li><code>index.tsx</code>: 해당 폴더 경로의 기본 페이지입니다.</li>
                                        <li><code>_layout.tsx</code>: 하위 라우트에 공통으로 적용될 레이아웃입니다.</li>
                                        <li><code>$id.tsx</code>: 동적 라우트 파라미터(Variable)입니다. (예: <code>/posts/123</code>)</li>
                                    </ul>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                                    <strong>💡 Tip:</strong> 새 페이지를 만들려면 <code>src/routes</code> 폴더 안에 파일을 생성하세요. 저장 시 자동으로 라우트 트리(routeTree.gen.ts)가 갱신됩니다.
                                </div>
                            </div>
                        </section>

                        {/* 4. 상태 관리 */}
                        <section id="fe-state" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                4. 상태 관리 (Zustand & React Query)
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-xl font-bold mb-3 text-purple-700 dark:text-purple-300">Global State (Zustand)</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        로그인 정보, UI 상태(사이드바 열림/닫힘) 등 전역에서 공유해야 하는 가벼운 데이터에 사용합니다.
                                    </p>
                                    <code className="block bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono mb-4">
                                        {`// src/store/authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null })
}))`}
                                    </code>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-3 text-red-600 dark:text-red-400">Server State (TanStack Query)</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        API 응답 데이터 캐싱, 로딩 상태 관리, 에러 처리에 사용합니다. <code>useEffect</code>로 데이터를 가져오는 것을 지양하세요.
                                    </p>
                                    <code className="block bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono">
                                        {`const { data, isLoading } = useQuery({
  queryKey: ['notices'],
  queryFn: getNotices
})`}
                                    </code>
                                </div>
                            </div>
                        </section>

                        {/* 5. API 연동 */}
                        <section id="fe-api" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Cloud className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                5. API 연동 (Axios Layer)
                            </h2>
                            <p className="mb-4 text-gray-700 dark:text-gray-300">
                                모든 HTTP 요청은 <code>src/lib/api</code> 폴더 내의 함수를 통해서만 이루어집니다. 컴포넌트에서 직접 <code>fetch</code>나 <code>axios</code>를 호출하지 마세요.
                            </p>

                            <div className="overflow-x-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                                        <tr>
                                            <th className="px-4 py-2">파일명</th>
                                            <th className="px-4 py-2">설명</th>
                                            <th className="px-4 py-2">주요 함수</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        <tr>
                                            <td className="px-4 py-2 font-mono text-blue-600">client.ts</td>
                                            <td className="px-4 py-2">Axios 인스턴스 설정</td>
                                            <td className="px-4 py-2">Interceptors (토큰 자동 주입)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 font-mono">auth.ts</td>
                                            <td className="px-4 py-2">인증 관련 API</td>
                                            <td className="px-4 py-2">login, refresh, logout</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 font-mono">admin.ts</td>
                                            <td className="px-4 py-2">관리자 전용 API</td>
                                            <td className="px-4 py-2">getUsers, updateNotice</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 6. 스타일링 및 컴포넌트 */}
                        <section id="fe-styling" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <Paintbrush className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                6. 스타일링 및 컴포넌트
                            </h2>

                            <h3 className="text-lg font-bold mb-2">🎨 Common Components</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                반복적으로 사용되는 UI는 <code>src/components/common</code>에 정의되어 있습니다.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-3 border rounded text-center">
                                    <div className="font-bold mb-1">Button</div>
                                    <div className="text-xs text-gray-500">variant (primary, outline...)</div>
                                </div>
                                <div className="p-3 border rounded text-center">
                                    <div className="font-bold mb-1">Input</div>
                                    <div className="text-xs text-gray-500">Form 입력 필드</div>
                                </div>
                                <div className="p-3 border rounded text-center">
                                    <div className="font-bold mb-1">Modal</div>
                                    <div className="text-xs text-gray-500">팝업 창 레이아웃</div>
                                </div>
                                <div className="p-3 border rounded text-center">
                                    <div className="font-bold mb-1">Pagination</div>
                                    <div className="text-xs text-gray-500">리스트 페이징 처리</div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-2">🌙 Dark Mode</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Tailwind의 <code>dark:</code> variant를 사용하여 다크 모드를 지원합니다.
                                모든 색상은 Light/Dark를 동시에 고려하여 작성해야 합니다.
                            </p>
                            <code className="block bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm text-center mb-4">
                                className="bg-white <span className="text-pink-600 font-bold">dark:bg-slate-900</span> text-black <span className="text-pink-600 font-bold">dark:text-white</span>"
                            </code>
                        </section>

                        {/* 7. 개발 및 빌드 */}
                        <section id="fe-build" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                7. 개발 및 빌드 (CLI)
                            </h2>
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm space-y-4">
                                <div>
                                    <p className="text-gray-400 mb-1"># 의존성 설치</p>
                                    <p>$ npm install</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 mb-1"># 개발 서버 실행 (localhost:5173)</p>
                                    <p>$ npm run dev</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 mb-1"># 타입 체크 및 프로덕션 빌드 (dist/ 생성)</p>
                                    <p>$ npm run build</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 mb-1"># 빌드 결과물 미리보기</p>
                                    <p>$ npm run preview</p>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* PART 4. 백엔드 가이드 */}
                {activePart === 'backend' && (
                    <>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mb-8 text-sm">
                            <h3 className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100 mb-2">
                                <FileText className="w-4 h-4" />
                                문서 정보
                            </h3>
                            <p className="text-amber-800 dark:text-amber-200">
                                최종 업데이트: 2026년 2월<br />
                                연락처: ehgis2344@seoultech.ac.kr (전산팀장)<br />
                                ℹ️ 이 문서는 백엔드 코드 없이 웹 대시보드만으로 운영하는 것을 기준으로 작성되었습니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mb-8 pb-2 border-b-2 border-purple-600 dark:border-purple-400">
                            <Code2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100 m-0">
                                PART 4. 백엔드 가이드
                            </h2>
                        </div>

                        {/* 1. 기술 스택 및 아키텍처 */}
                        <section id="tech-stack" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                1. 기술 스택 및 아키텍처
                            </h2>

                            <h3 className="text-xl font-semibold mt-4 mb-2">1.1 기술 스택</h3>
                            <div className="overflow-x-auto mb-6">
                                <table className="min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">구분</th>
                                            <th className="px-6 py-4">기술</th>
                                            <th className="px-6 py-4">비고</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        <tr>
                                            <td className="px-6 py-4 font-bold">런타임</td>
                                            <td className="px-6 py-4">Python 3.12</td>
                                            <td className="px-6 py-4">FastAPI 프레임워크</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">DB</td>
                                            <td className="px-6 py-4">Supabase (PostgreSQL)</td>
                                            <td className="px-6 py-4">리전: ap-northeast-2 (서울)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">인증</td>
                                            <td className="px-6 py-4">Supabase Auth</td>
                                            <td className="px-6 py-4">JWT 토큰 기반</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">스토리지</td>
                                            <td className="px-6 py-4">Cloudflare R2 + Supabase</td>
                                            <td className="px-6 py-4">용도별 분리</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">호스팅</td>
                                            <td className="px-6 py-4">Fly.io</td>
                                            <td className="px-6 py-4">리전: nrt (도쿄), Docker</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">이메일</td>
                                            <td className="px-6 py-4">Gmail API (OAuth 2.0)</td>
                                            <td className="px-6 py-4">인증번호 발송</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3 className="text-xl font-semibold mt-4 mb-2">1.2 아키텍처 흐름</h3>
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre mb-6">
                                {`[프론트엔드 (Vercel)]
        │
        ▼
[Fly.io - FastAPI 서버 (도쿄)]
        │
        ├──▶ Supabase DB (서울) ─── PostgreSQL + Auth
        ├──▶ Cloudflare R2 ─────── 파일 스토리지 (Presigned URL)
        ├──▶ Supabase Storage ──── 학적 인증 이미지 (private)
        ├──▶ Gmail API ─────────── 이메일 발송
        ├──▶ Google Sheets API ─── 대여 물품 재고
        └──▶ Cloudflare Turnstile ─ CAPTCHA 검증`}
                            </code>

                            <h3 className="text-xl font-semibold mt-4 mb-2">1.3 API 라우트 구조</h3>
                            <ul className="list-none space-y-2 text-sm">
                                <li className="flex gap-2"><span className="font-bold text-green-600">공개</span> <code>/</code>, <code>/docs</code>, <code>/signup</code>, <code>/clubs</code>, <code>/send-verification</code></li>
                                <li className="flex gap-2"><span className="font-bold text-blue-600">인증</span> <code>/notices</code>, <code>/activities</code>, <code>/suggestions</code>, <code>/welfare</code></li>
                                <li className="flex gap-2"><span className="font-bold text-red-600">관리자</span> <code>/admin/pending-users</code>, <code>/admin/notices</code>, <code>/admin/activities</code>, <code>/admin/users</code></li>
                            </ul>
                        </section>

                        {/* 2. 환경 변수 관리 */}
                        <section id="env-vars" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                2. 환경 변수 관리
                            </h2>

                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-md text-sm mb-4 border border-yellow-200 dark:border-yellow-800">
                                <strong>⚠️ 중요:</strong> Secret을 변경하면 서버가 자동으로 재시작됩니다. 관리 페이지: <a href="https://fly.io/dashboard" target="_blank" className="underline">Fly.io Dashboard</a>
                            </div>

                            <table className="min-w-full text-left text-sm whitespace-nowrap mb-6 border-collapse">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-2">카테고리</th>
                                        <th className="px-4 py-2">변수명</th>
                                        <th className="px-4 py-2">설명</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    <tr>
                                        <td className="px-4 py-2 font-bold" rowSpan={3}>Supabase</td>
                                        <td className="px-4 py-2 text-red-600 font-mono">SUPABASE_URL</td>
                                        <td className="px-4 py-2">프로젝트 URL</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-red-600 font-mono">SUPABASE_KEY</td>
                                        <td className="px-4 py-2">Service Role Key (서버 전용)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-mono">SUPABASE_ANON_KEY</td>
                                        <td className="px-4 py-2">Anon Key</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-bold" rowSpan={3}>Gmail API</td>
                                        <td className="px-4 py-2 font-mono">GOOGLE_CLIENT_ID</td>
                                        <td className="px-4 py-2">OAuth ID</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-red-600 font-mono">GOOGLE_REFRESH_TOKEN</td>
                                        <td className="px-4 py-2">OAuth Refresh Token (주기적 갱신 필수)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-mono">GMAIL_FROM_EMAIL</td>
                                        <td className="px-4 py-2">발신자 이메일</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-bold">R2</td>
                                        <td className="px-4 py-2 font-mono">R2_ACCESS_KEY_ID</td>
                                        <td className="px-4 py-2">Cloudflare R2 API Key</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 3. 서버 관리 (Fly.io) + 모니터링 */}
                        <section id="server" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Server className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                3. 서버 관리 (Fly.io)
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <h4 className="font-bold mb-2">기본 정보</h4>
                                    <ul className="text-sm space-y-1">
                                        <li><strong>앱 이름:</strong> `seoultech-cse-backend`</li>
                                        <li><strong>리전:</strong> nrt (도쿄)</li>
                                        <li><strong>스펙:</strong> shared CPU 1x, 512MB RAM</li>
                                        <li><strong>최소 머신:</strong> 1 (상시 가동)</li>
                                    </ul>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <h4 className="font-bold mb-2">모니터링 & 로그</h4>
                                    <ul className="text-sm space-y-1">
                                        <li><strong>Dashboard:</strong> <a href="https://fly.io/dashboard" target="_blank" className="text-blue-600 hover:underline">바로가기</a></li>
                                        <li><strong>Logs:</strong> Dashboard 👉 Logs & Errors</li>
                                        <li><strong>재시작:</strong> Dashboard 👉 Machines 👉 Restart</li>
                                    </ul>
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold mt-6 mb-4">로그 확인 가이드</h3>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">📋 로그 확인 방법</h4>
                                <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                    <li>Fly.io 대시보드 접속: <a href="https://fly.io/dashboard" target="_blank" className="underline">https://fly.io/dashboard</a></li>
                                    <li>`seoultech-cse-backend` 앱 선택</li>
                                    <li>왼쪽 메뉴에서 <strong>Monitoring</strong> 클릭</li>
                                    <li><strong>Logs</strong> 탭 선택</li>
                                </ol>
                            </div>

                            <h4 className="text-lg font-semibold mb-3">로그 레벨 이해하기</h4>

                            <div className="space-y-4 mb-6">
                                <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-r-lg">
                                    <h5 className="font-bold text-red-700 dark:text-red-300 mb-2">🔴 ERROR - 즉시 확인 필요</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">실제 오류가 발생하여 기능이 정상 동작하지 않은 경우입니다.</p>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">주요 ERROR 메시지:</p>
                                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside pl-2">
                                        <li><code>users 테이블 insert 실패</code> → 회원가입 실패</li>
                                        <li><code>Auth 삭제 실패</code> → 관리자 회원 거절 기능 오류</li>
                                        <li><code>upload_file_to_r2</code> → 파일 업로드 실패 (공지사항 첨부파일 등)</li>
                                        <li><code>R2 파일 삭제 실패</code> → 스토리지 정리 실패</li>
                                        <li><code>로그인 시도 기록 실패</code> → 보안 로그 기록 오류</li>
                                        <li><code>verification-images 업로드 실패</code> → 학적인증 이미지 업로드 실패</li>
                                    </ul>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-2">→ 조치: 개발자에게 즉시 문의</p>
                                </div>

                                <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-r-lg">
                                    <h5 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">🟡 WARNING - 확인 권장 (대부분 정상)</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">경고 메시지지만 대부분 정상 동작합니다. 자주 보는 메시지는 무시해도 됩니다.</p>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">자주 보는 WARNING (무시 가능):</p>
                                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside pl-2">
                                        <li><code>Rate limit check failed</code> → Rate limit DB 일시 오류, 요청은 정상 처리됨</li>
                                        <li><code>재고 조회 실패</code> → Google Sheets API 일시 오류, 캐시 데이터 사용</li>
                                        <li><code>기존 세션 만료 실패</code> → 중복 로그인 시 이전 세션 정리 실패, 로그인은 정상</li>
                                        <li><code>last_login_at update failed</code> → 로그인 시간 기록 실패, 로그인은 정상</li>
                                        <li><code>파일 삭제 실패</code> → 개별 파일 정리 실패, 전체 기능은 정상</li>
                                    </ul>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-bold mt-2">→ 조치: 반복적으로 나타나면 개발자 문의</p>
                                </div>

                                <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10 p-4 rounded-r-lg">
                                    <h5 className="font-bold text-green-700 dark:text-green-300 mb-2">🟢 INFO - 정상 동작</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">일반적인 정보 메시지로, 시스템이 정상 동작하고 있다는 신호입니다.</p>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">자주 보는 INFO 메시지:</p>
                                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside pl-2">
                                        <li><code>DB 워밍업 완료</code> → 서버 시작 시 정상 메시지</li>
                                        <li><code>Draft 삭제 완료</code> → 임시 게시글 자동 정리 (정상)</li>
                                        <li><code>email_verifications 삭제</code> → 회원 탈퇴 시 인증 기록 정리 (정상)</li>
                                    </ul>
                                    <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-2">→ 조치: 확인만 하면 됨</p>
                                </div>

                                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-r-lg">
                                    <h5 className="font-bold text-blue-700 dark:text-blue-300 mb-2">🔵 DEBUG - 개발자용 상세 정보</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">개발 환경에서만 출력되는 상세 정보입니다. 일반적으로는 보이지 않습니다.</p>
                                </div>
                            </div>

                            <h4 className="text-lg font-semibold mb-3">상황별 로그 확인</h4>
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-bold mb-1">1. 회원가입이 안 된다는 신고</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">로그에서 다음 메시지 찾기:</p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside pl-2 mt-1">
                                            <li><code>ERROR</code> + <code>users 테이블 insert 실패</code></li>
                                            <li><code>ERROR</code> + <code>signup</code></li>
                                            <li><code>ERROR</code> + <code>verification-images</code></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-bold mb-1">2. 로그인이 안 된다는 신고</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">로그에서 다음 메시지 찾기:</p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside pl-2 mt-1">
                                            <li><code>ERROR</code> + <code>login</code></li>
                                            <li><code>WARNING</code> + <code>기존 세션</code> → 이건 정상</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-bold mb-1">3. 파일 업로드가 안 된다는 신고</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">로그에서 다음 메시지 찾기:</p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside pl-2 mt-1">
                                            <li><code>ERROR</code> + <code>upload_file_to_r2</code></li>
                                            <li><code>ERROR</code> + <code>upload</code> + <code>ClientError</code></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-bold mb-1">4. 공지사항 작성이 안 된다는 신고</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">로그에서 다음 메시지 찾기:</p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside pl-2 mt-1">
                                            <li><code>ERROR</code> + <code>create_notice</code></li>
                                            <li><code>ERROR</code> + <code>app.routes.notices</code></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-lg font-semibold mb-3">정상 vs 오류 빠른 구분</h4>
                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="font-bold text-green-700 dark:text-green-300 mb-2">✅ 이런 메시지는 정상입니다 (무시 가능)</p>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-xs">
                                            <thead className="border-b border-green-200 dark:border-green-800">
                                                <tr>
                                                    <th className="text-left py-1 pr-4">메시지</th>
                                                    <th className="text-left py-1">의미</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-600 dark:text-gray-400">
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[WARNING] Rate limit check failed</code></td>
                                                    <td className="py-1">Rate limit 확인 실패했지만 요청은 처리됨</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[WARNING] 재고 조회 실패</code></td>
                                                    <td className="py-1">Google Sheets 일시 오류, 캐시 사용</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[INFO] Draft 삭제 완료</code></td>
                                                    <td className="py-1">임시 게시글 자동 정리 완료</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[WARNING] 기존 세션 만료 실패</code></td>
                                                    <td className="py-1">이전 로그인 정리 실패, 현재 로그인은 성공</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[INFO] DB 워밍업 완료</code></td>
                                                    <td className="py-1">서버 시작 완료</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="font-bold text-red-700 dark:text-red-300 mb-2">⚠️ 이런 메시지는 확인 필요 (실제 오류)</p>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-xs">
                                            <thead className="border-b border-red-200 dark:border-red-800">
                                                <tr>
                                                    <th className="text-left py-1 pr-4">메시지</th>
                                                    <th className="text-left py-1 pr-4">의미</th>
                                                    <th className="text-left py-1">사용자 영향</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-600 dark:text-gray-400">
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[ERROR] users 테이블 insert 실패</code></td>
                                                    <td className="py-1 pr-4">회원가입 실패</td>
                                                    <td className="py-1">가입 불가</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[ERROR] upload_file_to_r2 ClientError</code></td>
                                                    <td className="py-1 pr-4">파일 업로드 실패</td>
                                                    <td className="py-1">첨부파일 업로드 불가</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[ERROR] Auth 삭제 실패</code></td>
                                                    <td className="py-1 pr-4">관리자 회원 거절 실패</td>
                                                    <td className="py-1">관리자 기능 오류</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[ERROR] verification-images 업로드 실패</code></td>
                                                    <td className="py-1 pr-4">학적인증 이미지 업로드 실패</td>
                                                    <td className="py-1">회원가입 불가</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1 pr-4"><code>[ERROR] R2 파일 삭제 실패</code></td>
                                                    <td className="py-1 pr-4">파일 삭제 실패</td>
                                                    <td className="py-1">스토리지 용량 증가</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-lg font-semibold mb-3">로그 검색 팁 (Fly.io 대시보드)</h4>
                            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Fly.io 대시보드 로그 화면에서 검색창을 사용할 수 있습니다:</p>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                                    <li><strong>에러만 보기:</strong> 검색창에 <code>ERROR</code> 입력</li>
                                    <li><strong>특정 기능 로그:</strong> 검색창에 <code>auth</code> 또는 <code>notices</code> 입력</li>
                                    <li><strong>특정 시간대:</strong> 대시보드에서 시간 필터 사용</li>
                                </ul>
                            </div>

                            <h4 className="text-lg font-semibold mb-3">긴급 상황 대응</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <p className="font-bold text-red-600 dark:text-red-400 mb-2">서버가 다운된 경우</p>
                                    <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                                        <li>Fly.io 대시보드에서 최근 <code>ERROR</code> 로그 확인</li>
                                        <li>마지막 에러 메시지 스크린샷</li>
                                        <li>개발자에게 전달</li>
                                    </ol>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <p className="font-bold text-orange-600 dark:text-orange-400 mb-2">특정 기능만 안 되는 경우</p>
                                    <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                                        <li>해당 기능 이름(회원가입, 로그인 등)으로 로그 검색</li>
                                        <li><code>ERROR</code> 메시지 찾기</li>
                                        <li>에러 메시지 전체 복사하여 개발자에게 전달</li>
                                    </ol>
                                </div>
                            </div>

                            <h4 className="text-lg font-semibold mb-3">정기 점검 시 확인 사항</h4>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-bold mb-1">매일 확인</p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• 최근 1시간 내 <code>ERROR</code> 로그 개수</li>
                                            <li>• 5개 이상 → 개발자 문의</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-bold mb-1">매주 확인</p>
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• <code>WARNING</code> 중 반복되는 패턴 확인</li>
                                            <li>• 같은 WARNING이 시간당 10회 이상 → 개발자 문의</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <strong>참고:</strong><br />
                                    • <strong>로그 보관 기간:</strong> Fly.io 플랜에 따라 다름 (일반적으로 7일)<br />
                                    • <strong>로그 레벨:</strong> <code>LOG_LEVEL</code> 환경변수로 조절 가능 (INFO가 기본값)<br />
                                    • <strong>긴급 연락:</strong> 심각한 오류 발견 시 즉시 개발자 연락
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-2">
                                    🚀 트래픽 급증 대비 (Scale Up)
                                </h3>
                                <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-3">
                                    행사 신청 기간 등 트래픽이 몰릴 것으로 예상될 때는 일시적으로 서버 메모리를 증설하여 안정성을 확보할 것을 권장합니다.
                                </p>
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <h4 className="font-bold text-sm -gray-900 dark:text-gray-100 mb-2">서버 메모리 임시 증가 방법</h4>
                                    <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li>Fly.io Dashboard 접속 후 해당 앱 선택</li>
                                        <li>좌측 메뉴에서 <strong>Machines</strong> 탭 클릭</li>
                                        <li>리스트에서 머신 선택 후 상단 <strong>Settings</strong> 또는 <strong>Scale</strong> 관련 메뉴 진입</li>
                                        <li><strong>Memory</strong>를 <code>1GB</code> (또는 그 이상)으로 변경</li>
                                        <li><strong>Change</strong>(또는 Update) 버튼을 눌러 적용 (서버 재시작됨)</li>
                                    </ol>
                                    <p className="text-xs text-gray-400 mt-2">
                                        ※ 행사가 끝나면 다시 <code>512MB</code>로 줄여 비용을 절감하세요.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 4. 데이터베이스 (Supabase) + 관리자 계정 */}
                        <section id="database" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                4. 데이터베이스 (Supabase)
                            </h2>

                            <h3 className="text-xl font-semibold mt-4 mb-2">4.1 주요 테이블 구조</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm font-bold">users</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">activities</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">posts</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">suggestions</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">registrations</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">rental_items</div>
                            </div>

                            <h3 className="text-xl font-semibold mt-4 mb-2">4.2 관리자 승격 (SQL)</h3>
                            <p className="text-sm mb-2">홈페이지 가입 후 Supabase SQL Editor에서 아래 명령어를 실행하여 관리자로 승격시킵니다.</p>
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                                {`-- 학번으로 관리자 승격
UPDATE users SET role = 'admin' WHERE student_id = '학번';

-- 현재 관리자 목록 확인
SELECT name, student_id, email, role FROM users WHERE role = 'admin';`}
                            </pre>

                            <h3 className="text-xl font-semibold mt-6 mb-2">4.3 유지보수 쿼리 모음</h3>
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                                {`-- 만료된 인증 코드 정리
DELETE FROM email_verifications WHERE expires_at < NOW();

-- 고아 Draft 게시글 정리 (1일 이상)
DELETE FROM posts WHERE is_draft = true AND created_at < NOW() - INTERVAL '1 day';

-- 활동 신청 인원 수 보정 (불일치 시)
UPDATE activities SET current_count = (
  SELECT COUNT(*) FROM activity_registrations WHERE activity_id = activities.id
);`}
                            </pre>
                        </section>

                        {/* 5. 스토리지 관리 */}
                        <section id="storage" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Cloud className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                5. 스토리지 관리
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                                    <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">Cloudflare R2 (Public)</h3>
                                    <p className="text-sm mb-2">일반 이미지용. Presigned URL을 사용하여 프론트엔드에서 직접 업로드합니다.</p>
                                    <ul className="text-xs list-disc list-inside text-gray-600 dark:text-gray-400">
                                        <li><code>club-images</code></li>
                                        <li><code>event-images</code></li>
                                        <li><code>post-attachments</code></li>
                                    </ul>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Supabase Storage (Private)</h3>
                                    <p className="text-sm mb-2">보안이 필요한 파일용. 관리자만 접근 가능합니다.</p>
                                    <ul className="text-xs list-disc list-inside text-gray-600 dark:text-gray-400">
                                        <li><code>verification-images</code> (학적 인증용)</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 6. 인증 및 보안 */}
                        <section id="auth-security" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                6. 인증 및 보안
                            </h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li><strong>CAPTCHA:</strong> Cloudflare Turnstile (회원가입/로그인 시)</li>
                                <li><strong>로그인 차단:</strong>
                                    <ul className="pl-6 list-[circle] text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <li>5회 실패 → 10분 차단</li>
                                        <li>10회 실패 → 1시간 차단</li>
                                        <li>15회 실패 → 영구 차단 (관리자 해제 필요)</li>
                                    </ul>
                                </li>
                                <li><strong>Rate Limiting:</strong> 상습적인 과도한 요청 시 자동 차단 (HTTP 429)</li>
                            </ul>
                        </section>

                        {/* 7. 트러블슈팅 & FAQ */}
                        <section id="troubleshooting" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                7. 트러블슈팅 & FAQ
                            </h2>

                            <div className="space-y-6">
                                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900">
                                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-3">
                                        <Key className="w-5 h-5" />
                                        Q. 인증 이메일이 안 와요! (Gmail Refresh Token 재발급)
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        <strong>원인:</strong> Gmail Refresh Token 만료.<br />
                                        <strong>해결:</strong> Google OAuth Playground에서 Refresh Token을 재발급받아야 합니다.
                                    </p>
                                    <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                        <li><a href="https://developers.google.com/oauthplayground" target="_blank" className="underline font-bold">OAuth Playground</a> 접속</li>
                                        <li>상단 톱니바퀴 ⚙️ → "Use your own OAuth credentials" 체크</li>
                                        <li>Client ID, Secret 입력 (Fly.io Secrets 값)</li>
                                        <li>API 목록에서 "Gmail API v1" 선택한 다음 Gmail Send 선택 후 Authorize</li>
                                        <li>"Exchange authorization code for tokens" 클릭</li>
                                        <li>새 Refresh Token을 Fly.io Secrets의 <code>GOOGLE_REFRESH_TOKEN</code>에 업데이트</li>
                                    </ol>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Q. 429 Too Many Requests 에러</h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                        정상적인 Rate Limiting 동작입니다. 또는 중복 클릭 방지일 수 있습니다.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Q. Supabase 무료 플랜 멈춤</h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                        1주일 미사용 시 자동 일시정지됩니다. Supabase Dashboard에서 "Restore" 버튼을 누르세요.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 8. 운영 체크리스트 */}
                        <section id="checklist" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                8. 운영 체크리스트
                            </h2>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                                <h3 className="font-bold mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">⚠️ 금지 사항 (Do Not)</h3>
                                <ul className="space-y-2 text-sm text-red-600 dark:text-red-400 mb-6">
                                    <li className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>SUPABASE_KEY(Service Role) 외부 노출 절대 금지</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>프로덕션 DB에서 `reset.sql` 절대 실행 금지 (데이터 증발)</span>
                                    </li>
                                </ul>

                                <h3 className="font-bold mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">학기 시작 전 체크</h3>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 관리자 계정 권한 확인 및 비밀번호 변경
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> Gmail Refresh Token 유효성 테스트 (회원가입 시도)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> Supabase 프로젝트 상태 확인 (일시정지 여부)
                                    </li>
                                </ul>

                                <h3 className="font-bold mt-6 mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">임기 교체 시 (인수인계)</h3>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 관련 계정(Fly.io, Supabase, Cloudflare, Google) 소유권 이관
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 구 임원 계정 `admin` 권한 회수 (SQL UPDATE)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 이 문서(Manual) 최신화 여부 확인
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8">
                                <h3 className="font-bold mb-2">관리자 링크 모음</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    <a href="https://fly.io/dashboard" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Fly.io Dashboard</a>
                                    <a href="https://supabase.com/dashboard" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Supabase Dashboard</a>
                                    <a href="https://dash.cloudflare.com" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Cloudflare Dash</a>
                                    <a href="https://console.cloud.google.com" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Google Cloud</a>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div >
    )
}
