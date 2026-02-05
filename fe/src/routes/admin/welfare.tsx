import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { LockerManagementView } from '../../components/welfare/admin/LockerManagementView'
import { PrinterManagementView } from '../../components/welfare/admin/PrinterManagementView'
import { RentalManagementView } from '../../components/welfare/admin/RentalManagementView'
import { GuidebookManagementView } from '../../components/welfare/admin/GuidebookManagementView'
import { welfareApi, type WelfareRental } from '../../lib/api/welfare'

// Admin welfare route

export const Route = createFileRoute('/admin/welfare')({
    component: AdminWelfarePage,
})

function AdminWelfarePage() {
    const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함' | '프린터' | '신입생 가이드북'>('대여사업')
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
        } else if (selectedCategory === '사물함') {
            return {
                title: '사물함 관리',
                description: '사물함 배정 및 신청을 관리합니다.',
            }
        } else if (selectedCategory === '프린터') {
            return {
                title: '프린터 관리',
                description: '프린터 사용 안내 이미지를 관리합니다.',
            }
        } else {
            return {
                title: '신입생 가이드북 관리',
                description: '신입생 가이드북 링크 및 정보를 관리합니다.',
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
                {['대여사업', '사물함', '프린터', '신입생 가이드북'].map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category as any)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedCategory === category
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
                ) : selectedCategory === '사물함' ? (
                    <LockerManagementView />
                ) : selectedCategory === '프린터' ? (
                    <PrinterManagementView />
                ) : (
                    <GuidebookManagementView />
                )}
            </div>
        </div>
    )
}
