export const LoadingSpinner = ({ message = "데이터를 불러오고 있습니다..." }: { message?: string }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">{message}</p>
        </div>
    )
}

export const LoadingSpinnerSmall = () => {
    return (
        <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    )
}
