import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { welfareApi, type WelfareRental } from '../../lib/api/welfare'
import { useAuthStore } from '../../store/useAuthStore'

const lockerSummaryCards = [
    {
        title: '배정된 사물함',
        value: '420/480',
        badge: '87.5% 사용 중',
        description: '올 학기 전체 사물함 운영 현황',
    },
    {
        title: '반납 요청',
        value: '18건',
        badge: '이번 주 마감',
        description: '반납 승인 대기 중인 건수',
    },
    {
        title: '연장 신청',
        value: '36건',
        badge: '검토 필요',
        description: '연장 자격 확인 필요 건수',
    },
]

const lockerTimeline = [
    { label: '대여 신청', value: '01.02 ~ 01.09', color: 'border-blue-500 bg-blue-50 text-blue-600' },
    { label: '사용 기간', value: '01.15 ~ 06.21', color: 'border-emerald-500 bg-emerald-50 text-emerald-600' },
    { label: '반납 기간', value: '06.22 ~ 06.28', color: 'border-amber-500 bg-amber-50 text-amber-600' },
]

const lockerRequests = [
    { zone: '어의관 B1', locker: 'B-214', applicant: '김OO', status: '연장 요청', date: '01.10' },
    { zone: '어의관 2F', locker: 'F2-031', applicant: '박OO', status: '반납 요청', date: '01.09' },
    { zone: '창학관 3F', locker: 'C3-118', applicant: '최OO', status: '대기', date: '01.08' },
]

const lockerZones = [
    { title: '어의관', total: 210, available: 12, manager: '총무국' },
    { title: '창학관', total: 150, available: 6, manager: '복지국' },
    { title: '무궁관', total: 120, available: 21, manager: '복지국' },
]

// Admin welfare route

export const Route = createFileRoute('/admin/welfare')({
    component: AdminWelfarePage,
})

function AdminWelfarePage() {
    const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함'>('대여사업')
    const [rentalItems, setRentalItems] = React.useState<WelfareRental[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const fetchRentals = React.useCallback(async () => {
        try {
            setLoading(true)
            const rentals = await welfareApi.getRentals()
            setRentalItems(rentals)
            setError(null)
        } catch (err) {
            setError('데이터를 불러올 수 없습니다.')
            setRentalItems([])
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchRentals()
    }, [])

    // no per-item redirect in admin view; links are edited per item

    const getCategoryInfo = () => {
        if (selectedCategory === '대여사업') {
            return {
                title: '대여사업 관리',
                description: '물품 재고 및 대여 신청을 관리합니다.',
            }
        } else {
            return {
                title: '사물함 관리',
                description: '사물함 배정 및 신청을 관리합니다.',
            }
        }
    }

    const categoryInfo = getCategoryInfo()

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-900 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{categoryInfo.title}</h1>
                    <p className="text-gray-500 mt-1">{categoryInfo.description}</p>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6 flex flex-wrap gap-2">
                {['대여사업', '사물함'].map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category as '대여사업' | '사물함')}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                            selectedCategory === category
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                {selectedCategory === '대여사업' ? (
                    <RentalManagementView
                        items={rentalItems}
                        loading={loading}
                        error={error}
                        onRefresh={fetchRentals}
                    />
                ) : (
                    <LockerManagementView />
                )}
            </div>
        </div>
    )
}

type RentalManagementViewProps = {
    items: WelfareRental[]
    loading: boolean
    error: string | null
    onRefresh: () => Promise<void>
}

