import React from 'react'

import { Modal } from '../../ui/Modal'
import type { WelfareRental } from '../../../lib/api/welfare'
import type { RentalFormState } from './RentalTypes.ts'

type RentalEditModalProps = {
    open: boolean
    editingItem: WelfareRental | null
    editItem: RentalFormState
    editImagePreview: string
    isSubmitting: boolean
    onClose: () => void
    onChange: (field: keyof RentalFormState, value: string) => void
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
    onSubmit: () => void
}

export function RentalEditModal({
    open,
    editingItem,
    editItem,
    editImagePreview,
    isSubmitting,
    onClose,
    onChange,
    onImageUpload,
    onSubmit,
}: RentalEditModalProps) {
    if (!editingItem) {
        return null
    }

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title="물품 수정"
            maxWidth="max-w-2xl"
            footer={
                <div className="flex gap-3 justify-end">
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
                        {isSubmitting ? '수정 중...' : '수정하기'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">물품 사진</label>
                    <label className="block cursor-pointer">
                        <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                            {editImagePreview ? (
                                <img src={editImagePreview} alt="preview" className="w-full h-full object-cover rounded-lg" />
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
                        key={`edit-item-name-${editingItem.id}`}
                        type="text"
                        value={editItem.item_name}
                        onChange={(e) => onChange('item_name', e.target.value)}
                        placeholder="예: 미니빔 프로젝터"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">카테고리</label>
                    <input
                        key={`edit-category-${editingItem.id}`}
                        type="text"
                        value={editItem.category}
                        onChange={(e) => onChange('category', e.target.value)}
                        placeholder="예: 행사용, 음향 등"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">보유 수량(셀 위치) *</label>
                    <input
                        key={`edit-quantity-${editingItem.id}`}
                        type="text"
                        value={editItem.quantity_cell_range || ''}
                        onChange={(e) => onChange('quantity_cell_range', e.target.value)}
                        placeholder="예: C2, C4, D5 (열+행)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </Modal>
    )
}

