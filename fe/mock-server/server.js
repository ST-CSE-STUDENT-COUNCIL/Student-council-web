import jsonServer from 'json-server'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()

// 파일 업로드 설정 (Mock)
const upload = multer({ dest: 'uploads/' })

server.use(middlewares)
server.use(jsonServer.bodyParser)

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

// 토큰에서 사용자 ID 추출 (Mock: "mock_token_{id}_{timestamp}")
const getUserIdFromToken = (req) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null

    const token = authHeader.replace('Bearer ', '')
    if (!token.startsWith('mock_token_')) return null

    const parts = token.split('_')
    if (parts.length < 3) return null

    return parts[2] // id
}

// 사용자 정보 조회
const getUser = (db, id) => {
    return db.get('users').find({ id: String(id) }).value()
}

// ----------------------------------------------------------------------
// Auth Routes
// ----------------------------------------------------------------------

server.post('/auth/send-verification', (req, res) => {
    // 성공 시뮬레이션
    res.json({ email: req.body.email })
})

server.post('/auth/verify-email', (req, res) => {
    // 목 서버: 어떤 코드를 입력해도 무조건 인증 성공!
    // 개발 편의를 위해 실제 검증 로직 없이 통과시킵니다.
    res.json({
        success: true,
        email: req.body.email,
        message: "인증되었습니다."
    })
})

server.post('/auth/check-student-id', (req, res) => {
    const { student_id } = req.body
    const db = router.db
    const exists = db.get('users').find({ student_id }).value()

    if (exists) {
        res.json({ available: false, message: "이미 사용 중인 학번입니다" })
    } else {
        res.json({ available: true, message: "사용 가능한 학번입니다" })
    }
})

server.post('/auth/signup', (req, res) => {
    const { name, student_id, email, phone, password, department } = req.body
    const db = router.db

    const existing = db.get('users').find({ student_id }).value()
    if (existing) {
        return res.status(409).json({ error: "User already exists" })
    }

    const users = db.get('users').value()
    // 숫자 ID 생성 (기존 데이터가 문자열일수도 있으니 유의)
    const maxId = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0)
    const nextId = String(maxId + 1)

    const newUser = {
        id: nextId,
        student_id,
        password, // 실제로는 해싱해야 함
        name,
        email,
        phone,
        department: department || '컴퓨터공학과',
        role: 'student',
        verification_status: 'pending',
        membership_paid: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    db.get('users').push(newUser).write()

    res.status(201).json({
        user_id: newUser.id,
        email: newUser.email,
        name: newUser.name
    })
})

server.post('/auth/login', (req, res) => {
    const { student_id, password } = req.body
    const db = router.db
    const user = db.get('users').find({ student_id: student_id }).value()

    if (user) {
        if (user.password === password) {
            // 거절된 사용자 체크
            if (user.verification_status === 'rejected') {
                return res.status(403).json({
                    detail: `가입이 거절되었습니다. 사유: ${user.rejection_reason || '사유 없음'}`
                })
            }

            const access_token = `mock_token_${user.id}_${Date.now()}`
            res.json({
                user,
                access_token
            })
        } else {
            res.status(401).json({ detail: "학번 또는 비밀번호가 올바르지 않습니다" })
        }
    } else {
        res.status(401).json({ detail: "등록되지 않은 학번입니다" })
    }
})

server.post('/auth/logout', (req, res) => {
    res.json({ message: "Logged out successfully" })
})

server.post('/auth/reset-password', (req, res) => {
    const { email, new_password } = req.body
    const db = router.db
    const user = db.get('users').find({ email }).value()

    if (!user) {
        return res.status(404).json({ detail: "가입되지 않은 이메일입니다." })
    }

    db.get('users')
        .find({ email })
        .assign({ password: new_password })
        .write()

    res.json({ message: "비밀번호가 성공적으로 변경되었습니다." })
})

// ----------------------------------------------------------------------
// MyPage Routes
// ----------------------------------------------------------------------