function RentalManagementView({ items, loading, error, onRefresh }: RentalManagementViewProps) {
    const accessToken = useAuthStore((state) => state.accessToken)
    
    // 추가 모달 관련 상태
    const [showAddModal, setShowAddModal] = React.useState(false)
    const [addImageFile, setAddImageFile] = React.useState<File | null>(null)
    const [addImagePreview, setAddImagePreview] = React.useState<string>('')
    const [addItem, setAddItem] = React.useState({
        item_name: '',
        category: '',
        application_sheet_url: '',
        quantity_cell_range: '',
    })

    // 수정 모달 관련 상태
    const [showEditModal, setShowEditModal] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<WelfareRental | null>(null)
    const [editImageFile, setEditImageFile] = React.useState<File | null>(null)
    const [editImagePreview, setEditImagePreview] = React.useState<string>('')
    const [editItem, setEditItem] = React.useState({
        item_name: '',
        category: '',
        application_sheet_url: '',
        quantity_cell_range: '',
    })

    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const initialBodyOverflow = React.useRef<string | null>(null)
    // 모달이 열릴 때 배경 스크롤 방지
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

    // 추가 모달 핸들러
    const handleAddItemChange = (field: string, value: any) => {
        setAddItem(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleAddImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAddImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setAddImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // 수정 모달 핸들러
    const handleEditItemChange = (field: string, value: any) => {
        setEditItem(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setEditImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setEditImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAddItem = async () => {
        if (isSubmitting) return
        
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
            
            setShowAddModal(false)
            setAddImageFile(null)
            setAddImagePreview('')
            setAddItem({
                item_name: '',
                category: '',
                application_sheet_url: '',
                quantity_cell_range: '',
            })
            
            alert('새 물품이 추가되었습니다.')
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
        
        // editItem을 설정하기 전에 먼저 초기화
        const newEditItem = {
            item_name: item.item_name,
            category: item.category || '',
            application_sheet_url: item.application_sheet_url,
            quantity_cell_range: item.quantity_cell_range || '',
        }
        setEditItem(newEditItem)
        
        // 모달을 나중에 열어서 상태가 먼저 업데이트되도록 함
        setTimeout(() => {
            setShowEditModal(true)
        }, 0)
    }

    const handleUpdateItem = async () => {
        if (isSubmitting || !editingItem) return
        
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
            const payload = {
                item_name: itemName,
                application_sheet_url: sheetUrl,
                ...(cellRange ? { quantity_cell_range: cellRange } : {}),
                ...(category ? { category } : {}),
            }

            await welfareApi.updateRental(editingItem.id, payload, accessToken)
            
            setShowEditModal(false)
            setEditingItem(null)
            setEditImageFile(null)
            setEditImagePreview('')
            setEditItem({
                item_name: '',
                category: '',
                application_sheet_url: '',
                quantity_cell_range: '',
            })
            
            alert('물품이 수정되었습니다.')
            
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

            {/* 물품 추가 모달 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">새 물품 추가</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* 이미지 업로드 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">물품 사진</label>
                                <label className="block cursor-pointer">
                                    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                        {addImagePreview ? (
                                            <img
                                                src={addImagePreview}
                                                alt="preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-gray-500 font-medium">클릭하여 이미지 업로드</p>
                                                <p className="text-xs text-gray-400">최대 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAddImageUpload}
                                    />
                                </label>
                            </div>

                            {/* 물품명 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">물품명 *</label>
                                <input
                                    type="text"
                                    value={addItem.item_name}
                                    onChange={(e) => handleAddItemChange('item_name', e.target.value)}
                                    placeholder="예: 미니빔 프로젝터"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 카테고리 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">카테고리</label>
                                <input
                                    type="text"
                                    value={addItem.category}
                                    onChange={(e) => handleAddItemChange('category', e.target.value)}
                                    placeholder="예: 행사용, 음향 등"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 보유 수량(셀 위치) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">보유 수량(셀 위치) *</label>
                                <input
                                    type="text"
                                    value={addItem.quantity_cell_range || ''}
                                    onChange={(e) => handleAddItemChange('quantity_cell_range', e.target.value)}
                                    placeholder="예: C2, C4, D5 (열+행)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {/* 신청 시트 URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">신청 시트 URL *</label>
                                <input
                                    type="url"
                                    value={addItem.application_sheet_url || ''}
                                    onChange={(e) => handleAddItemChange('application_sheet_url', e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 버튼 */}
                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? '추가 중...' : '추가하기'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 물품 수정 모달 */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">물품 수정</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setEditingItem(null)
                                    setEditImagePreview('')
                                    setEditItem({
                                        item_name: '',
                                        category: '',
                                        application_sheet_url: '',
                                        quantity_cell_range: '',
                                    })
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* 이미지 업로드 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">물품 사진</label>
                                <label className="block cursor-pointer">
                                    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                        {editImagePreview ? (
                                            <img
                                                src={editImagePreview}
                                                alt="preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-gray-500 font-medium">클릭하여 이미지 업로드</p>
                                                <p className="text-xs text-gray-400">최대 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleEditImageUpload}
                                    />
                                </label>
                            </div>

                            {/* 물품명 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">물품명 *</label>
                                <input
                                    key={`edit-item-name-${editingItem?.id}`}
                                    type="text"
                                    value={editItem.item_name}
                                    onChange={(e) => handleEditItemChange('item_name', e.target.value)}
                                    placeholder="예: 미니빔 프로젝터"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 카테고리 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">카테고리</label>
                                <input
                                    key={`edit-category-${editingItem?.id}`}
                                    type="text"
                                    value={editItem.category}
                                    onChange={(e) => handleEditItemChange('category', e.target.value)}
                                    placeholder="예: 행사용, 음향 등"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 보유 수량(셀 위치) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">보유 수량(셀 위치) *</label>
                                <input
                                    key={`edit-quantity-${editingItem?.id}`}
                                    type="text"
                                    value={editItem.quantity_cell_range || ''}
                                    onChange={(e) => handleEditItemChange('quantity_cell_range', e.target.value)}
                                    placeholder="예: C2, C4, D5 (열+행)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {/* 신청 시트 URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">신청 시트 URL *</label>
                                <input
                                    key={`edit-url-${editingItem?.id}`}
                                    type="url"
                                    value={editItem.application_sheet_url || ''}
                                    onChange={(e) => handleEditItemChange('application_sheet_url', e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 버튼 */}
                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setEditingItem(null)
                                        setEditImagePreview('')
                                        setEditItem({
                                            item_name: '',
                                            category: '',
                                            application_sheet_url: '',
                                            quantity_cell_range: '',
                                        })
                                    }}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleUpdateItem}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? '수정 중...' : '수정하기'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
                    {items.map((item) => {
                        return (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                {/* 이미지 */}
                                <div className="relative mb-3">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.item_name}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <span className="text-sm text-gray-400">이미지 없음</span>
                                        </div>
                                    )}
                                </div>

                                {/* 물품명 */}
                                <h3 className="text-base font-semibold text-gray-900 mb-1">{item.item_name}</h3>

                                {/* 카테고리 */}
                                {item.category && (
                                    <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium mb-3">
                                        {item.category}
                                    </span>
                                )}

                                {/* 재고 정보 */}
                                <div className="py-2 border-t border-b border-gray-100 mb-3">
                                    <p className="text-sm text-gray-600">
                                        현재 재고: <span className="font-semibold text-blue-600">{item.available_quantity ?? '-'}</span>
                                    </p>
                                </div>

                                {/* 신청 시트 링크 */}
                                {item.application_sheet_url && (
                                    <a
                                        href={item.application_sheet_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg mb-3 transition-colors"
                                    >
                                        신청 시트 보기
                                    </a>
                                )}

                                {/* 액션 버튼 */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="flex-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-sm font-semibold transition-colors"
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="flex-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm font-semibold transition-colors"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function LockerManagementView() {
    return (
        <div className="space-y-10">
            <section className="grid gap-6 md:grid-cols-3">
                {lockerSummaryCards.map((card) => (
                    <article key={card.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                        <p className="text-xs font-semibold text-gray-400">{card.title}</p>
                        <div className="mt-3 flex items-end justify-between">
                            <span className="text-3xl font-extrabold text-gray-900">{card.value}</span>
                            <span className="text-xs font-semibold text-emerald-600">{card.badge}</span>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">{card.description}</p>
                    </article>
                ))}
            </section>

            <section className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">운영 타임라인</h2>
                                <p className="text-sm text-gray-500">기간을 업데이트하면 사용자 페이지에 바로 반영됩니다.</p>
                            </div>
                            <button className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800">기간 수정</button>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {lockerTimeline.map((stage) => (
                                <div key={stage.label} className={`rounded-2xl border px-4 py-4 text-center ${stage.color}`}>
                                    <p className="text-xs font-semibold uppercase tracking-wide">{stage.label}</p>
                                    <p className="mt-2 text-lg font-bold">{stage.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">사물함 요청</h2>
                                <p className="text-sm text-gray-500">연장 및 반납 요청을 검토해주세요.</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">필터</button>
                                <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500">일괄 처리</button>
                            </div>
                        </div>
                        <div className="mt-6 divide-y divide-gray-100">
                            {lockerRequests.map((req) => (
                                <div key={`${req.zone}-${req.locker}`} className="flex flex-wrap items-center gap-4 py-4 text-sm">
                                    <div className="min-w-[160px]">
                                        <p className="font-semibold text-gray-900">{req.zone}</p>
                                        <p className="text-xs text-gray-400">{req.locker}</p>
                                    </div>
                                    <span className="text-gray-600">신청자 {req.applicant}</span>
                                    <span className="ml-auto text-xs font-semibold text-gray-400">{req.date}</span>
                                    <button
                                        className={`rounded-full px-4 py-1 text-xs font-semibold ${
                                            req.status === '연장 요청'
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : req.status === '반납 요청'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {req.status}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-6">
                        <h3 className="text-lg font-bold text-gray-900">사물함 존 현황</h3>
                        <p className="mt-2 text-sm text-gray-500">존별 가용 수량을 빠르게 파악하세요.</p>
                        <div className="mt-6 space-y-4">
                            {lockerZones.map((zone) => (
                                <div key={zone.title} className="rounded-xl bg-white/80 p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900">{zone.title}</p>
                                        <span className="text-xs text-gray-400">담당 {zone.manager}</span>
                                    </div>
                                    <div className="mt-3 flex items-end justify-between">
                                        <span className="text-2xl font-bold text-gray-900">{zone.total}EA</span>
                                        <span className="text-xs font-semibold text-emerald-600">여유 {zone.available}개</span>
                                    </div>
                                    <div className="mt-3 h-1.5 rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${(zone.available / zone.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                        <h3 className="text-lg font-bold text-gray-900">운영 메모</h3>
                        <p className="mt-2 text-sm text-gray-500">진행 중인 공지나 작업 메모를 남겨보세요.</p>
                        <div className="mt-4 space-y-3 text-sm text-gray-600">
                            <p>• 01.11 전기점검 일정 안내 필요</p>
                            <p>• 반납 유예 대상자 4명 OTP 확인</p>
                            <p>• 신규 사물함 라벨 교체 01.18 예정</p>
                        </div>
                        <button className="mt-6 w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-white">
                            메모 업데이트
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}
