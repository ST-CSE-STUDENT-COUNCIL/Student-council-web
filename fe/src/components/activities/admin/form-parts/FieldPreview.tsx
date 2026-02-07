import { memo } from 'react'
import type { FormField } from '../../../../types/activities'

const getFieldTypeLabel = (type: FormField['type']) => {
    switch (type) {
        case 'text': return '단답형';
        case 'textarea': return '장문형';
        case 'radio': return '객관식';
        case 'checkbox': return '체크박스';
        case 'select': return '드롭다운';
        case 'number': return '숫자';
        case 'date': return '날짜';
        case 'file': return '파일 업로드';
        case 'section': return '섹션';
        default: return type;
    }
}

export const FieldPreview = memo(({ field }: { field: FormField }) => {
    if (field.type === 'section') {
        return (
            <div className="p-6 bg-purple-50/50 rounded-r-xl border-l-[6px] border-l-purple-600">
                <h3 className="text-lg font-bold text-purple-900">{field.label || '제목 없는 섹션'}</h3>
                {field.help_text && <p className="text-sm text-purple-700 mt-1">{field.help_text}</p>}
                {field.condition && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white border border-purple-200 rounded text-xs text-purple-600">
                        <span className="font-bold">조건:</span> 질문 '{field.condition.target}'의 답이 '{field.condition.value}'일 때 표시
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex gap-2 mb-2">
                <h3 className="flex-1 font-medium text-base">
                    {field.label || '제목 없는 질문'}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
            </div>

            <div className="pointer-events-none opacity-60">
                {['text', 'number', 'date', 'file', 'textarea'].includes(field.type) && (
                    <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-500 w-2/3">
                        {getFieldTypeLabel(field.type)} 답변 입력란
                    </div>
                )}
                {['radio', 'checkbox', 'select'].includes(field.type) && (
                    <div className="space-y-2 pl-1">
                        {field.options?.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                {field.type === 'radio' && <div className="w-4 h-4 rounded-full border border-gray-400" />}
                                {field.type === 'checkbox' && <div className="w-4 h-4 rounded border border-gray-400" />}
                                {field.type === 'select' && <span className="text-xs">{idx + 1}.</span>}
                                <span className="text-sm">{opt}</span>
                            </div>
                        ))}
                        {(!field.options || field.options.length === 0) && (
                            <span className="text-sm text-red-400">옵션이 없습니다.</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
})
FieldPreview.displayName = 'FieldPreview'
