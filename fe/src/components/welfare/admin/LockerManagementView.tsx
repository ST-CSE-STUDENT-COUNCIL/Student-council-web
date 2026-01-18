import React from 'react'

import { welfareApi, type LockerInfo } from '../../../lib/api/welfare'
import { useAuthStore } from '../../../store/useAuthStore.ts'

import { LockerLayoutSection } from './LockerLayoutSection'
import { LockerSettingsModal } from './LockerSettingsModal'
import { LockerTimelineSection } from './LockerTimelineSection'
import type { LockerFormState, LockerTimelineStage } from './LockerTypes'

const LOCKER_DATE_FIELDS: Array<keyof LockerFormState> = [
	'application_start',
	'application_end',
	'return_extension_start',
	'return_extension_end',
]

const padTimeUnit = (value: number): string => value.toString().padStart(2, '0')

const formatDateForInput = (isoValue?: string | null): string => {
	if (!isoValue) return ''
	const date = new Date(isoValue)
	if (Number.isNaN(date.getTime())) return ''
	return `${date.getFullYear()}-${padTimeUnit(date.getMonth() + 1)}-${padTimeUnit(date.getDate())}`
}

const getTimezoneOffsetString = (date: Date): string => {
	const offsetMinutes = -date.getTimezoneOffset()
	const sign = offsetMinutes >= 0 ? '+' : '-'
	const absoluteMinutes = Math.abs(offsetMinutes)
	const hours = padTimeUnit(Math.floor(absoluteMinutes / 60))
	const minutes = padTimeUnit(absoluteMinutes % 60)
	return `${sign}${hours}:${minutes}`
}

const formatInputDateForApi = (inputValue?: string): string | null => {
	if (!inputValue) return null

	const parseDate = (value: string): Date | null => {
		if (!value) return null
		if (value.includes('T')) {
			const parsed = new Date(value)
			return Number.isNaN(parsed.getTime()) ? null : parsed
		}
		const [year, month, day] = value.split('-').map((part) => Number(part))
		if (!year || !month || !day) return null
		const parsed = new Date(year, month - 1, day)
		return Number.isNaN(parsed.getTime()) ? null : parsed
	}

	const date = parseDate(inputValue)
	if (!date) return null
	const offset = getTimezoneOffsetString(date)
	return `${date.getFullYear()}-${padTimeUnit(date.getMonth() + 1)}-${padTimeUnit(date.getDate())}T${padTimeUnit(date.getHours())}:${padTimeUnit(date.getMinutes())}:${padTimeUnit(date.getSeconds())}${offset}`
}

const createLockerFormState = (data?: Partial<LockerInfo>): LockerFormState => ({
	application_form_url: data?.application_form_url || '',
	return_extension_form_url: data?.return_extension_form_url || '',
	application_start: formatDateForInput(data?.application_start),
	application_end: formatDateForInput(data?.application_end),
	return_extension_start: formatDateForInput(data?.return_extension_start),
	return_extension_end: formatDateForInput(data?.return_extension_end),
	description: data?.description || '',
})

const buildLockerPeriodPayload = (state: LockerFormState): Record<string, string | null> => {
	return Object.entries(state).reduce<Record<string, string | null>>((acc, [key, value]) => {
		const trimmedValue = value?.trim() ?? ''
		if (LOCKER_DATE_FIELDS.includes(key as keyof LockerFormState)) {
			acc[key] = trimmedValue ? formatInputDateForApi(trimmedValue) : null
		} else {
			acc[key] = trimmedValue
		}
		return acc
	}, {})
}

