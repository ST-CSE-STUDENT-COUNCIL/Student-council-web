type EmailStep = 'idle' | 'sent' | 'verified'

type ContactSectionProps = {
  isEditing: boolean
  currentEmail: string
  currentPhone: string
  formattedPhone: string
  contactEmail: string
  contactPhone: string
  contactPassword: string
  contactError: string | null
  emailStep: EmailStep
  emailCode: string
  emailTimer: {
    isExpired: boolean
    formatTime: () => string
  }
  isEmailSending: boolean
  isEmailVerifying: boolean
  isPhoneSaving: boolean
  canSendEmailVerification: boolean
  phoneChanged: boolean
  onToggleEdit: () => void
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSendEmailVerification: () => void
  onVerifyEmailCode: () => void
  onEmailCodeChange: (value: string) => void
  onCancel: () => void
  onSavePhone: () => void
}

export function ContactSection({
  isEditing,
  currentEmail,
  currentPhone,
  formattedPhone,
  contactEmail,
  contactPhone,
  contactPassword,
  contactError,
  emailStep,
  emailCode,
  emailTimer,
  isEmailSending,
  isEmailVerifying,
  isPhoneSaving,
  canSendEmailVerification,
  phoneChanged,
  onToggleEdit,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onSendEmailVerification,
  onVerifyEmailCode,
  onEmailCodeChange,
  onCancel,
  onSavePhone,
}: ContactSectionProps) {
  return (
    <div className="mt-6 rounded-xl border border-gray-100 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">연락처</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            이메일은 인증 후 변경됩니다. 전화번호는 비밀번호 확인 후 즉시 변경됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleEdit}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isEditing
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isEditing ? '닫기' : '수정'}
        </button>
      </div>

      {!isEditing && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-900 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">이메일</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">
              {currentEmail}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 dark:border-slate-700 bg-white/80 dark:bg-slate-900 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">전화번호</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formattedPhone || currentPhone}
            </p>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">새 이메일</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="새 이메일을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSendEmailVerification}
                disabled={!canSendEmailVerification}
                className={`px-3 py-2 rounded-md text-sm font-medium ${canSendEmailVerification
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-slate-700 dark:text-gray-400'
                  }`}
              >
                {isEmailSending ? '발송 중...' : '인증번호 발송'}
              </button>
              {emailStep === 'sent' && (
                <button
                  type="button"
                  onClick={onSendEmailVerification}
                  disabled={!emailTimer.isExpired || isEmailSending}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${emailTimer.isExpired && !isEmailSending
                    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200'
                    : 'border border-gray-200 text-gray-400 cursor-not-allowed dark:border-slate-700 dark:text-gray-500'
                    }`}
                >
                  재발송 {emailTimer.isExpired ? '' : `(${emailTimer.formatTime()})`}
                </button>
              )}
            </div>
          </div>

          {emailStep === 'sent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">인증번호</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={emailCode}
                  onChange={(event) => onEmailCodeChange(event.target.value)}
                  placeholder="6자리 인증번호"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={onVerifyEmailCode}
                  disabled={isEmailVerifying}
                  className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap min-w-[104px] ${isEmailVerifying
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-slate-700 dark:text-gray-400'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                >
                  {isEmailVerifying ? '확인 중...' : '인증 확인'}
                </button>
              </div>
              {!emailTimer.isExpired && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  유효시간 {emailTimer.formatTime()}
                </p>
              )}
            </div>
          )}

          {emailStep === 'verified' && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              이메일 인증이 완료되었습니다.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">전화번호</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="변경할 전화번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">숫자만 입력해도 됩니다. (예: 01012345678)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">비밀번호 확인</label>
            <input
              type="password"
              value={contactPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {contactError && (
            <p className="text-sm text-red-600 dark:text-red-400">{contactError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSavePhone}
              disabled={isPhoneSaving || !phoneChanged}
              className={`px-4 py-2 rounded-md text-sm text-white ${isPhoneSaving || !phoneChanged
                ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {isPhoneSaving ? '저장 중...' : '전화번호 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
