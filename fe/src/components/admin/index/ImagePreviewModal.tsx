import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'

type ImagePreviewModalProps = {
    imageUrl: string | null
    onClose: () => void
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
    return (
        <Transition appear show={!!imageUrl} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative max-h-[90vh] max-w-5xl transform rounded-xl bg-white p-4 shadow-2xl transition-all">
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="학적 인증 원본 이미지"
                                        className="max-h-[75vh] max-w-full rounded-lg object-contain"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        onError={onClose}
                                    />
                                )}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