server.get('/mypage', (req, res) => {
    const userId = getUserIdFromToken(req)
    if (!userId) return res.status(401).json({ detail: "Unauthorized" })

    const db = router.db
    const user = getUser(db, userId)

    if (user) {
        res.json(user)
    } else {
        res.status(404).json({ detail: "User not found" })
    }
})

server.post('/mypage/password', (req, res) => {
    const userId = getUserIdFromToken(req)
    if (!userId) return res.status(401).json({ detail: "Unauthorized" })

    const { current_password, new_password } = req.body
    const db = router.db
    const user = getUser(db, userId)

    if (!user) return res.status(404).json({ detail: "User not found" })

    if (user.password !== current_password) {
        return res.status(400).json({ detail: "현재 비밀번호가 올바르지 않습니다" })
    }

    db.get('users')
        .find({ id: userId })
        .assign({ password: new_password })
        .write()

    res.json({ message: "Password updated" })
})

server.post('/mypage/verification-image', upload.single('file'), (req, res) => {
    const userId = getUserIdFromToken(req)
    if (!userId) return res.status(401).json({ detail: "Unauthorized" })

    // Mock image upload
    const file_path = `https://via.placeholder.com/600x400?text=Verification+Image`

    const db = router.db
    db.get('users')
        .find({ id: userId })
        .assign({ verification_image_url: file_path })
        .write()

    res.json({ file_path })
})

// ----------------------------------------------------------------------
// Notices Routes (Custom Implementation for Filtering)
// ----------------------------------------------------------------------

// Notice helper to populate data
const populateNotice = (db, post) => {
    const board = db.get('boards').find({ id: Number(post.board_id) }).value() || { id: post.board_id }
    const author = db.get('users').find({ id: String(post.author_id) }).value() || { id: post.author_id, name: '알 수 없음' }
    return {
        ...post,
        board,
        author: { id: author.id, name: author.name }
    }
}

server.get('/notices', (req, res) => {
    const { mainCategory, subCategory, search, sort, page = 1, page_size = 20 } = req.query
    const db = router.db
    let posts = db.get('posts').filter({ is_deleted: false }).value()

    // 1. mainCategory 필터
    if (mainCategory) {
        const categoryMap = { "student_council": "학생회", "democracy": "민주자치" }
        const targetCat = categoryMap[mainCategory]
        if (targetCat) {
            const boards = db.get('boards').filter({ category: targetCat }).value()
            const boardIds = boards.map(b => b.id)
            posts = posts.filter(p => boardIds.includes(p.board_id))
        }
    }

    // 2. subCategory 필터
    if (subCategory && subCategory !== 'all') {
        const subCatMap = {
            "event": "행사",
            "welfare": "복지",
            "announcement": "공고",
            "notice": "고시",
            "meeting": "대표자회의",
            "rules": "학생회칙"
        }
        const targetSub = subCatMap[subCategory]
        if (targetSub) {
            posts = posts.filter(p => p.subcategory === targetSub)
        }
    }

    // 3. Search
    if (search) {
        const q = search.toLowerCase()
        posts = posts.filter(p =>
            p.title?.toLowerCase().includes(q) ||
            p.content?.toLowerCase().includes(q)
        )
    }

    // 4. Sort
    posts.sort((a, b) => {
        // Pinned first
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1

        // Date sort
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sort === 'oldest' ? dateA - dateB : dateB - dateA
    })

    // 5. Pagination
    const total = posts.length
    const total_pages = Math.ceil(total / page_size)
    const start = (page - 1) * page_size
    const end = start + Number(page_size)
    const slicedPosts = posts.slice(start, end)

    // 6. Populate
    const notices = slicedPosts.map(p => populateNotice(db, p))

    res.json({
        notices,
        pagination: {
            total,
            page: Number(page),
            page_size: Number(page_size),
            total_pages,
            has_next: Number(page) < total_pages,
            has_prev: Number(page) > 1
        }
    })
})

