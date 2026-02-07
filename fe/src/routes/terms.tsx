import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/terms')({
    component: TermsOfService,
})

function TermsOfService() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
                이용약관
            </h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-gray-700 dark:text-gray-300 leading-relaxed">
                {/* 제1장 총칙 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        제1장 총칙
                    </h2>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제1조</span>
                            목적
                        </h3>
                        <p>
                            본 약관은 서울과학기술대학교 컴퓨터공학과 학생회(이하 "학생회")가 운영하는 학생회 홈페이지(이하 "사이트")에서 제공하는
                            제반 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 학생회의 권리·의무·책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
                        </p>
                    </article>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제2조</span>
                            용어의 정의
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li><strong className="text-gray-900 dark:text-white">"사이트"</strong>란 학생회가 서비스를 이용자에게 제공하기 위하여 정보통신설비를 이용하여 설정한 가상의 공간을 말합니다.</li>
                            <li><strong className="text-gray-900 dark:text-white">"이용자"</strong>란 사이트에 접속하여 본 약관에 따라 학생회가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                            <li><strong className="text-gray-900 dark:text-white">"회원"</strong>이라 함은 사이트에 학적 정보를 제공하여 회원등록을 한 자로서, 학생회의 인증을 받아 서비스를 지속적으로 이용할 수 있는 자를 말합니다.</li>
                            <li><strong className="text-gray-900 dark:text-white">"학번"</strong>이라 함은 회원의 식별과 서비스 이용을 위하여 회원이 제공하고 학생회가 승인하는 고유 번호를 말합니다.</li>
                            <li><strong className="text-gray-900 dark:text-white">"비밀번호"</strong>라 함은 회원이 부여받은 학번과 일치된 회원임을 확인하고 회원 자신의 비밀을 보호하기 위하여 회원 자신이 정한 문자와 숫자의 조합을 말합니다.</li>
                            <li><strong className="text-gray-900 dark:text-white">"회비"</strong>란 학생회 회칙 제50조에 따라 학생회의 활동을 위하여 회원이 납부하는 돈을 말합니다.</li>
                        </ol>
                    </article>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제3조</span>
                            약관의 효력 및 변경
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>본 약관은 사이트에 공시함으로써 효력이 발생합니다.</li>
                            <li>학생회는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 약관을 개정할 수 있습니다.</li>
                            <li>개정된 약관은 사이트에 공지함으로써 효력이 발생합니다.</li>
                        </ol>
                    </article>
                </section>

                {/* 제2장 회원가입 및 서비스 이용 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        제2장 회원가입 및 서비스 이용
                    </h2>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제4조</span>
                            회원가입
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>이용자는 학생회가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
                            <li>학생회는 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                    <li>서울과학기술대학교 컴퓨터공학과 재학생(휴학생 포함)이 아닌 경우</li>
                                    <li>가입신청자가 본 약관 제6조에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                                    <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                                    <li>기타 회원으로 등록하는 것이 학생회의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                                </ul>
                            </li>
                            <li>회원가입계약의 성립시기는 학생회 관리자의 승인이 이루어진 시점으로 합니다.</li>
                        </ol>
                    </article>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제5조</span>
                            서비스의 제공
                        </h3>
                        <p className="mb-2">학생회는 다음과 같은 서비스를 제공합니다.</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>학생회비 납부 내역 및 복지 혜택 조회 서비스</li>
                            <li>학과 공지사항 및 행사 안내 서비스</li>
                            <li>학과 행사 참여 신청 및 관리 서비스</li>
                            <li>수요조사 및 설문조사 서비스</li>
                            <li>학생 복지 물품 대여 서비스</li>
                            <li>기타 학생회가 정하는 서비스</li>
                        </ul>
                    </article>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제6조</span>
                            회원 탈퇴 및 자격 상실
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>회원은 학생회에 언제든지 탈퇴를 요청할 수 있으며 학생회는 즉시 회원탈퇴를 처리합니다. 단, 진행 중인 서비스(물품 대여 등)이 있는 경우 처리가 지연될 수 있습니다.</li>
                            <li>회원이 다음 각 호의 사유에 해당하는 경우, 학생회는 회원자격을 제한 및 정지시킬 수 있습니다.
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                    <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                                    <li>다른 사람의 사이트 이용을 방해하거나 그 정보를 도용하는 등 사이트 운영 질서를 위협하는 경우</li>
                                    <li>사이트를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                                    <li>학생회 서비스(물품 대여 등)를 악용하여 학생회 및 타 회원에게 피해를 입힌 경우</li>
                                </ul>
                            </li>
                        </ol>
                    </article>
                </section>

                {/* 제3장 회비 및 복지 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        제3장 회비 및 복지
                    </h2>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제7조</span>
                            회비 납부
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>회비에 관한 사항은 학생회 회칙 제50조에 따라 회장이 정하되, 금액·납부자 지위 유지 기간·환급 기준 등 주요 사항을 개정하는 때에는 대표자 회의의 동의를 얻어야 합니다.</li>
                            <li>학생회 회칙 제52조에 따라 누구든지 회비의 납부를 강요하여서는 아니 됩니다.</li>
                            <li>회비 납부자에게는 학생회가 정하는 복지 혜택이 제공됩니다.</li>
                        </ol>
                    </article>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제8조</span>
                            회비 환급
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>학생회 회칙 제51조에 따라, 회원은 전과나 자퇴, 편입, 퇴학 등의 이유로 회원의 자격을 상실한 때에 한하여 납부한 회비의 전부 또는 일부를 환급받을 수 있습니다.</li>
                            <li>환급의 방법과 절차는 학생회가 정하며, 학기당 3일 이상의 환급 신청 기간을 가져야 합니다.</li>
                        </ol>
                    </article>
                </section>

                {/* 제4장 개인정보보호 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        제4장 개인정보보호
                    </h2>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제9조</span>
                            개인정보의 수집 및 이용
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>학생회는 이용자의 개인정보 수집 시 서비스 제공을 위하여 필요한 최소한의 개인정보를 수집합니다.</li>
                            <li>수집하는 개인정보 항목은 다음과 같습니다.
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                    <li>필수항목: 이름, 학번, 학과, 학교 이메일, 전화번호</li>
                                    <li>선택항목: 학생증 사진(본인 인증용)</li>
                                </ul>
                            </li>
                            <li>학생회는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다.</li>
                        </ol>
                    </article>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제10조</span>
                            개인정보의 보유 및 파기
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>개인정보는 회원 자격 유지 기간 동안 보유하며, 탈퇴 시 지체 없이 파기합니다.</li>
                            <li>단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관할 수 있습니다.</li>
                        </ol>
                    </article>
                </section>

                {/* 제5장 학생회 및 이용자의 의무 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        제5장 학생회 및 이용자의 의무
                    </h2>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제11조</span>
                            학생회의 의무
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>학생회는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 본 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.</li>
                            <li>학생회는 이용자가 안전하게 서비스를 이용할 수 있도록 이용자의 개인정보 보호를 위한 보안 시스템을 갖추어야 합니다.</li>
                            <li>학생회는 학생회 회칙에 따라 재정을 투명하게 운용하여야 합니다.</li>
                        </ol>
                    </article>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제12조</span>
                            이용자의 의무
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>이용자는 가입 시 정확한 정보를 제공해야 하며, 변경 시 즉시 수정하여야 합니다.</li>
                            <li>이용자는 자신의 학번 및 비밀번호를 관리할 책임이 있으며, 이를 제3자에게 양도하거나 대여할 수 없습니다.</li>
                            <li>이용자는 다음 각 호의 행위를 하여서는 아니 됩니다.
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                                    <li>타인의 정보 도용</li>
                                    <li>서비스의 운영을 방해하는 행위</li>
                                    <li>허위 정보 등록</li>
                                    <li>학생회 및 타 이용자의 명예를 훼손하는 행위</li>
                                    <li>기타 법령 또는 본 약관에서 금지하는 행위</li>
                                </ul>
                            </li>
                        </ol>
                    </article>
                </section>

                {/* 제6장 면책조항 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        제6장 면책조항
                    </h2>

                    <article className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-2 py-1 rounded mr-2">제13조</span>
                            면책
                        </h3>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>학생회는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                            <li>학생회는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                            <li>학생회는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
                            <li>학생회는 회원이 게재한 정보, 자료, 사실의 정확성 등에 관하여 책임을 지지 않습니다.</li>
                        </ol>
                    </article>
                </section>

                {/* 부칙 */}
                <section className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">부칙</h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                        <p><strong className="text-gray-700 dark:text-gray-300">제1조 (시행일)</strong> 본 약관은 2025년 1월 1일부터 시행합니다.</p>
                        <p><strong className="text-gray-700 dark:text-gray-300">제2조 (회칙과의 관계)</strong> 본 약관에서 정하지 아니한 사항은 서울과학기술대학교 컴퓨터공학과 학생회 회칙 및 관련 법령에 따릅니다.</p>
                    </div>
                </section>

                {/* 관련 문서 링크 */}
                <section className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mt-8">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">관련 문서</h3>
                    <ul className="space-y-2 text-sm">
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
