import { ExternalLink } from 'lucide-react'

type AttendanceQrCardProps = {
    qrDataUrl: string | null
    qrError: string | null
    qrUrl: string
}

export function AttendanceQrCard({ qrDataUrl, qrError, qrUrl }: AttendanceQrCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-900">출석 체크 QR</p>
                    <p className="text-xs text-gray-500">학생이 QR을 스캔하면 출석 페이지로 이동합니다.</p>
                </div>
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
                {qrDataUrl ? (
                    <img
                        src={qrDataUrl}
                        alt="출석 체크 QR"
                        className="w-44 h-44 border border-gray-100 rounded-xl"
                    />
                ) : (
                    <div className="w-44 h-44 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">
                        {qrError ?? 'QR 생성 대기'}
                    </div>
                )}
                {qrDataUrl && (
                    <a
                        href={qrDataUrl}
                        download="attendance-qr.png"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                    >
                        QR 다운로드
                    </a>
                )}
                <div className="w-full rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 break-all text-center group relative">
                    <a
                        href={qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 hover:text-emerald-600 transition-colors"
                    >
                        {qrUrl || '행사를 선택해주세요'}
                        {qrUrl && <ExternalLink size={12} />}
                    </a>
                </div>
            </div>
        </div>
    )
}
