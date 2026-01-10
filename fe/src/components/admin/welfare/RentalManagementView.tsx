import React from 'react'

import { welfareApi, type WelfareRental } from '../../../lib/api/welfare'
import { useAuthStore } from '../../../store/useAuthStore.ts'
import { RentalAddModal } from './RentalAddModal.tsx'
import { RentalEditModal } from './RentalEditModal.tsx'
import { RentalItemCard } from './RentalItemCard.tsx'
import type { RentalFormState } from './RentalTypes.ts'

type RentalManagementViewProps = {
    items: WelfareRental[]
    loading: boolean
    error: string | null
    onRefresh: () => Promise<void>
}

const createEmptyFormState = (): RentalFormState => ({
    item_name: '',
    category: '',
    application_sheet_url: '',
    quantity_cell_range: '',
})

export function RentalManagementView({ items, loading, error, onRefresh }: RentalManagementViewProps) {
    const accessToken = useAuthStore((state) => state.accessToken)

    const [showAddModal, setShowAddModal] = React.useState(false)
    const [addImageFile, setAddImageFile] = React.useState<File | null>(null)
    const [addImagePreview, setAddImagePreview] = React.useState('')
    const [addItem, setAddItem] = React.useState<RentalFormState>(createEmptyFormState())

    const [showEditModal, setShowEditModal] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<WelfareRental | null>(null)
    const [editImagePreview, setEditImagePreview] = React.useState('')
    const [editItem, setEditItem] = React.useState<RentalFormState>(createEmptyFormState())

    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const initialBodyOverflow = React.useRef<string | null>(null)
    React.useEffect(() => {
        if (initialBodyOverflow.current === null) {
            initialBodyOverflow.current = document.body.style.overflow
        }

        if (showAddModal || showEditModal) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = initialBodyOverflow.current || ''
        }

        return () => {
            document.body.style.overflow = initialBodyOverflow.current || ''
        }
    }, [showAddModal, showEditModal])

    const resetAddState = () => {
        setShowAddModal(false)
        setAddImageFile(null)
        setAddImagePreview('')
        setAddItem(createEmptyFormState())
    }

    const resetEditState = () => {
        setShowEditModal(false)
        setEditingItem(null)
        setEditImagePreview('')
        setEditItem(createEmptyFormState())
    }

    const handleAddItemChange = (field: keyof RentalFormState, value: string) => {
        setAddItem((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleAddImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        setAddImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setAddImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleEditItemChange = (field: keyof RentalFormState, value: string) => {
        setEditItem((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setEditImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleAddItem = async () => {
        if (isSubmitting) {
            return
        }

        if (!addItem.item_name.trim()) {
            alert('물품명을 입력해주세요.')
            return
        }
        if (!addItem.application_sheet_url.trim()) {
            alert('신청 시트 URL을 입력해주세요.')
            return
        }
        if (!addItem.quantity_cell_range.trim()) {
            alert('재고 셀 위치를 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('item_name', addItem.item_name)
            formData.append('application_sheet_url', addItem.application_sheet_url)
            formData.append('quantity_cell_range', addItem.quantity_cell_range)

            if (addItem.category) {
                formData.append('category', addItem.category)
            }

            if (addImageFile) {
                formData.append('image', addImageFile)
            }

            await welfareApi.createRental(formData, accessToken)

            alert('새 물품이 추가되었습니다.')
            resetAddState()
            await onRefresh()
        } catch (error: any) {
            let errorMessage = '물품 추가에 실패했습니다.'

            if (error.response?.status === 403) {
                errorMessage = error.response?.data?.detail || '권한이 없습니다. 학생회 권한이 필요합니다.'
            } else if (error.response?.status === 401) {
                errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            alert(`물품 추가 실패: ${errorMessage}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (item: WelfareRental) => {
        setEditingItem(item)
        setEditImagePreview(item.image_url || '')
        setEditItem({
            item_name: item.item_name,
            category: item.category || '',
            application_sheet_url: item.application_sheet_url,
            quantity_cell_range: item.quantity_cell_range || '',
        })

        setTimeout(() => {
            setShowEditModal(true)
        }, 0)
    }

    const handleUpdateItem = async () => {
        if (isSubmitting || !editingItem) {
            return
        }

        const itemName = editItem.item_name.trim()
        const sheetUrl = editItem.application_sheet_url.trim()
        const category = editItem.category.trim()

        if (!itemName) {
            alert('물품명을 입력해주세요.')
            return
        }
        if (!sheetUrl) {
            alert('신청 시트 URL을 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            const cellRange = editItem.quantity_cell_range?.trim() || editingItem.quantity_cell_range || ''
            const payload: Record<string, string> = {
                item_name: itemName,
                application_sheet_url: sheetUrl,
            }

            if (cellRange) {
                payload.quantity_cell_range = cellRange
            }
            if (category) {
                payload.category = category
            }

            await welfareApi.updateRental(editingItem.id, payload, accessToken)

            alert('물품이 수정되었습니다.')
            resetEditState()
            await onRefresh()
        } catch (error: any) {
            let errorMessage = '물품 수정에 실패했습니다.'

            if (error.response?.status === 403) {
                errorMessage = error.response?.data?.detail || '권한이 없습니다. 학생회 권한이 필요합니다.'
            } else if (error.response?.status === 401) {
                errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            alert(`물품 수정 실패: ${errorMessage}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (itemId: number) => {
        if (!confirm('이 물품을 삭제하시겠습니까?')) {
            return
        }

        try {
            await welfareApi.deleteRental(itemId, accessToken)
            alert('물품이 삭제되었습니다.')
            await onRefresh()
        } catch (error: any) {
            let errorMessage = '물품 삭제에 실패했습니다.'

            if (error.response?.status === 403) {
                errorMessage = error.response?.data?.detail || '권한이 없습니다. 학생회 권한이 필요합니다.'
            } else if (error.response?.status === 401) {
                errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            alert(`물품 삭제 실패: ${errorMessage}`)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">대여사업</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                    + 새 물품 추가
                </button>
            </div>

            <RentalAddModal
                open={showAddModal}
                isSubmitting={isSubmitting}
                addItem={addItem}
                addImagePreview={addImagePreview}
                onClose={resetAddState}
                onChange={handleAddItemChange}
                onImageUpload={handleAddImageUpload}
                onSubmit={handleAddItem}
            />

            <RentalEditModal
                open={showEditModal}
                editingItem={editingItem}
                editItem={editItem}
                editImagePreview={editImagePreview}
                isSubmitting={isSubmitting}
                onClose={resetEditState}
                onChange={handleEditItemChange}
                onImageUpload={handleEditImageUpload}
                onSubmit={handleUpdateItem}
            />

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">로딩 중...</p>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-red-500">{error}</p>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">대여 가능한 물품이 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <RentalItemCard
                            key={item.id}
                            item={item}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
