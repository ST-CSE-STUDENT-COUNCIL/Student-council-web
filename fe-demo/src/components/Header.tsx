import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Header: React.FC = () => {
    const { isLoggedIn, logout } = useAuthStore();
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
            <Link to="/" className="text-xl font-bold text-gray-800">컴퓨터공학과 학생회</Link>
            <nav className=" flex gap-12">
                <Link to="/intro" className="text-gray-600 hover:text-gray-900">소개</Link>
                <Link to="/events" className="text-gray-600 hover:text-gray-900">행사</Link>
                <Link to="/notice" className="text-gray-600 hover:text-gray-900">공지</Link>
                <Link to="/well-being" className="text-gray-600 hover:text-gray-900">복지사업</Link>
                <Link to="/clubs" className="text-gray-600 hover:text-gray-900">소모임/동아리</Link>
            </nav>
            <div className="flex gap-4">
                {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        <Link to="/mypage" className="text-gray-600 hover:text-gray-900 font-medium text-indigo-600">마이페이지</Link>
                        <button
                            onClick={() => {
                                logout();
                                window.location.href = "/";
                            }}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            로그아웃
                        </button>
                    </div>
                ) : (
                    <Link to="/login" className="text-gray-600 hover:text-gray-900">로그인</Link>
                )}
            </div>
        </header>
    );
};

export default Header;
