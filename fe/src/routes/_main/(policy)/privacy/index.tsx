import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { privacyOfficerApi } from '../../../../lib/api/privacyOfficer'

export const Route = createFileRoute('/_main/(policy)/privacy/')({
    component: PrivacyPolicy,
})

function PrivacyPolicy() {
    // 개인정보 총책임자 정보 조회
    const { data: officerInfo } = useQuery({
        queryKey: ['privacyOfficerPublic'],
        queryFn: privacyOfficerApi.getPublic,
        staleTime: 1000 * 60 * 5, // 5분간 캐시
    })

    const officerName = officerInfo?.name || '컴퓨터공학과 학생회장'
    const officerPhone = officerInfo?.phone || '010-0000-0000'
    const officerEmail = officerInfo?.email || 'seoultech.cs.42.compass@gmail.com'

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                개인정보처리방침
            </h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    서울과학기술대학교 컴퓨터공학과 학생회(이하 '학생회')는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
                </p>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">1</span>
                        개인정보의 처리 목적
                    </h2>
                    <p className="mb-2">학생회는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li>
                            <strong className="text-gray-900 dark:text-white">홈페이지 회원가입 및 관리</strong><br />
                            회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 등
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">재화 또는 서비스 제공</strong><br />
                            학과 행사(MT, 간식행사 등) 신청 및 참여 관리, 물품 대여 서비스 제공, 사물함 신청 및 배정, 학생회비 납부 내역 확인, 수요조사 및 설문조사 서비스 제공 등
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">민원 및 건의사항 처리</strong><br />
                            민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 등
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">2</span>
                        개인정보의 처리 및 보유 기간
                    </h2>
                    <p className="mb-2">학생회는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mt-3 border border-gray-100 dark:border-gray-700">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-gray-900 dark:text-white">홈페이지 회원 정보:</strong> 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)</li>
                            <li><strong className="text-gray-900 dark:text-white">행사 및 복지 사업 신청 정보:</strong> 해당 사업 종료 및 결산 완료 시까지 (최대 1년)</li>
                            <li><strong className="text-gray-900 dark:text-white">학생회비 납부 정보:</strong> 학생회 회칙 제50조에 따른 납부자 지위 유지 기간까지</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">3</span>
                        처리하는 개인정보의 항목
                    </h2>
                    <p className="mb-3">학생회는 서비스 제공을 위해 다음의 개인정보 항목을 처리하고 있습니다.</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">수집 목적</th>
                                    <th scope="col" className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">필수 항목</th>
                                    <th scope="col" className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">선택 항목</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">회원가입</td>
                                    <td className="px-6 py-4">이름, 학번, 전화번호, 학교 이메일, 학과(전공), 비밀번호</td>
                                    <td className="px-6 py-4">학생증 사진 (본인 인증용)</td>
                                </tr>
                                <tr className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">행사/사업 신청</td>
                                    <td className="px-6 py-4">이름, 학번, 전화번호</td>
                                    <td className="px-6 py-4">카카오톡 ID, 입금자명, 환불계좌 등</td>
                                </tr>
                                <tr className="bg-white dark:bg-gray-900">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">수요조사/설문조사</td>
                                    <td className="px-6 py-4">이름, 학번</td>
                                    <td className="px-6 py-4">설문 응답 내용</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">4</span>
                        개인정보의 파기 절차 및 방법
                    </h2>
                    <p className="mb-2">학생회는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li>
                            <strong className="text-gray-900 dark:text-white">파기절차:</strong> 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">파기방법:</strong> 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">5</span>
                        정보주체의 권리·의무 및 그 행사방법
                    </h2>
                    <p className="mb-2">정보주체는 학생회에 대해 언제든지 다음의 권리를 행사할 수 있습니다.</p>
                    <ul className="list-disc pl-5 space-y-1 mt-3">
                        <li>개인정보 열람 요구</li>
                        <li>오류 등이 있을 경우 정정 요구</li>
                        <li>삭제 요구</li>
                        <li>처리정지 요구</li>
                    </ul>
                    <p className="mt-3">권리 행사는 학생회에 대해 서면, 전자우편, 또는 마이페이지를 통하여 하실 수 있으며 학생회는 이에 대해 지체 없이 조치하겠습니다.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">6</span>
                        개인정보의 안전성 확보 조치
                    </h2>
                    <p className="mb-2">학생회는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li><strong className="text-gray-900 dark:text-white">관리적 조치:</strong> 내부관리계획 수립·시행, 개인정보 취급자 최소화 및 교육</li>
                        <li><strong className="text-gray-900 dark:text-white">기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 비밀번호 암호화(bcrypt), 보안 통신(HTTPS) 적용</li>
                        <li><strong className="text-gray-900 dark:text-white">물리적 조치:</strong> 개인정보가 저장된 서버에 대한 접근 제한</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">7</span>
                        개인정보 보호책임자 및 담당부서
                    </h2>
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                        <p className="mb-3">학생회는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white mb-1">개인정보 보호책임자</p>
                                <p>성명: {officerName}</p>
                                <p>연락처: {officerPhone}</p>
                                <p>이메일: {officerEmail}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">8</span>
                        개인정보 처리방침 변경
                    </h2>
                    <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
                </section>

                {/* 부칙 */}
                <section className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-700 dark:text-gray-300">부칙</strong><br />
                        이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다.
                    </div>
                </section>

                {/* 관련 문서 링크 */}
                <section className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mt-8">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">관련 문서</h3>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                                → 이용약관
                            </Link>
                        </li>
                        <li>
                            <Link to="/non-member-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
                                → 비회원 개인정보 수집 및 처리 규정
                            </Link>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    )
}

