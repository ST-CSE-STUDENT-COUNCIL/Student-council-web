import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    maxWidth?: string
    footer?: React.ReactNode
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', footer }: ModalProps) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
                            <Dialog.Panel className={`w-full ${maxWidth} transform rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh] overflow-hidden dark:bg-slate-900 dark:text-gray-100`}>
                                {/* Header */}
                                <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 flex-shrink-0 dark:border-slate-800">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                        {title}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none dark:hover:bg-slate-800 dark:hover:text-gray-200"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                                    {children}
                                </div>

                                {/* Footer (Optional) */}
                                {footer && (
                                    <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-800/50">
                                        {footer}
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
