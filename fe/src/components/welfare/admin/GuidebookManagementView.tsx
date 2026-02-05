import { useState, useEffect } from 'react'
import { welfareApi } from '../../../lib/api/welfare'
import { useAuthStore } from '../../../store/useAuthStore'
import { Save } from 'lucide-react'

export function GuidebookManagementView() {
    const { accessToken: token } = useAuthStore()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Form states
    const [notionUrl, setNotionUrl] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const fetchInfo = async () => {
        try {
            setLoading(true)
            const data = await welfareApi.getGuidebookInfo()
            setNotionUrl(data.notion_url || '')
            setTitle(data.title || '')
            setDescription(data.description || '')
        } catch (err) {
            console.error(err)
            setError('정보를 불러올 수 없습니다.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInfo()
    }, [])

    const handleSave = async () => {
        if (!confirm('신입생 가이드북 정보를 수정하시겠습니까?')) return

        try {
            setSaving(true)
            await welfareApi.updateGuidebookInfo({
                notion_url: notionUrl,
                title: title,
                description: description
            }, token)
            alert('저장되었습니다.')
            fetchInfo() // Refresh
        } catch (err) {
            console.error(err)
            alert('저장 실패: ' + (err as any).response?.data?.detail || '알 수 없는 오류')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div>로딩 중...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">신입생 가이드북 설정</h2>
            <div className="space-y-4 max-w-2xl">
                <div>
                    <label className="block text-sm font-medium mb-1">Notion 페이지 URL</label>
                    <input
                        type="text"
                        value={notionUrl}
                        onChange={e => setNotionUrl(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="https://..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        신입생 가이드북으로 보여줄 Notion 페이지의 URL을 입력하세요.
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">제목 (Title)</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="신입생 가이드북"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        비워둘 경우 Notion 페이지 메타데이터에서 자동으로 가져올 수 있습니다 (백엔드 지원 시).
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">설명 (Description)</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full border rounded p-2 h-24"
                        placeholder="가이드북에 대한 설명..."
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {saving ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">미리보기</h3>
                {notionUrl ? (
                    <div className="w-full h-[600px] border rounded overflow-hidden bg-gray-50">
                        <iframe
                            src={notionUrl}
                            width="100%"
                            height="100%"
                            title="Preview"
                            className="w-full h-full border-0"
                        />
                    </div>
                ) : (
                    <div className="text-gray-400 p-8 text-center border rounded border-dashed">
                        URL을 입력하면 미리보기가 표시됩니다.
                    </div>
                )}
            </div>
        </div>
    )
}
