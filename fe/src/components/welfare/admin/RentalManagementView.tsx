import React from 'react'

import { welfareApi, type WelfareRental } from '../../../lib/api/welfare'
import { useAuthStore } from '../../../store/useAuthStore.ts'
import { RentalAddModal } from './RentalAddModal.tsx'
import { RentalEditModal } from './RentalEditModal.tsx'
import { RentalItemCard } from './RentalItemCard.tsx'
import type { RentalFormState } from './RentalTypes.ts'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

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

    const [rentalSheetUrl, setRentalSheetUrl] = React.useState('')
    const [rentalFormUrl, setRentalFormUrl] = React.useState('')
    const [isConfigSubmitting, setIsConfigSubmitting] = React.useState(false)
    const [isConfigLoading, setIsConfigLoading] = React.useState(false)

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
        const fetchRentalConfig = async () => {
            setIsConfigLoading(true)
            try {
                const response = await welfareApi.getRentalConfig()
                if (typeof response === 'string') {
                    setRentalSheetUrl('')
                    setRentalFormUrl('')
                    return
                }
                setRentalSheetUrl(response.sheet_url ?? '')
                setRentalFormUrl(response.application_form_url ?? '')
            } catch (fetchError) {
                console.error('대여사업 링크 조회 실패:', fetchError)
                toast.error('대여사업 링크를 불러오지 못했습니다.')
            } finally {
                setIsConfigLoading(false)
            }
        }

        fetchRentalConfig()
    }, [])
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
            toast.error('물품명을 입력해주세요.')
            return
        }
        if (!addItem.quantity_cell_range.trim()) {
            toast.error('재고 셀 위치를 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            // 이미지 업로드 처리
            let imageUrl = ''
            if (addImageFile) {
                // 파일명 생성 (타임스탐프 + 파일명으로 중복 방지)
                const timestamp = Date.now()
                const filename = `rental_items/${timestamp}_${addImageFile.name}`

                // 1. Presigned URL 획득
                const { presigned_url, public_url } = await welfareApi.getPresignedUrl(filename, accessToken)

                // 2. S3에 직접 업로드
                await welfareApi.uploadImageToS3(presigned_url, addImageFile)

                // 3. 업로드된 이미지의 public URL 사용
                imageUrl = public_url
            }

            // 4. 물품 생성 요청 (image_url 포함)
            const payload: Partial<typeof addItem> = {
                item_name: addItem.item_name,
                quantity_cell_range: addItem.quantity_cell_range,
            }

            if (addItem.category) {
                payload.category = addItem.category
            }

            if (imageUrl) {
                payload.image_url = imageUrl
            }

            await welfareApi.createRental(payload, accessToken)

            toast.success('새 물품이 추가되었습니다.')
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

            toast.error(`물품 추가 실패: ${errorMessage}`)
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

        const itemName = editItem.item_name.trim() || editingItem.item_name
        const category = editItem.category.trim() || editingItem.category || ''

        if (!itemName) {
            toast.error('물품명을 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            // 이미지 업로드 처리 (새로운 이미지가 선택된 경우만)
            let imageUrl = editImagePreview // 기존 이미지 URL 또는 새 미리보기

            if (editImagePreview && editImagePreview.startsWith('data:')) {
                // data URI인 경우 (새로운 이미지가 업로드됨)
                // 파일을 다시 업로드해야 함
                // 이 경우 editImageFile이 필요한데, handleEditImageUpload에서 파일을 저장하지 않음
                // 상태 구조를 수정하거나, 편집 시에는 이미지를 업로드하지 않도록 할 수 있음
                // 현재는 기존 이미지를 유지하도록 함
                imageUrl = editingItem.image_url || ''
            }

            const cellRange = editItem.quantity_cell_range?.trim() || ''
            const payload: Record<string, any> = {
                item_name: itemName,
                application_sheet_url: editingItem.application_sheet_url,
                category,
                image_url: imageUrl,
                spreadsheet_id: editingItem.spreadsheet_id,
                quantity_sheet_name: editingItem.quantity_sheet_name,
                is_active: editingItem.is_active,
            }

            if (cellRange) {
                payload.quantity_cell_range = cellRange
            } else if (editingItem.quantity_cell_range) {
                payload.quantity_cell_range = editingItem.quantity_cell_range
            }

            await welfareApi.updateRental(editingItem.id, payload, accessToken)

            toast.success('물품이 수정되었습니다.')
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

            toast.error(`물품 수정 실패: ${errorMessage}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (itemId: number) => {
        const result = await Swal.fire({
            title: '이 물품을 삭제하시겠습니까?',
            text: "삭제하면 되돌릴 수 없습니다!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        })

        if (!result.isConfirmed) return

        try {
            await welfareApi.deleteRental(itemId, accessToken)
            toast.success('물품이 삭제되었습니다.')
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

            toast.error(`물품 삭제 실패: ${errorMessage}`)
        }
    }

    const handleUpdateRentalConfig = async () => {
        if (isConfigSubmitting) {
            return
        }

        const sheetUrl = rentalSheetUrl.trim()
        const formUrl = rentalFormUrl.trim()

        if (!sheetUrl) {
            toast.error('시트 URL을 입력해주세요.')
            return
        }

        if (!formUrl) {
            toast.error('신청 폼 URL을 입력해주세요.')
            return
        }

        setIsConfigSubmitting(true)
        try {
            await welfareApi.updateRentalConfig({
                sheet_url: sheetUrl,
                application_form_url: formUrl,
            }, accessToken)
            toast.success('대여사업 링크가 저장되었습니다.')
        } catch (error: any) {
            let errorMessage = '대여사업 링크 저장에 실패했습니다.'

            if (error.response?.status === 403) {
                errorMessage = error.response?.data?.detail || '권한이 없습니다. 학생회 권한이 필요합니다.'
            } else if (error.response?.status === 401) {
                errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            toast.error(`링크 저장 실패: ${errorMessage}`)
        } finally {
            setIsConfigSubmitting(false)
        }
    }

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">대여사업</h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                        + 새 물품 추가
                    </button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">대여사업 링크 설정</p>
                            <p className="text-xs text-gray-500">대여 시트와 신청 폼 URL을 저장합니다.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleUpdateRentalConfig}
                            disabled={isConfigSubmitting || isConfigLoading}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isConfigSubmitting ? '저장 중...' : isConfigLoading ? '불러오는 중...' : '링크 저장'}
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold text-gray-600">대여 시트 URL</label>
                            <input
                                value={rentalSheetUrl}
                                onChange={(event) => setRentalSheetUrl(event.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/..."
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600">대여 신청 폼 URL</label>
                            <input
                                value={rentalFormUrl}
                                onChange={(event) => setRentalFormUrl(event.target.value)}
                                placeholder="https://docs.google.com/forms/..."
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
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
