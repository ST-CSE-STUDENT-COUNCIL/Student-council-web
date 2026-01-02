import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Register() {
    const [step, setStep] = useState(1); // 1: Info, 2: Phone Verification

    // Info State
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Phone Verification State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation (Simple check)
        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        setStep(2);
    };

    const handleSendCode = () => {
        // Mock sending code
        if (!phoneNumber) {
            alert('전화번호를 입력해주세요.');
            return;
        }
        setIsCodeSent(true);
        alert('인증번호를 전송했습니다. (테스트용: 아무 번호나 입력하세요)');
    };

    const handleVerify = () => {
        // Mock verification
        if (verificationCode === '1234') { // Mock correct code
            setIsVerified(true);
            alert('인증이 완료되었습니다.');
        } else {
            // For simplicity, let's accept any code in this mock except empty
            if (verificationCode) {
                setIsVerified(true);
                alert('인증이 완료되었습니다.');
            } else {
                alert('인증번호를 입력해주세요.');
            }
        }
    };

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isVerified) {
            toast.error('전화번호 인증을 완료해주세요.');
            return;
        }

        try {
            await api.post('/auth/register', { name, studentId, password, phoneNumber });
            toast.success('회원가입이 완료되었습니다! 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            console.error(error);
            toast.error('회원가입 실패: 잠시 후 다시 시도해주세요.');
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-10">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
                        <p className="text-gray-500">
                            {step === 1 ? '기본 정보를 입력해주세요' : '전화번호 인증을 진행해주세요'}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleNextStep} className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                    placeholder="홍길동"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">학번</label>
                                <input
                                    id="studentId"
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                    placeholder="20XXXXXX"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                                다음
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
                                        placeholder="01012345678"
                                        disabled={isVerified}
                                    />
                                    <button
                                        onClick={handleSendCode}
                                        disabled={isVerified}
                                        className="px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium text-sm whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        인증번호 전송
                                    </button>
                                </div>
                            </div>

                            {isCodeSent && (
                                <div className="animate-fade-in-down">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">인증번호</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
                                            placeholder="인증번호 4자리"
                                            disabled={isVerified}
                                        />
                                        <button
                                            onClick={handleVerify}
                                            disabled={isVerified}
                                            className="px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm whitespace-nowrap disabled:bg-indigo-300 disabled:cursor-not-allowed"
                                        >
                                            확인
                                        </button>
                                    </div>
                                    {isVerified && <p className="text-green-600 text-sm mt-2 font-medium">✨ 인증이 완료되었습니다.</p>}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-lg transition-colors"
                                >
                                    이전
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!isVerified}
                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                                >
                                    가입하기
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                            로그인하기
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
