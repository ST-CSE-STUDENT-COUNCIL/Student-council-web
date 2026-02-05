import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Copy, GripVertical, X, MoreVertical, ChevronDown, ChevronUp, Layout, Type } from 'lucide-react'
import type { FormField } from '../../../types/activities'

type FormFieldsManagerProps = {
    fields: FormField[]
    onChange: (fields: FormField[]) => void
}

/**
 * 구글 폼 스타일의 직관적인 질문 생성기
 */
export const FormFieldsManager = ({ fields, onChange }: FormFieldsManagerProps) => {
    // 현재 활성화(편집 중)된 필드의 인덱스
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

    // 새 질문 추가
    const addField = (type: FormField['type'] = 'text') => {
        const newField: FormField = {
            name: `field_${Date.now()}`,
            label: '',
            type,
            required: false,
            options: type === 'section' ? undefined : [], // 섹션은 옵션 없음
            placeholder: '',
            help_text: ''
        }

        // 섹션은 맨 마지막, 일반 질문은 현재 포커스 다음 또는 맨 뒤에 추가
        const insertIndex = focusedIndex !== null ? focusedIndex + 1 : fields.length

        const newFields = [...fields]
        newFields.splice(insertIndex, 0, newField)

        onChange(newFields)
        setFocusedIndex(insertIndex)
    }

    // 질문 업데이트
    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields]
        newFields[index] = { ...newFields[index], ...updates }
        onChange(newFields)
    }

    // 질문 삭제
    const deleteField = (index: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        const newFields = fields.filter((_, i) => i !== index)
        onChange(newFields)
        if (focusedIndex === index) setFocusedIndex(null)
    }

    // 질문 복제
    const duplicateField = (index: number) => {
        const field = fields[index]
        const newField = {
            ...field,
            name: `field_${Date.now()}`, // name은 유니크해야 함
            label: field.label + ' (복사됨)'
        }
        const newFields = [...fields]
        newFields.splice(index + 1, 0, newField)
        onChange(newFields)
        setFocusedIndex(index + 1)
    }

    // 순서 변경 (간단한 위/아래 이동)
    const moveField = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === fields.length - 1) return

        const newFields = [...fields]
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]

        onChange(newFields)
        setFocusedIndex(targetIndex) // 포커스 따라가기
    }

    return (
        <div className="flex gap-4 items-start relative w-full">
            {/* 메인 리스트 영역 */}
            <div className="flex-1 space-y-4 pb-20">
                {fields.length === 0 && (
                    <div
                        className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => addField('text')}
                    >
                        <p className="mb-2">아직 질문이 없습니다.</p>
                        <p className="font-bold text-blue-600">+ 버튼을 눌러 첫 번째 질문을 만들어보세요!</p>
                    </div>
                )}

                {fields.map((field, index) => (
                    <div
                        key={field.name}
                        onClick={() => setFocusedIndex(index)}
                        className={`
                            relative bg-white rounded-xl transition-all duration-200
                            ${focusedIndex === index
                                ? 'shadow-lg ring-1 ring-blue-200 border-l-8 border-l-blue-600 z-10 scale-[1.01]'
                                : 'shadow-sm border border-gray-200 hover:shadow-md cursor-pointer border-l-8 border-l-transparent'
                            }
                        `}
                    >
                        {focusedIndex === index ? (
                            // 편집 모드
                            <FieldEditor
                                field={field}
                                onChange={(updates) => updateField(index, updates)}
                                onDelete={() => deleteField(index)}
                                onDuplicate={() => duplicateField(index)}
                                allFields={fields} // 조건 설정을 위해 전체 필드 전달
                            />
                        ) : (
                            // 뷰 모드
                            <FieldPreview field={field} />
                        )}

                        {/* 사이드 액션 (순서 변경 등) - 호버 시 표시 추천하지만 여기선 간단히 항상 표시 or 포커스시 표시 */}
                        {focusedIndex === index && (
                            <div className="absolute -right-12 top-0 flex flex-col gap-2 p-2 flex">
                                <button type="button" onClick={(e) => { e.stopPropagation(); moveField(index, 'up') }} className="p-2 bg-white shadow rounded-full text-gray-500 hover:text-blue-600" title="위로 이동"><ChevronUp size={18} /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); moveField(index, 'down') }} className="p-2 bg-white shadow rounded-full text-gray-500 hover:text-blue-600" title="아래로 이동"><ChevronDown size={18} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 플로팅 사이드바 (구글 폼 스타일 - 리스트 우측 sticky) */}
            <div className="sticky top-10 z-10 self-start h-fit flex flex-col gap-3 bg-white p-2 rounded-xl shadow-md border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                <SideButton icon={<Plus size={20} />} label="질문 추가" onClick={() => addField('text')} />
                <SideButton icon={<Layout size={20} />} label="섹션 추가" onClick={() => addField('section')} />
            </div>
        </div>
    )
}

const SideButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        type="button"
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative group"
    >
        {icon}
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
            {label}
        </span>
    </button>
)

type FieldEditorProps = {
    field: FormField
    onChange: (updates: Partial<FormField>) => void
    onDelete: () => void
    onDuplicate: () => void
    allFields: FormField[]
}

const FieldEditor = ({ field, onChange, onDelete, onDuplicate, allFields }: FieldEditorProps) => {

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
}

const FieldPreview = ({ field }: { field: FormField }) => {
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
