import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from "../components/Layout";
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Test mock data for simplicity if backend connection issues, but user asked for API
            // Using the api client configured
            const response = await api.post('/auth/login', { studentId, password });

            const { user, token } = response.data;
            login(user, token);

            toast.success('로그인에 성공했습니다! 👋');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('로그인 실패: 학번과 비밀번호를 확인해주세요.');
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
                        <p className="text-gray-500">학번으로 로그인해주세요</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                                학번
                            </label>
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
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
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

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-gray-600 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                                로그인 유지
                            </label>
                            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                비밀번호 찾기
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            로그인
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        계정이 없으신가요?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
                            회원가입하기
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}