export function LockerManagementView() {
	const accessToken = useAuthStore((state) => state.accessToken)

	const [layoutImage, setLayoutImage] = React.useState<string | null>(null)
	const [isUploading, setIsUploading] = React.useState(false)
	const [isModalOpen, setIsModalOpen] = React.useState(false)
	const [formData, setFormData] = React.useState<LockerFormState>(createLockerFormState())
	const [isSubmitting, setIsSubmitting] = React.useState(false)
	const [timeline, setTimeline] = React.useState<LockerTimelineStage[]>([
		{ label: '신청기간', value: '', colorClass: 'border-blue-500 bg-blue-50 text-blue-600', buttonLabel: '신청 폼 확인', formUrl: '' },
		{ label: '반납기간', value: '', colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-600', buttonLabel: '반납/연장 폼 확인', formUrl: '' },
		{ label: '연장기간', value: '', colorClass: 'border-amber-500 bg-amber-50 text-amber-600', buttonLabel: '반납/연장 폼 확인', formUrl: '' },
	])

	React.useEffect(() => {
		const loadLockerInfo = async () => {
			try {
				const data = await welfareApi.getLockerInfo()
				if (data) {
					setLayoutImage(data.layout_image_url || null)
					setFormData(createLockerFormState(data))
					setTimeline([
						{
							label: '신청기간',
							value: formatDateRange(data.application_start, data.application_end),
							colorClass: 'border-blue-500 bg-blue-50 text-blue-600',
							buttonLabel: '신청 폼',
							formUrl: data.application_form_url || '',
						},
						{
							label: '반납기간',
							value: formatDateRange(data.return_extension_start, data.return_extension_end),
							colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-600',
							buttonLabel: '반납/연장 폼',
							formUrl: data.return_extension_form_url || '',
						},
						{
							label: '연장기간',
							value: formatDateRange(data.return_extension_start, data.return_extension_end),
							colorClass: 'border-amber-500 bg-amber-50 text-amber-600',
							buttonLabel: '반납/연장 폼',
							formUrl: data.return_extension_form_url || '',
						},
					])
				}
			} catch (error) {
				console.error('사물함 정보 조회 실패:', error)
			}
		}

		loadLockerInfo()
	}, [])

	React.useEffect(() => {
		if (isModalOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isModalOpen])

	const formatDateRange = (start: string | null | undefined, end: string | null | undefined) => {
		if (!start || !end) return '기간 미설정'
		const startDate = new Date(start).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
		const endDate = new Date(end).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
		return `${startDate} ~ ${endDate}`
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		const fieldName = name as keyof LockerFormState
		setFormData((prev) => ({
			...prev,
			[fieldName]: value,
		}))
	}

	const handleSaveSettings = async () => {
		setIsSubmitting(true)
		try {
			const hasInvalidRange = (start?: string, end?: string) => {
				if (!start || !end) return false
				const startDate = new Date(start)
				const endDate = new Date(end)
				if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return false
				return startDate > endDate
			}

			if (hasInvalidRange(formData.application_start, formData.application_end)) {
				alert('신청 시작일은 마감일보다 늦을 수 없습니다.')
				return
			}

			if (hasInvalidRange(formData.return_extension_start, formData.return_extension_end)) {
				alert('반납/연장 시작일은 마감일보다 늦을 수 없습니다.')
				return
			}

			const submitData = buildLockerPeriodPayload(formData)
			const responseData = await welfareApi.updateLockerInfo(submitData, accessToken)
			setTimeline([
				{
					label: '신청기간',
					value: formatDateRange(responseData.application_start, responseData.application_end),
					colorClass: 'border-blue-500 bg-blue-50 text-blue-600',
					buttonLabel: '신청 폼',
					formUrl: responseData.application_form_url || '',
				},
				{
					label: '반납기간',
					value: formatDateRange(responseData.return_extension_start, responseData.return_extension_end),
					colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-600',
					buttonLabel: '반납/연장 폼',
					formUrl: responseData.return_extension_form_url || '',
				},
				{
					label: '연장기간',
					value: formatDateRange(responseData.return_extension_start, responseData.return_extension_end),
					colorClass: 'border-amber-500 bg-amber-50 text-amber-600',
					buttonLabel: '반납/연장 폼',
					formUrl: responseData.return_extension_form_url || '',
				},
			])

			setFormData(createLockerFormState(responseData))

			alert('기간 및 링크가 저장되었습니다.')
			setIsModalOpen(false)
		} catch (error: any) {
			let errorMessage = '저장 실패'
			if (error.response?.status === 403) {
				errorMessage = '권한이 없습니다.'
			} else if (error.response?.data?.detail) {
				errorMessage = error.response.data.detail
			}
			alert(`저장 실패: ${errorMessage}`)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleLayoutUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) {
			return
		}

		setIsUploading(true)
		try {
			const timestamp = Date.now()
			const filename = `locker_layout/${timestamp}_${file.name}`

			const { presigned_url, public_url } = await welfareApi.getLockerImagePresignedUrl(filename, accessToken)
			await welfareApi.uploadImageToS3(presigned_url, file)
			const response = await welfareApi.completeLockerImageUpload(public_url, accessToken)

			setLayoutImage(response?.layout_image_url || public_url)

			alert('사물함 배치도가 업로드되었습니다.')
		} catch (error: any) {
			let errorMessage = '배치도 업로드에 실패했습니다.'

			if (error.response?.status === 403) {
				errorMessage = error.response?.data?.detail || '권한이 없습니다. 관리자 권한이 필요합니다.'
			} else if (error.response?.status === 401) {
				errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
			} else if (error.response?.data?.detail) {
				errorMessage = error.response.data.detail
			}

			alert(`업로드 실패: ${errorMessage}`)
		} finally {
			setIsUploading(false)
		}
	}

	return (
		<div className="space-y-10">
			<LockerTimelineSection
				timeline={timeline}
				specialNote={formData.description}
				onEditClick={() => setIsModalOpen(true)}
			/>

			<LockerLayoutSection layoutImage={layoutImage} isUploading={isUploading} onFileChange={handleLayoutUpload} />

			<LockerSettingsModal
				isOpen={isModalOpen}
				formData={formData}
				onChange={handleInputChange}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSaveSettings}
				isSubmitting={isSubmitting}
			/>
		</div>
	)
}
