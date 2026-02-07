import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { privacyOfficerApi } from '../../lib/api/privacyOfficer'
import type { PrivacyOfficerUpdateRequest } from '../../types/privacyOfficer'
import { Shield, Save, Phone, Mail, MapPin, User, FileText, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/privacy-officer')({
  component: PrivacyOfficerManagement,
})

function PrivacyOfficerManagement() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<PrivacyOfficerUpdateRequest>({
    name: '',
    phone: '',
    email: '',
    office_address: '',
    description: ''
  })
  const [hasChanges, setHasChanges] = useState(false)

  // 개인정보 총책임자 정보 조회
  const { data: officerInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['privacyOfficer'],
    queryFn: privacyOfficerApi.get
  })

  // 정보 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: (data: PrivacyOfficerUpdateRequest) => privacyOfficerApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacyOfficer'] })
      queryClient.invalidateQueries({ queryKey: ['privacyOfficerPublic'] })
      setHasChanges(false)
      toast.success('정보가 성공적으로 저장되었습니다.')
    },
    onError: () => {
      toast.error('저장에 실패했습니다. 다시 시도해주세요.')
    }
  })

  // 초기 데이터 로드
  useEffect(() => {
    if (officerInfo) {
      setFormData({
        name: officerInfo.name || '',
        phone: officerInfo.phone || '',
        email: officerInfo.email || '',
        office_address: officerInfo.office_address || '',
        description: officerInfo.description || ''
      })
    }
  }, [officerInfo])

  // 변경 감지
  const handleInputChange = (field: keyof PrivacyOfficerUpdateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // 저장
  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  // 초기화
  const handleReset = () => {
    if (officerInfo) {
      setFormData({
        name: officerInfo.name || '',
        phone: officerInfo.phone || '',
        email: officerInfo.email || '',
        office_address: officerInfo.office_address || '',
        description: officerInfo.description || ''
      })
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-gray-500">정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="text-gray-700">정보를 불러오는데 실패했습니다.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">개인정보 총책임자 관리</h1>
          <p className="text-gray-500 mt-1">학생회장 정보를 관리합니다 (푸터 및 개인정보처리방침에 표시)</p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              초기화
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${hasChanges && !updateMutation.isPending
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {updateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                저장
              </>
            )}
          </button>
        </div>
      </div>

      {/* 폼 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 pb-4 border-b border-gray-100">기본 정보</h2>

        {/* 이름 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <User className="w-4 h-4 text-gray-500" />
            정학생회장 이름
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="예: 홍길동"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* 연락처 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <Phone className="w-4 h-4 text-gray-500" />
            연락처
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="예: 010-1234-5678"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <Mail className="w-4 h-4 text-gray-500" />
            이메일
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="예: president@seoultech.ac.kr"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* 학생회실 주소 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            학생회실 주소
          </label>
          <input
            type="text"
            value={formData.office_address || ''}
            onChange={(e) => handleInputChange('office_address', e.target.value)}
            placeholder="예: 서울특별시 노원구 공릉로 232 미래관 305-4호"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            추가 설명 (선택)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="개인정보 총책임자에 대한 추가 설명이 있다면 입력해주세요."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
          />
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          💡 안내
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 여기서 입력한 정보는 <strong>푸터</strong>와 <strong>개인정보처리방침</strong>에 표시됩니다.</li>
          <li>• 학생회장이 바뀔 때마다 이 정보를 업데이트해주세요.</li>
          <li>• 연락처는 "Tel 정학생회장: XXX-XXXX-XXXX" 형식으로 푸터에 표시됩니다.</li>
        </ul>
      </div>

      {/* 마지막 수정 시간 */}
      {officerInfo?.updated_at && (
        <p className="text-xs text-gray-500 text-right mt-4">
          마지막 수정: {new Date(officerInfo.updated_at).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  )
}
