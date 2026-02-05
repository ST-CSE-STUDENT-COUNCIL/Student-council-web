import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/non-member-policy')({
    component: NonMemberPolicy,
})

function NonMemberPolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                비회원 개인정보 수집 및 처리 규정
            </h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    서울과학기술대학교 컴퓨터공학과 학생회(이하 '학생회')는 학생회비 미납부자 및 비회원이 학생회 주최 행사에 참여할 경우 다음과 같이 개인정보를 수집·이용합니다.
                    본 규정은 학생회 회칙 제50조 내지 제52조의 회비 관련 규정을 근거로 합니다.
                </p>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">1</span>
                        비회원의 정의
                    </h2>
                    <p className="mb-2">학생회는 다음의 경우를 '비회원'으로 정의합니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li>
                            <strong className="text-gray-900 dark:text-white">학생회비 미납부자:</strong><br />
                            학생회 홈페이지에 가입하지 않았거나, 학생회비를 납부하지 않은 컴퓨터공학과 재학생(휴학생 포함). 학생회 회칙 제50조에 따라 회비 납부 여부에 따른 혜택이 차등 적용될 수 있습니다.
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">타학과 학생:</strong><br />
                            서울과학기술대학교 타학과 소속 재학생으로, 컴퓨터공학과 학생회 행사에 참여를 희망하는 자
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">외부인:</strong><br />
                            서울과학기술대학교 재학생이 아닌 자로, 학생회 주최 행사에 참여를 허가받은 자
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">2</span>
                        개인정보의 수집 및 이용 목적
                    </h2>
                    <p className="mb-2">학생회는 비회원이 행사에 참여할 경우 다음의 목적을 위하여 개인정보를 수집·이용합니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li>
                            <strong className="text-gray-900 dark:text-white">행사 참가자 관리</strong><br />
                            참가 신청 확인, 참가자 명단 작성, 행사 당일 본인 확인
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">행사 운영 및 안전관리</strong><br />
                            비상 연락, 안전사고 발생 시 보호자 연락, 행사 관련 공지사항 전달
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">학과 구성원 확인</strong><br />
                            학생회비 납부 여부 확인(회칙 제50조), 학과 소속 여부 확인, 참가비 차등 적용
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">재정 관리</strong><br />
                            회칙 제48조에 따른 재정 사무의 투명한 운용을 위한 참가비 수납 및 환불 처리
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">3</span>
                        수집하는 개인정보의 항목
                    </h2>
                    <p className="mb-3">비회원 행사 신청 시 다음의 개인정보를 수집합니다.</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">대상</th>
                                    <th scope="col" className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">필수 항목</th>
                                    <th scope="col" className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">선택 항목</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">학생회비 미납부자</td>
                                    <td className="px-6 py-4">이름, 학번, 전화번호</td>
                                    <td className="px-6 py-4">카카오톡 ID, 환불계좌 등</td>
                                </tr>
                                <tr className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">타학과 학생</td>
                                    <td className="px-6 py-4">이름, 학번, 소속 학과, 전화번호</td>
                                    <td className="px-6 py-4">카카오톡 ID, 이메일, 환불계좌 등</td>
                                </tr>
                                <tr className="bg-white dark:bg-gray-900">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">외부인</td>
                                    <td className="px-6 py-4">이름, 생년월일, 소속(기관), 전화번호, 신분증명자료</td>
                                    <td className="px-6 py-4">카카오톡 ID, 이메일, 환불계좌 등</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">4</span>
                        개인정보의 보유 및 이용 기간
                    </h2>
                    <p className="mb-2">비회원의 개인정보는 다음과 같이 보유 및 이용됩니다.</p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mt-3 border border-gray-100 dark:border-gray-700">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-gray-900 dark:text-white">원칙:</strong> 해당 행사 종료 및 결산 완료 시까지 보유 (최대 6개월)</li>
                            <li><strong className="text-gray-900 dark:text-white">예외:</strong> 관계 법령 위반 또는 분쟁이 발생한 경우, 해당 사안이 종료될 때까지 보유</li>
                            <li><strong className="text-gray-900 dark:text-white">파기:</strong> 보유기간 경과 후 지체 없이 파기하며, 전자적 파일은 복구 불가능하도록 영구 삭제</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">5</span>
                        비회원의 권리 및 의무
                    </h2>
                    <p className="mb-2">비회원은 다음의 권리를 행사할 수 있습니다.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-3">
                        <li>
                            <strong className="text-gray-900 dark:text-white">열람·정정·삭제 요구:</strong> 언제든지 본인의 개인정보에 대한 열람, 정정, 삭제를 요구할 수 있습니다.
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">처리정지 요구:</strong> 개인정보의 처리 정지를 요구할 수 있으나, 이 경우 행사 참가가 제한될 수 있습니다.
                        </li>
                        <li>
                            <strong className="text-gray-900 dark:text-white">동의 철회:</strong> 개인정보 제공 동의를 철회할 수 있으며, 이 경우 행사 신청이 취소됩니다.
                        </li>
                    </ul>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        권리 행사는 학생회 이메일(seoultech.cs.42.compass@gmail.com) 또는 학생회실 방문을 통해 가능하며, 학생회는 지체 없이 조치하겠습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">6</span>
                        비회원 행사 참가 시 유의사항
                    </h2>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-5">
                        <p className="font-bold text-amber-900 dark:text-amber-200 mb-2">⚠️ 중요 안내</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-amber-800 dark:text-amber-300">
                            <li>학생회 회칙 제52조에 따라 <strong>회비 납부는 강요되지 않습니다.</strong> 비회원도 행사 참가가 가능합니다.</li>
                            <li>비회원의 행사 참가 시, 학생회비 납부 회원보다 참가비가 더 높게 책정될 수 있습니다. 이는 회칙 제50조에 따른 회비 납부자 대우에 근거합니다.</li>
                            <li>행사 신청 인원이 정원을 초과할 경우, 학생회비 납부 회원이 우선 선발될 수 있습니다.</li>
                            <li>학생회비 미납부로 인해 발생하는 혜택 제한 사항에 대해서는 이의를 제기할 수 없습니다.</li>
                            <li>타학과 학생 및 외부인의 경우, 행사 성격에 따라 참가가 제한될 수 있습니다.</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 mt-4">
                        <p className="font-bold text-blue-900 dark:text-blue-200 mb-2">💡 학생회비 납부 안내</p>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            학생회비를 납부하시면 행사 참가비 할인, 물품 대여 서비스, 복지 혜택 등 다양한 혜택을 받으실 수 있습니다.
                            납부 방법 및 혜택에 대한 자세한 내용은 학생회 홈페이지에서 확인하실 수 있습니다.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">7</span>
                        개인정보 보호책임자
                    </h2>
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                        <p className="mb-3">비회원 개인정보 처리와 관련한 문의사항이 있으시면 아래 연락처로 문의해주시기 바랍니다.</p>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white mb-1">개인정보 보호책임자</p>
                            <p>성명: 컴퓨터공학과 학생회장</p>
                            <p>연락처: 010-8338-1251</p>
                            <p>이메일: seoultech.cs.42.compass@gmail.com</p>
                        </div>
                    </div>
                </section>

                {/* 부칙 */}
                <section className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-700 dark:text-gray-300">부칙</strong><br />
                        이 비회원 개인정보 수집 및 처리 규정은 2025년 1월 1일부터 적용됩니다.
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
                            <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                                → 개인정보처리방침
                            </Link>
                        </li>

                    </ul>
                </section>
            </div>
        </div>
    )
}
