import React from 'react'


type ProfileInfoHeaderProps = {
  hasPendingProfileUpdate: boolean
  onEditProfile: () => void
}

export function ProfileInfoHeader({ hasPendingProfileUpdate, onEditProfile }: ProfileInfoHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">내 정보</h2>
      <button
        type="button"
        disabled={hasPendingProfileUpdate}
        onClick={onEditProfile}
        className={`px-3 py-2 text-sm font-medium rounded-lg transition ${hasPendingProfileUpdate
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
      >
        {hasPendingProfileUpdate ? '변경 요청 처리 중' : '정보 수정 요청'}
      </button>
    </div>
  )
}
