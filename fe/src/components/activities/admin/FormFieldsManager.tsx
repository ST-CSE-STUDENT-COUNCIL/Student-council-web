import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Layout } from 'lucide-react'
import type { FormField } from '../../../types/activities'
import { SideButton } from './form-parts/SideButton'
import { FieldEditor } from './form-parts/FieldEditor'
import { FieldPreview } from './form-parts/FieldPreview'

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
            <div className="sticky top-10 z-50 self-start h-fit flex flex-col gap-3 bg-white p-2 rounded-xl shadow-md border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                <SideButton icon={<Plus size={20} />} label="질문 추가" onClick={() => addField('text')} />
                <SideButton icon={<Layout size={20} />} label="섹션 추가" onClick={() => addField('section')} />
            </div>
        </div>
    )
}