// 복지 대여 신청 커스텀 라우트: 요청을 저장하고 재고를 차감합니다.
server.post('/welfare_rental_requests', (req, res) => {
    const db = router.db
    const {
        rental_id,
        user_id,
        status = 'pending',
        rental_start_date,
        rental_end_date,
        actual_return_date = null,
        notes = null,
    } = req.body

    if (!rental_id || !user_id || !rental_start_date || !rental_end_date) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다.' })
    }

    const requests = db.get('welfare_rental_requests').value()
    const nextId = requests.length > 0 ? Math.max(...requests.map((r) => Number(r.id))) + 1 : 1
    const now = new Date().toISOString()

    const newRequest = {
        id: nextId,
        rental_id,
        user_id,
        status,
        rental_start_date,
        rental_end_date,
        actual_return_date,
        notes,
        approved_by: null,
        approved_at: null,
        created_at: req.body.created_at || now,
        updated_at: req.body.updated_at || now,
    }

    db.get('welfare_rental_requests').push(newRequest).write()

    const rental = db.get('welfare_rentals').find({ id: Number(rental_id) }).value()
    if (rental) {
        const qty = Number(req.body.quantity) || 1
        const newAvailable = Math.max(0, (rental.available_quantity || 0) - qty)
        db.get('welfare_rentals')
            .find({ id: Number(rental_id) })
            .assign({ available_quantity: newAvailable })
            .write()
    }

    return res.status(201).json(newRequest)
})

// 커스텀 회원가입 라우트
server.post('/api/auth/register', (req, res) => {
    const { name, student_id, email, phone, password } = req.body
    const db = router.db
    const post = db.get('posts').find({ id: Number(id) }).value()

    if (!post || post.is_deleted) {
        return res.status(404).json({ detail: "공지사항을 찾을 수 없습니다" })
    }

    const notice = populateNotice(db, post)
    // attachments mock


    res.json(notice)
})

server.post('/notices/:id/views', (req, res) => {
    const { id } = req.params
    const db = router.db
    const post = db.get('posts').find({ id: Number(id) }).value()

    if (post) {
        const newViews = (post.view_count || 0) + 1
        db.get('posts').find({ id: Number(id) }).assign({ view_count: newViews }).write()
        res.json({ ...post, view_count: newViews })
    } else {
        res.status(404).json({ detail: "Notice not found" })
    }
})

