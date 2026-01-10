import type { WelfareRental } from '../../../lib/api/welfare'

type RentalItemCardProps = {
    item: WelfareRental
    onEdit: () => void
    onDelete: () => void
}

export function RentalItemCard({ item, onEdit, onDelete }: RentalItemCardProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="relative mb-3">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.item_name} className="w-full h-32 object-cover rounded-lg" />
                ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-400">이미지 없음</span>
                    </div>
                )}
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-1">{item.item_name}</h3>

            {item.category && (
                <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium mb-3">
                    {item.category}
                </span>
            )}

            <div className="py-2 border-t border-b border-gray-100 mb-3">
                <p className="text-sm text-gray-600">
                    현재 재고: <span className="font-semibold text-blue-600">{item.available_quantity ?? '-'}</span>
                </p>
            </div>

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

            <div className="flex gap-2">
                <button
                    onClick={onEdit}
                    className="flex-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-sm font-semibold transition-colors"
                >
                    수정
                </button>
                <button
                    onClick={onDelete}
                    className="flex-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm font-semibold transition-colors"
                >
                    삭제
                </button>
            </div>
        </div>
    )
}
