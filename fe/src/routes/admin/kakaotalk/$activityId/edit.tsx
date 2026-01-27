import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { activityApi } from '../../../../lib/api/activities'
import type { Activity } from '../../../../types/activities'
import { KakaoTalkForm } from '../../../../components/activities/admin/KakaoTalkForm'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/admin/kakaotalk/$activityId/edit')({
    component: EditKakaoTalkPage,
})

function EditKakaoTalkPage() {
    const navigate = useNavigate()
    const { activityId } = Route.useParams()
    const [activity, setActivity] = useState<Activity | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                setLoading(true)
                const data = await activityApi.getById(Number(activityId))
                setActivity(data)
            } catch (err) {
                console.error('Failed to fetch activity', err)
                setError('데이터를 불러오는데 실패했습니다.')
            } finally {
                setLoading(false)
            }
        }
        fetchActivity()
    }, [activityId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-yellow-600 mx-auto mb-4" />
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            </div>
        )
    }

    if (error || !activity) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 font-medium">{error || '데이터를 찾을 수 없습니다.'}</p>
                    <button
                        onClick={() => navigate({ to: '/admin/kakaotalk' })}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            </div>
        )
    }

    return (
        <KakaoTalkForm
            editingActivity={activity}
            onSuccess={() => navigate({ to: '/admin/kakaotalk' })}
            onCancel={() => navigate({ to: '/admin/kakaotalk' })}
        />
    )
}
