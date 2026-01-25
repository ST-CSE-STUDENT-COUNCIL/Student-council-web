type EventStatsSummaryProps = {
    totalResponses: number
}

export const EventStatsSummary = ({ totalResponses }: EventStatsSummaryProps) => (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl mb-8 flex items-center justify-center">
        <div className="text-center">
            <p className="text-gray-500 mb-1">총 응답자 수</p>
            <p className="text-4xl font-bold text-gray-900">{totalResponses}명</p>
        </div>
    </div>
)
