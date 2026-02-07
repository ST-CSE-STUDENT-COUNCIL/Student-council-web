import { memo } from 'react'
import { Copy, Trash2, X, Type, ChevronDown } from 'lucide-react'
import type { FormField } from '../../../../types/activities'

type FieldEditorProps = {
    field: FormField
    onChange: (updates: Partial<FormField>) => void
    onDelete: () => void
    onDuplicate: () => void
    allFields: FormField[]
}

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

export const FieldEditor = memo(({ field, onChange, onDelete, onDuplicate, allFields }: FieldEditorProps) => {

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault()
    }

    // 옵션 추가 핸들러
    const addOption = () => {
        const currentOptions = field.options || []
        onChange({ options: [...currentOptions, `옵션 ${currentOptions.length + 1}`] })
    }

    // 옵션 수정 핸들러
    const updateOption = (idx: number, value: string) => {
        const currentOptions = [...(field.options || [])]
        currentOptions[idx] = value
        onChange({ options: currentOptions })
    }

    // 옵션 삭제 핸들러
    const removeOption = (idx: number) => {
        const currentOptions = [...(field.options || [])]
        currentOptions.splice(idx, 1)
        onChange({ options: currentOptions })
    }

    // 옵션 인풋에서 엔터키 처리
    const handleOptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addOption()
        }
    }

    const isSection = field.type === 'section'

    if (isSection) {
        return (
            <div className="p-6 bg-purple-50 rounded-r-xl">
                <div className="mb-4 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 inline-block rounded">
                    섹션 구분
                </div>
                <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onChange({ label: e.target.value })}
                    onKeyDown={handleKeyDown}
                    placeholder="섹션 제목 (예: 추가 정보)"
                    className="w-full text-xl font-bold bg-transparent border-b-2 border-purple-200 focus:border-purple-600 outline-none px-1 py-2 placeholder-purple-300 transition-colors mb-2"
                    autoFocus
                />
                <input
                    type="text"
                    value={field.help_text || ''}
                    onChange={(e) => onChange({ help_text: e.target.value })}
                    onKeyDown={handleKeyDown}
                    placeholder="섹션 설명 (선택사항)"
                    className="w-full text-sm bg-transparent border-b border-purple-200 focus:border-purple-500 outline-none px-1 py-1 placeholder-purple-300"
                />

                {/* 섹션 조건 설정 (간단 버전) */}
                <div className="mt-6 border-t border-purple-200 pt-4">
                    <label className="flex items-center gap-2 text-sm text-purple-800 font-medium mb-3">
                        <input
                            type="checkbox"
                            checked={!!field.condition}
                            onChange={(e) => {
                                if (e.target.checked) onChange({ condition: { target: '', value: '' } });
                                else onChange({ condition: undefined });
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        이전 질문 답변에 따라 이 섹션 표시
                    </label>

                    {field.condition && (
                        <div className="flex gap-2 items-center bg-white p-3 rounded border border-purple-200">
                            <select
                                value={field.condition.target}
                                onChange={(e) => onChange({ condition: { ...field.condition!, target: e.target.value } })}
                                className="border rounded text-sm p-1.5 flex-1"
                            >
                                <option value="">-- 기준 질문 선택 --</option>
                                {allFields
                                    .filter(f => f.type === 'radio' || f.type === 'select') // 객관식 질문만 조건으로 사용 가능
                                    .map(f => (
                                        <option key={f.name} value={f.name}>{f.label || '(제목 없음)'}</option>
                                    ))}
                            </select>
                            <span className="text-sm">답변이</span>
                            <input
                                type="text"
                                value={field.condition.value}
                                onChange={(e) => onChange({ condition: { ...field.condition!, value: e.target.value } })}
                                onKeyDown={handleKeyDown}
                                placeholder="예: 참여"
                                className="border rounded text-sm p-1.5 flex-1"
                            />
                            <span className="text-sm">일 때 표시</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6 border-t border-purple-200 pt-4">
                    <button type="button" onClick={onDuplicate} title="복사" className="p-2 text-gray-500 hover:bg-purple-100 rounded-full"><Copy size={18} /></button>
                    <button type="button" onClick={onDelete} title="삭제" className="p-2 text-gray-500 hover:bg-purple-100 rounded-full"><Trash2 size={18} /></button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-gray-50 rounded-t-md border-b-2 border-gray-300 focus-within:border-blue-700 transition-colors px-3">
                    <input
                        type="text"
                        value={field.label}
                        onChange={(e) => onChange({ label: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder="질문"
                        className="w-full h-12 bg-transparent text-base outline-none placeholder-gray-500"
                        autoFocus
                    />
                </div>
                <div className="w-64">
                    <div className="border border-gray-200 rounded px-3 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50 relative group">
                        <Type size={18} className="text-gray-500" />
                        <select
                            value={field.type}
                            onChange={(e) => onChange({ type: e.target.value as FormField['type'] })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <optgroup label="입력형">
                                <option value="text">단답형</option>
                                <option value="textarea">장문형</option>
                                <option value="number">숫자</option>
                                <option value="date">날짜</option>
                                <option value="file">파일 업로드</option>
                            </optgroup>
                            <optgroup label="선택형">
                                <option value="radio">객관식 질문</option>
                                <option value="checkbox">체크박스</option>
                                <option value="select">드롭다운</option>
                            </optgroup>
                        </select>
                        <span className="flex-1 text-sm">{getFieldTypeLabel(field.type)}</span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </div>
                </div>
            </div>

            {/* 내용 편집 영역 (타입별 상이) */}
            <div className="mb-6 pl-1">
                {['text', 'number', 'date'].includes(field.type) && (
                    <div className="border-b border-dotted border-gray-300 py-2 w-1/2 text-gray-400 text-sm">
                        단답형 텍스트 답변
                    </div>
                )}
                {field.type === 'textarea' && (
                    <div className="border-b border-dotted border-gray-300 py-2 w-full text-gray-400 text-sm">
                        장문형 텍스트 답변
                    </div>
                )}
                {field.type === 'file' && (
                    <div className="border border-gray-200 rounded p-3 w-1/2 text-gray-500 text-sm flex items-center gap-2 bg-gray-50">
                        <span className="bg-blue-600 text-white px-2 py-1 text-xs rounded">파일 선택</span>
                        사용자가 파일을 업로드할 수 있습니다.
                    </div>
                )}
                {['radio', 'checkbox', 'select'].includes(field.type) && (
                    <div className="space-y-2">
                        {field.options?.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2 group">
                                {field.type === 'radio' && <div className="w-4 h-4 rounded-full border border-gray-300" />}
                                {field.type === 'checkbox' && <div className="w-4 h-4 rounded border border-gray-300" />}
                                {field.type === 'select' && <span className="text-xs text-gray-400">{idx + 1}.</span>}

                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                    onKeyDown={handleOptionKeyDown}
                                    className="flex-1 hover:border-b border-transparent hover:border-gray-300 focus:border-b-2 focus:border-blue-700 outline-none py-1 transition-colors"
                                />
                                <button type="button" onClick={() => removeOption(idx)} className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-4" />
                            <button type="button" onClick={addOption} className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1">
                                옵션 추가
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 items-center gap-4">
                <button type="button" onClick={onDuplicate} title="복사" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Copy size={18} /></button>
                <div className="h-6 w-px bg-gray-200" />
                <button type="button" onClick={onDelete} title="삭제" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Trash2 size={18} /></button>
                <div className="h-6 w-px bg-gray-200" />

                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-sm font-medium text-gray-600">필수</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </div>
                </label>
            </div>
        </div>
    )
})
FieldEditor.displayName = 'FieldEditor'
