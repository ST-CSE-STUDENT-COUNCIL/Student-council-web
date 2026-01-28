import { useState } from 'react'
import type { FormField } from '../../../types/activities'

type FormFieldsManagerProps = {
    fields: FormField[]
    onChange: (fields: FormField[]) => void
}

/**
 * 활동 신청 시 추가 질문을 관리하는 컴포넌트
 */
export const FormFieldsManager = ({ fields, onChange }: FormFieldsManagerProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)

    const [currentField, setCurrentField] = useState<FormField>({
        name: '',
        label: '',
        type: 'text',
        required: false,
        options: [],
        placeholder: '',
        help_text: ''
    })

    // 옵션 문자열 관리 (줄바꿈이나 콤마로 구분된 문자열을 배열로 변환)
    const [optionsStr, setOptionsStr] = useState('')

    const handleEdit = (index: number) => {
        const field = fields[index]
        setEditingIndex(index)
        setCurrentField(field)
        setOptionsStr(field.options?.join('\n') || '')
        setIsEditing(true)
    }

    const handleAdd = () => {
        setEditingIndex(null)
        setCurrentField({
            name: `field_${Date.now()}`,
            label: '',
            type: 'text',
            required: false,
            options: [],
            placeholder: '',
            help_text: ''
        })
        setOptionsStr('')
        setIsEditing(true)
    }

    const handleDelete = (index: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        const newFields = [...fields]
        newFields.splice(index, 1)
        onChange(newFields)
    }

    const handleSave = () => {
        if (!currentField.label) {
            alert('질문 제목(라벨)을 입력해주세요.')
            return
        }

        const fieldToSave = {
            ...currentField,
            options: ['select', 'radio', 'checkbox'].includes(currentField.type)
                ? optionsStr.split('\n').map(s => s.trim()).filter(Boolean)
                : undefined
        }

        const newFields = [...fields]
        if (editingIndex !== null) {
            newFields[editingIndex] = fieldToSave
        } else {
            newFields.push(fieldToSave)
        }
        onChange(newFields)
        setIsEditing(false)
    }

    return (
        <div className="space-y-4 border rounded-md p-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">추가 질문 (선택 사항)</label>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                    + 질문 추가
                </button>
            </div>

            {fields.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">설정된 추가 질문이 없습니다.</p>
            ) : (
                <div className="space-y-2">
                    {fields.map((field, idx) => (
                        <div
                            key={idx}
                            className={`border rounded p-3 flex justify-between items-center text-sm ${field.type === 'section'
                                ? 'bg-indigo-50 border-indigo-200 border-l-4'
                                : 'bg-white'
                                }`}
                        >
                            <div className="flex items-center">
                                {field.type === 'section' && <span className="text-indigo-600 font-bold mr-2">[구역]</span>}
                                <span className={`mr-2 ${field.type === 'section' ? 'font-bold text-indigo-900' : 'font-medium'}`}>
                                    {field.label}
                                </span>
                                {field.type !== 'section' && (
                                    <>
                                        <span className="text-gray-500 text-xs bg-gray-100 px-1 rounded mr-2">{field.type}</span>
                                        {field.required && <span className="text-red-500 text-xs">필수</span>}
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:text-blue-800">수정</button>
                                <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:text-red-800">삭제</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 편집 모달 */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">{editingIndex !== null ? '질문 수정' : '새 질문 추가'}</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">질문 제목</label>
                                <input
                                    type="text"
                                    value={currentField.label}
                                    onChange={e => setCurrentField({ ...currentField, label: e.target.value })}
                                    className="w-full border rounded px-2 py-1"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700">답변 타입</label>
                                <select
                                    value={currentField.type}
                                    onChange={e => setCurrentField({ ...currentField, type: e.target.value as FormField['type'] })}
                                    className="w-full border rounded px-2 py-1"
                                >
                                    <option value="text">단답형 (Text)</option>
                                    <option value="textarea">서술형 (Textarea)</option>
                                    <option value="radio">객관식 (단일 선택)</option>
                                    <option value="checkbox">객관식 (다중 선택)</option>
                                    <option value="select">드롭다운 (Select)</option>
                                    <option value="number">숫자</option>
                                    <option value="date">날짜</option>
                                    <option value="file">파일 첨부</option>
                                    <option value="section" className="font-bold text-blue-600">-- 섹션 나누기 --</option>
                                </select>
                            </div>

                            {['radio', 'checkbox', 'select'].includes(currentField.type) && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">선택지 (줄바꿈으로 구분)</label>
                                    <textarea
                                        value={optionsStr}
                                        onChange={e => setOptionsStr(e.target.value)}
                                        className="w-full border rounded px-2 py-1 h-20"
                                        placeholder="예: 참여\n불참\n미정"
                                    />
                                </div>
                            )}

                            {currentField.type !== 'section' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={currentField.required}
                                        onChange={e => setCurrentField({ ...currentField, required: e.target.checked })}
                                        id="field-required"
                                    />
                                    <label htmlFor="field-required" className="text-sm">필수 응답</label>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 border rounded hover:bg-gray-50"
                            >취소</button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
