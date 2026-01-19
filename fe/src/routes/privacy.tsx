import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
    component: PrivacyPolicy,
})

function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">개인정보처리방침</h1>

            <div className="prose prose-slate max-w-none space-y-10 text-gray-700 leading-relaxed">
                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                    서울과학기술대학교 컴퓨터공학과 학생회(이하 '학생회')는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
                </p>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">1</span>
                        개인정보의 처리 목적
                    </h2>
                    <p className="mb-2">학생회는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li>
                            <strong className="text-gray-900">홈페이지 회원가입 및 관리</strong><br />
                            회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 제한적 본인확인제 시행에 따른 본인확인, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 등
                        </li>
                        <li>
                            <strong className="text-gray-900">재화 또는 서비스 제공</strong><br />
                            학과 행사(MT, 간식행사 등) 신청 및 참여 관리, 물품 대여 서비스 제공, 사물함 신청 및 배정, 학생회비 납부 내역 확인 등
                        </li>
                        <li>
                            <strong className="text-gray-900">민원 및 건의사항 처리</strong><br />
                            민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 등
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">2</span>
                        개인정보의 처리 및 보유 기간
                    </h2>
                    <p className="mb-2">학생회는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                    <div className="bg-gray-50 p-4 rounded-lg mt-3 border border-gray-100">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-gray-900">홈페이지 회원 정보:</strong> 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)</li>
                            <li><strong className="text-gray-900">행사 및 복지 사업 신청 정보:</strong> 해당 사업 종료 및 결산 완료 시까지 (최대 1년)</li>
                            <li><strong className="text-gray-900">학생회비 납부 정보:</strong> 졸업 시까지 (징빙 자료 보존 목적)</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">3</span>
                        처리하는 개인정보의 항목
                    </h2>
                    <p className="mb-3">학생회는 서비스 제공을 위해 다음의 개인정보 항목을 처리하고 있습니다.</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-600 border border-gray-200">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 border-b">수집 목적</th>
                                    <th scope="col" className="px-6 py-3 border-b">필수 항목</th>
                                    <th scope="col" className="px-6 py-3 border-b">선택 항목</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-gray-900">회원가입</td>
                                    <td className="px-6 py-4">아이디(학번), 비밀번호, 이름, 전화번호, 이메일, 학과(전공)</td>
                                    <td className="px-6 py-4">-</td>
                                </tr>
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-gray-900">행사/사업 신청</td>
                                    <td className="px-6 py-4">이름, 학번, 전화번호</td>
                                    <td className="px-6 py-4">카카오톡 ID, 입금자명, 환불계좌 등</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">4</span>
                        개인정보의 파기 절차 및 방법
                    </h2>
                    <p className="mb-2">학생회는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li>
                            <strong className="text-gray-900">파기절차:</strong> 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.
                        </li>
                        <li>
                            <strong className="text-gray-900">파기방법:</strong> 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">5</span>
                        정보주체와 법정대리인의 권리·의무 및 그 행사방법
                    </h2>
                    <p>정보주체는 학생회에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. 권리 행사는 학생회에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 학생회는 이에 대해 지체 없이 조치하겠습니다.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">6</span>
                        개인정보의 안전성 확보 조치
                    </h2>
                    <p className="mb-2">학생회는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li><strong className="text-gray-900">관리적 조치:</strong> 내부관리계획 수립·시행, 개인정보 취급자 최소화 및 교육</li>
                        <li><strong className="text-gray-900">기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 비밀번호 암호화, 보안프로그램 설치</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">7</span>
                        개인정보 보호책임자 및 담당부서
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                        <p className="mb-3">학생회는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-bold text-gray-900 mb-1">개인정보 보호책임자</p>
                                <p>성명: 컴퓨터공학과 학생회장</p>
                                <p>연락처: 010-8338-1251</p>
                                <p>이메일: seoultech.cs.42.compass@gmail.com</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 mb-1">개인정보 보호 담당부서</p>
                                <p>부서명: 컴퓨터공학과 학생회 집행부</p>
                                <p>이메일: seoultech.cs.42.compass@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-t pt-6 mt-8">
                    <p className="text-sm text-gray-500">
                        <strong className="text-gray-700">부칙</strong><br />
                        이 개인정보처리방침은 2025년 1월 1일부터 적용됩니다.
                    </p>
                </section>
            </div>
        </div>
    )
}
