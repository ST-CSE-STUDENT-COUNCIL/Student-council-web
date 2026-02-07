import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, User, Phone, Calendar, MessageCircle, CheckCircle, XCircle, FileText, Image as ImageIcon } from 'lucide-react'
import type { ActivityRegistrationResponse, Activity } from '../../../types/activities'

type RegistrationDetailModalProps = {
    registration: ActivityRegistrationResponse
    activityDetail: Activity | null
    onClose: () => void
    onStatusChange: (registrationId: number, status: 'pending' | 'approved' | 'rejected') => void
    onImagePreview: (url: string) => void
}

export function RegistrationDetailModal({
    registration,
    activityDetail,
    onClose,
    onStatusChange,
    onImagePreview
}: RegistrationDetailModalProps) {
    const isPending = registration.status === 'pending'

    return (
        <Transition appear show={true} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col transform transition-all">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <User size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                                                {['survey', 'demand_survey'].includes(activityDetail?.type || '')
                                                    ? '익명 참여자'
                                                    : (registration.name || '이름 없음')}
                                            </Dialog.Title>
                                            {!['survey', 'demand_survey'].includes(activityDetail?.type || '') && (
                                                <p className="text-sm text-gray-500">{registration.student_id} · {registration.department}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6 custom-scrollbar">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {!['survey', 'demand_survey'].includes(activityDetail?.type || '') && (
                                            <div className="p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                                                    <Phone size={12} />연락처
                                                </div>
                                                <p className="font-medium text-gray-900">{registration.phone || '-'}</p>
                                            </div>
                                        )}
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                                                <Calendar size={12} />신청일시
                                            </div>
                                            <p className="font-medium text-gray-900">{new Date(registration.created_at).toLocaleString()}</p>
                                        </div>
                                        {registration.kakao_id && !['survey', 'demand_survey'].includes(activityDetail?.type || '') && (
                                            <div className="p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                                                    <MessageCircle size={12} />카카오톡 ID
                                                </div>
                                                <p className="font-medium text-gray-900">{registration.kakao_id}</p>
                                            </div>
                                        )}
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="text-gray-500 text-xs font-medium mb-1">상태</div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${registration.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                registration.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    registration.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {registration.status === 'approved' ? '승인됨' :
                                                    registration.status === 'rejected' ? '거절됨' :
                                                        registration.status === 'cancelled' ? '취소됨' : '대기중'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Form Responses */}
                                    {registration.form_responses && Object.keys(registration.form_responses).length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                                추가 정보
                                            </h4>
                                            <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                                {activityDetail?.form_fields && activityDetail.form_fields.length > 0 ? (
                                                    activityDetail.form_fields.map((field) => {
                                                        const value = registration.form_responses[field.name]
                                                        if (value === undefined || value === null || value === '') return null
                                                        return (
                                                            <div key={field.name} className="p-3 bg-white rounded-lg">
                                                                <label className="text-xs font-medium text-purple-600">{field.label}</label>
                                                                <div className="text-sm mt-1 text-gray-900 break-words">
                                                                    {field.type === 'file' ? (
                                                                        <div className="flex flex-col gap-1 mt-1">
                                                                            {(Array.isArray(value) ? value : [value]).map((url: string, idx: number) => {
                                                                                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)
                                                                                return (
                                                                                    <div key={idx} className="flex items-center gap-2">
                                                                                        {isImage ? (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => onImagePreview(url)}
                                                                                                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium hover:underline cursor-pointer"
                                                                                            >
                                                                                                <ImageIcon size={14} />
                                                                                                {Array.isArray(value) ? `이미지 ${idx + 1} 미리보기` : '이미지 미리보기'}
                                                                                            </button>
                                                                                        ) : (
                                                                                            <a
                                                                                                href={url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 font-medium hover:underline"
                                                                                            >
                                                                                                <FileText size={14} />
                                                                                                {Array.isArray(value) ? `파일 ${idx + 1} 다운로드` : '파일 다운로드'}
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        (Array.isArray(value) ? value.join(', ') : String(value))
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    Object.entries(registration.form_responses).map(([key, value]) => {
                                                        if (value === undefined || value === null || value === '') return null
                                                        return (
                                                            <div key={key} className="p-3 bg-white rounded-lg">
                                                                <label className="text-xs font-medium text-purple-600">{key}</label>
                                                                <p className="text-sm mt-1 text-gray-900">
                                                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                                                </p>
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Verification Image */}
                                    {registration.verification_image_url && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                                인증 이미지
                                            </h4>
                                            <img
                                                src={registration.verification_image_url}
                                                alt="인증 이미지"
                                                className="w-full max-w-md rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => onImagePreview(registration.verification_image_url!)}
                                            />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex gap-3 pt-4 border-t border-gray-100 mt-auto">
                                            <button
                                                onClick={() => {
                                                    onStatusChange(registration.id, 'approved')
                                                    onClose()
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-100 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-200 transition-all"
                                            >
                                                <CheckCircle size={18} />
                                                승인하기
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onStatusChange(registration.id, 'rejected')
                                                    onClose()
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-100 text-red-700 font-semibold rounded-xl hover:bg-red-200 transition-all"
                                            >
                                                <XCircle size={18} />
                                                거절하기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
