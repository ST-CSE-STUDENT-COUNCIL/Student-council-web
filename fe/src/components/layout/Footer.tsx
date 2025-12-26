export default function Footer() {
    return (
        <footer className="border-t py-6 bg-gray-50 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center md:items-start space-y-2">
                    <p className="font-semibold text-gray-900">서울과학기술대학교 컴퓨터공학과 학생회</p>
                    <p className="text-sm text-gray-500">
                        서울특별시 노원구 공릉로 232 서울과학기술대학교
                    </p>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                    <a href="#" className="hover:text-gray-900">개인정보처리방침</a>
                    <a href="#" className="hover:text-gray-900">이용약관</a>
                    <a href="#" className="hover:text-gray-900">문의하기</a>
                </div>
                <div className="text-xs text-gray-400">
                    © 2025 Computer Engineering Student Council.
                </div>
            </div>
        </footer>
    )
}
