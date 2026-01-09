import { useState } from 'react'
import { Modal } from '../../common/Modal'
import type { Event } from '../../../types/events'

type EventSurveyModalProps = {
    isOpen: boolean
    onClose: () => void
    event: Event
    onSubmit: (data: any) => Promise<void>
}

export const EventSurveyModal = ({ isOpen, onClose, event, onSubmit }: EventSurveyModalProps) => {
    const [feedback, setFeedback] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit({ feedback, eventId: event.id, type: 'survey' })
            onClose()
            setFeedback('')
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="수요조사 / 만족도 조사">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                    <p className="font-bold mb-1">{event.title}</p>
                    <p>여러분의 소중한 의견을 들려주세요.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">의견 / 건의사항</label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="자유롭게 의견을 작성해주세요."
                    />
                </div>

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
                        disabled={loading || !feedback.trim()}
                        className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : '제출하기'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
