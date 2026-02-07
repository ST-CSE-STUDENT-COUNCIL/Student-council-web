import React from 'react'

type ContactUpdateModalProps = {
  onClose: () => void
  onSubmit?: (payload: { email?: string; phone?: string }) => void
  initialEmail?: string
  initialPhone?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactUpdateModal({
  onClose,
  onSubmit,
  initialEmail = '',
  initialPhone = '',
}: ContactUpdateModalProps) {
  const [email, setEmail] = React.useState(initialEmail)
  const [phone, setPhone] = React.useState(initialPhone)
  const [error, setError] = React.useState<string | null>(null)

  const trimmedEmail = email.trim()
  const trimmedPhone = phone.trim()
  const normalizedInitialPhone = normalizePhone(initialPhone)
  const normalizedPhone = normalizePhone(trimmedPhone)

  const emailChanged = trimmedEmail.length > 0 && trimmedEmail !== initialEmail
  const phoneChanged = normalizedPhone.length > 0 && normalizedPhone !== normalizedInitialPhone

  const isEmailValid = trimmedEmail.length === 0 || EMAIL_REGEX.test(trimmedEmail)
  const isPhoneValid = normalizedPhone.length === 0 || normalizedPhone.length === 10 || normalizedPhone.length === 11
  const canSubmit = (emailChanged || phoneChanged) && isEmailValid && isPhoneValid

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!emailChanged && !phoneChanged) {
      setError('변경할 이메일 또는 전화번호를 입력해주세요.')
      return
    }

    if (!isEmailValid) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }

    if (!isPhoneValid) {
      setError('전화번호는 숫자 10~11자리여야 합니다.')
      return
    }

    setError(null)
    onSubmit?.({
      email: emailChanged ? trimmedEmail : undefined,
      phone: phoneChanged ? trimmedPhone : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">연락처 변경 요청</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            닫기
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          이메일/전화번호 변경은 관리자 확인 후 반영됩니다.
        </p>
        <div className="mb-4 rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
          연락처 변경 요청 UI만 준비되어 있습니다. 실제 전송은 추후 API 연동 후 가능합니다.
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="변경할 이메일을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="변경할 전화번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">숫자만 입력해도 됩니다. (예: 01012345678)</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-md text-sm text-white ${canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'}`}
          >
            요청하기
          </button>
        </div>
      </form>
    </div>
  )
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}