// Notice Create/Update/Delete (Simplified: assuming admin)
server.post('/notices', upload.array('attachments'), (req, res) => {
    const db = router.db
    const { title, content, board_id, subcategory, is_pinned } = req.body

    const posts = db.get('posts').value()
    const nextId = posts.length > 0 ? Math.max(...posts.map(p => Number(p.id))) + 1 : 1

    const newPost = {
        id: nextId,
        board_id: Number(board_id),
        author_id: "1", // Mock Admin ID
        title,
        content,
        subcategory,
        is_pinned: is_pinned === 'true',
        view_count: 0,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    db.get('posts').push(newPost).write()
    res.status(201).json(populateNotice(db, newPost))
})

server.delete('/notices/:id', (req, res) => {
    const { id } = req.params
    const db = router.db
    db.get('posts').find({ id: Number(id) })
        .assign({ is_deleted: true, deleted_at: new Date().toISOString() })
        .write()
    res.status(204).send()
})

// ----------------------------------------------------------------------
// Suggestions Routes
// ----------------------------------------------------------------------

server.get('/suggestions', (req, res) => {
    const { status_filter, page = 1, page_size = 20 } = req.query
    const userId = getUserIdFromToken(req)
    const db = router.db
    const user = userId ? getUser(db, userId) : null

    let items = db.get('suggestions').value() || []

    // Sort
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 1. 권한 필터 (단순화: admin/council 아니면 본인 것만)
    const isAdmin = user && (user.role === 'admin' || user.role === 'council')
    if (!isAdmin && userId) {
        // JSON Server 특성상 모든 데이터를 메모리에서 필터링
        // 실제로는 아니지만 Mock에서는 전제 데이터를 가져와서 필터링
    }

    // Mock: 만약 로그인 안했으면 빈 배열 (혹은 익명 게시판 정책에 따라 다름, 여기선 Backend 로직 따라감)
    // Backend Logic: Admin/Council view all, User views own.
    // 하지만 "익명 건의사항"으로 제목만 가리고 보여주는 로직도 있음.
    // 여기서는 간단히 구현

    if (status_filter) {
        items = items.filter(i => i.status === status_filter)
    }

    // Pagination
    const total = items.length
    const total_pages = Math.ceil(total / page_size)
    const start = (page - 1) * page_size
    const end = start + Number(page_size)
    const slicedItems = items.slice(start, end)

    // 매핑
    const suggestions = slicedItems.map(item => {
        const isAuthor = userId && String(item.author_id) === String(userId)
        const canViewDetail = isAdmin || isAuthor

        return {
            id: item.id,
            author_id: canViewDetail ? item.author_id : null,
            author_name: canViewDetail ? (item.author_name || "익명") : "익명",
            title: canViewDetail ? item.title : "익명 건의사항",
            status: item.status,
            rejection_reason: canViewDetail ? item.rejection_reason : null,
            resolution_note: canViewDetail ? item.resolution_note : null,
            created_at: item.created_at
        }
    })

    res.json({
        suggestions,
        pagination: {
            page: Number(page),
            limit: Number(page_size),
            total,
            total_pages
        }
    })
})

server.post('/suggestions', (req, res) => {
    const userId = getUserIdFromToken(req)
    if (!userId) return res.status(401).json({ detail: "Unauthorized" })

    const { title, content } = req.body
    const db = router.db
    const suggestions = db.get('suggestions').value() || []
    const nextId = suggestions.length > 0 ? Math.max(...suggestions.map(s => Number(s.id))) + 1 : 1

    const newSuggestion = {
        id: nextId,
        author_id: userId,
        title,
        content,
        status: 'received',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    db.get('suggestions').push(newSuggestion).write()

    res.status(201).json({
        ...newSuggestion,
        author_name: "나" // Mock return
    })
})

// ----------------------------------------------------------------------
// Admin Routes
// ----------------------------------------------------------------------

server.get('/admin/users/pending', (req, res) => {
    const db = router.db
    const users = db.get('users')
        .filter({ verification_status: 'pending' })
        .value()

    res.json({
        users,
        total: users.length
    })
})

server.get('/admin/users', (req, res) => {
    const db = router.db
    let users = db.get('users').value()
    const { role, verification_status, membership_paid } = req.query

    if (role) users = users.filter(u => u.role === role)
    if (verification_status) users = users.filter(u => u.verification_status === verification_status)
    if (membership_paid !== undefined) {
        users = users.filter(u => String(u.membership_paid) === membership_paid)
    }

    res.json({
        users,
        total: users.length
    })
})

server.post('/admin/users/:id/approve', (req, res) => {
    const { id } = req.params
    const db = router.db

    db.get('users').find({ id: String(id) })
        .assign({
            verification_status: 'approved',
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .write()

    res.json({ user_id: id })
})

server.post('/admin/users/:id/reject', (req, res) => {
    const { id } = req.params
    const { reason } = req.body
    const db = router.db

    db.get('users').find({ id: String(id) })
        .assign({
            verification_status: 'rejected',
            rejection_reason: reason,
            updated_at: new Date().toISOString()
        })
        .write()

    res.json({ user_id: id })
})

server.patch('/admin/users/:id/role', (req, res) => {
    const { id } = req.params
    const { role } = req.body
    const db = router.db

    db.get('users').find({ id: String(id) })
        .assign({ role, updated_at: new Date().toISOString() })
        .write()

    res.json({ user_id: id, new_role: role })
})

server.patch('/admin/users/:id/membership', (req, res) => {
    const { id } = req.params
    const { paid } = req.body // Expecting true/false
    const db = router.db

    db.get('users').find({ id: String(id) })
        .assign({ membership_paid: paid, updated_at: new Date().toISOString() })
        .write()

    res.json({ user_id: id, paid })
})


// Default router for other resources (if any)
server.use(router)

const PORT = 4000
server.listen(PORT, () => {
    console.log(`JSON Server is running on port ${PORT}`)
})
