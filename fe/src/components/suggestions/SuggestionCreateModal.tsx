import { useEffect, useState } from 'react'

import { Modal } from '../common/Modal'

export function SuggestionCreateModal({
    isOpen,
    submitting,
    onClose,
    onSubmit,
}: {
    isOpen: boolean
    submitting: boolean
    onClose: () => void
    onSubmit: (payload: { title: string; content: string }) => Promise<void>
}) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    useEffect(() => {
        if (!isOpen) {
            setTitle('')
            setContent('')
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (submitting) return
        const trimmedTitle = title.trim()
        const trimmedContent = content.trim()

        if (trimmedTitle.length < 2 || trimmedContent.length < 5) {
            alert('제목은 2자 이상, 내용은 5자 이상 입력해주세요.')
            return
        }

        await onSubmit({ title: trimmedTitle, content: trimmedContent })
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (submitting) return
                onClose()
            }}
            title="새 건의 작성"
            maxWidth="max-w-xl"
            footer={
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-xl border border-border-default bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors"
                        onClick={() => {
                            if (submitting) return
                            onClose()
                        }}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        form="suggestion-form"
                        disabled={submitting}
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${submitting ? 'bg-slate-400 dark:bg-slate-600' : 'bg-slate-900 dark:bg-blue-600 hover:-translate-y-0.5 hover:shadow-md'}`}
                    >
                        {submitting ? '등록 중...' : '등록하기'}
                    </button>
                </div>
            }
        >
            <form id="suggestion-form" className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-medium text-foreground">제목</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="예: 자습실 콘센트 추가 설치 요청"
                        className="mt-2 w-full rounded-xl border border-border-default bg-surface px-4 py-2.5 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-border-default focus:border-border-default"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground">내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="구체적인 위치, 문제 상황, 필요 조치 등을 작성해주세요."
                        rows={6}
                        className="mt-2 w-full rounded-xl border border-border-default bg-surface px-4 py-2.5 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-border-default focus:border-border-default resize-y"
                    />
                    <p className="mt-2 text-xs text-foreground-secondary">익명 건의함으로 처리되며, 관리자가 확인 후 진행됩니다.</p>
                </div>
            </form>
        </Modal>
    )
}
