import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/terms')({
    component: TermsOfService,
})

function TermsOfService() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">이용약관</h1>

            <div className="prose prose-slate max-w-none space-y-10 text-gray-700 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제1조</span>
                        목적
                    </h2>
                    <p>
                        본 약관은 서울과학기술대학교 컴퓨터공학과 학생회(이하 "학생회")가 운영하는 학생회 홈페이지(이하 "사이트")에서 제공하는 제반 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 학생회의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제2조</span>
                        용어의 정의
                    </h2>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li><strong>"사이트"</strong>란 학생회가 서비스를 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 또는 용역을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</li>
                        <li><strong>"이용자"</strong>란 사이트에 접속하여 본 약관에 따라 학생회가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                        <li><strong>"회원"</strong>이라 함은 사이트에 학적 정보를 제공하여 회원등록을 한 자로서, 학생회의 인증을 받아 서비스를 지속적으로 이용할 수 있는 자를 말합니다.</li>
                        <li><strong>"아이디(ID)"</strong>라 함은 회원의 식별과 서비스 이용을 위하여 회원이 정하고 학생회가 승인하는 문자와 숫자의 조합(학번)을 말합니다.</li>
                        <li><strong>"비밀번호"</strong>라 함은 회원이 부여받은 아이디와 일치된 회원임을 확인하고 회원 자신의 비밀을 보호하기 위하여 회원 자신이 정한 문자와 숫자의 조합을 말합니다.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제3조</span>
                        회원가입
                    </h2>
                    <ol className="list-decimal pl-5 mt-2 space-y-2">
                        <li>이용자는 학생회가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</li>
                        <li>학생회는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm bg-gray-50 p-3 rounded">
                                <li>서울과학기술대학교 컴퓨터공학과 재학생(휴학생 포함)이 아닌 경우</li>
                                <li>가입신청자가 본 약관 제5조 제3항에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                                <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                                <li>기타 회원으로 등록하는 것이 학생회의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                            </ul>
                        </li>
                        <li>회원가입계약의 성립시기는 학생회 관리자의 승인이 이루어진 시점으로 합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제4조</span>
                        회원 탈퇴 및 자격 상실 등
                    </h2>
                    <ol className="list-decimal pl-5 mt-2 space-y-2">
                        <li>회원은 학생회에 언제든지 탈퇴를 요청할 수 있으며 학생회는 즉시 회원탈퇴를 처리합니다. 단, 진행 중인 사업(물품 대여 등)이 있는 경우 처리가 지연될 수 있습니다.</li>
                        <li>회원이 다음 각 호의 사유에 해당하는 경우, 학생회는 회원자격을 제한 및 정지시킬 수 있습니다.
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm bg-gray-50 p-3 rounded">
                                <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                                <li>다른 사람의 사이트 이용을 방해하거나 그 정보를 도용하는 등 사이트 운영 질서를 위협하는 경우</li>
                                <li>사이트를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                                <li>학생회 서비스(물품 대여 등)를 악용하여 학생회 및 타 회원에게 피해를 입힌 경우</li>
                            </ul>
                        </li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제5조</span>
                        서비스의 제공 및 변경
                    </h2>
                    <p className="mb-2">학생회는 다음과 같은 업무를 수행합니다.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>학생회비 납부 내역 및 복지 혜택 조회 서비스</li>
                        <li>학과 공지사항 및 행사 안내 서비스</li>
                        <li>학과 행사 참여 신청 및 관리 서비스</li>
                        <li>학생 복지 물품 대여 및 시설 예약 서비스</li>
                        <li>기타 학생회가 정하는 업무</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제6조</span>
                        개인정보보호
                    </h2>
                    <p>
                        학생회는 이용자의 개인정보 수집 시 서비스 제공을 위하여 필요한 유효한 최소한의 개인정보를 수집합니다. 학생회는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련 법령 및 학생회의 개인정보처리방침이 적용됩니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제7조</span>
                        학생회의 의무
                    </h2>
                    <ol className="list-decimal pl-5 mt-2 space-y-2">
                        <li>학생회는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 본 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.</li>
                        <li>학생회는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함)보호를 위한 보안 시스템을 갖추어야 합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded mr-2">제8조</span>
                        면책조항
                    </h2>
                    <ol className="list-decimal pl-5 mt-2 space-y-2">
                        <li>학생회는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                        <li>학생회는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                        <li>학생회는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
                    </ol>
                </section>

                <section className="border-t pt-6 mt-8">
                    <p className="text-sm text-gray-500">
                        <strong className="text-gray-700">부칙</strong><br />
                        제1조 (시행일) 본 약관은 2025년 1월 1일부터 시행합니다.
                    </p>
                </section>
            </div>
        </div>
    )
}
