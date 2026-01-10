import { useState } from 'react'
import { Modal } from '../../common/Modal'
import type { Event } from '../../../types/events'

type EventApplicationModalProps = {
    isOpen: boolean
    onClose: () => void
    event: Event
    type: 'register' | 'kakao' | 'payment'
    onSubmit: (data: any) => Promise<void>
}

export const EventApplicationModal = ({ isOpen, onClose, event, type, onSubmit }: EventApplicationModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        studentId: '',
        department: '컴퓨터공학과',
        phone: '',
        // Payment specific
        depositorName: '',
        amount: event.description?.match(/[\d,]+원/)?.[0] || '30,000원' // Extract amount from description or default
    })

    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit({ ...formData, eventId: event.id, type })
            onClose()
            // Reset form?
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const getTitle = () => {
        switch (type) {
            case 'kakao': return '카톡방 초대 신청'
            case 'payment': return '학생회비 납부 확인 신청'
            default: return '행사 참여 신청'
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                    <p className="font-bold mb-1">{event.title}</p>
                    <p>신청 정보를 정확히 입력해주세요.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이름을 입력하세요"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
                        <input
                            type="text"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="예: 25101234"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                            readOnly
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="010-0000-0000"
                    />
                </div>

                {type === 'payment' && (
                    <>
                        <div className="border-t border-gray-100 my-2 pt-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">납부 정보</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">입금자명 (본인과 다를 경우 기재)</label>
                                    <input
                                        type="text"
                                        name="depositorName"
                                        value={formData.depositorName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="미입력 시 신청자 이름으로 간주"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">납부 금액</label>
                                    <input
                                        type="text"
                                        name="amount"
                                        value={formData.amount}
                                        readOnly
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : '신청하기'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
