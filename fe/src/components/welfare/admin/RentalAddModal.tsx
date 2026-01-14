import React from 'react'

import type { RentalFormState } from './RentalTypes.ts'

type RentalAddModalProps = {
    open: boolean
    isSubmitting: boolean
    addItem: RentalFormState
    addImagePreview: string
    onClose: () => void
    onChange: (field: keyof RentalFormState, value: string) => void
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
    onSubmit: () => void
}

export function RentalAddModal({
    open,
    isSubmitting,
    addItem,
    addImagePreview,
    onClose,
    onChange,
    onImageUpload,
    onSubmit,
}: RentalAddModalProps) {
    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">새 물품 추가</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">물품 사진</label>
                        <label className="block cursor-pointer">
                            <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                {addImagePreview ? (
                                    <img src={addImagePreview} alt="preview" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-500 font-medium">클릭하여 이미지 업로드</p>
                                        <p className="text-xs text-gray-400">최대 5MB</p>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">물품명 *</label>
                        <input
                            type="text"
                            value={addItem.item_name}
                            onChange={(e) => onChange('item_name', e.target.value)}
                            placeholder="예: 미니빔 프로젝터"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">카테고리</label>
                        <input
                            type="text"
                            value={addItem.category}
                            onChange={(e) => onChange('category', e.target.value)}
                            placeholder="예: 행사용, 음향 등"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">보유 수량(셀 위치) *</label>
                        <input
                            type="text"
                            value={addItem.quantity_cell_range || ''}
                            onChange={(e) => onChange('quantity_cell_range', e.target.value)}
                            placeholder="예: C2, C4, D5 (열+행)"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">신청 시트 URL *</label>
                        <input
                            type="url"
                            value={addItem.application_sheet_url || ''}
                            onChange={(e) => onChange('application_sheet_url', e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            취소
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '추가 중...' : '추가하기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
