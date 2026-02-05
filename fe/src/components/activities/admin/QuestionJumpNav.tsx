import { useState } from 'react'

export type JumpNavQuestion = {
  id: string
  label: string
}

type QuestionJumpNavProps = {
  questions: JumpNavQuestion[]
  onJump: (questionId: string) => void
  className?: string
}

export const QuestionJumpNav = ({ questions, onJump, className }: QuestionJumpNavProps) => {
  const [selectedId, setSelectedId] = useState<string>('')

  const hasQuestions = questions.length > 0
  const selectValue = questions.some(item => item.id === selectedId) ? selectedId : ''

  return (
    <div
      className={[
        'rounded-2xl border border-gray-100 bg-white shadow-sm',
        'px-4 py-3',
        className ?? ''
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">문항 바로가기</p>
          <p className="text-xs text-gray-500">원하는 질문을 선택하면 해당 문항으로 스크롤합니다.</p>
        </div>

        <select
          value={selectValue}
          onChange={(e) => {
            const next = e.target.value
            setSelectedId(next)
            if (next) onJump(next)
          }}
          className="w-full md:w-96 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
          disabled={!hasQuestions}
        >
          <option value="" disabled>
            문항 선택...
          </option>
          {questions.map(item => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
