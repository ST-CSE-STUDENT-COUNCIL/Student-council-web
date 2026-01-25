import { FileText } from 'lucide-react'

const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i

const getFileName = (value: string) => {
    try {
        const url = new URL(value)
        const lastSegment = url.pathname.split('/').pop()
        return lastSegment || value
    } catch {
        const parts = value.split('/')
        return parts[parts.length - 1] || value
    }
}

type StatAnswerItemProps = {
    answer: string
    count: number
    onPreviewImage: (url: string) => void
}

export const StatAnswerItem = ({ answer, count, onPreviewImage }: StatAnswerItemProps) => {
    const isUrl = /^https?:\/\//i.test(answer)

    return (
        <li className="flex items-center justify-between gap-3">
            {isUrl ? (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                        {IMAGE_EXT_REGEX.test(answer) ? (
                            <img
                                src={answer}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <FileText size={18} className="text-gray-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">{getFileName(answer)}</p>
                        {IMAGE_EXT_REGEX.test(answer) ? (
                            <button
                                type="button"
                                onClick={() => onPreviewImage(answer)}
                                className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                            >
                                크게 보기
                            </button>
                        ) : (
                            <a
                                href={answer}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                            >
                                다운로드
                            </a>
                        )}
                    </div>
                </div>
            ) : (
                <span className="truncate">{answer}</span>
            )}
            <span className="text-purple-600 font-semibold text-xs">{count}회</span>
        </li>
    )
}
