const jsonServer = require('json-server')
const path = require('path')
const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// 커스텀 로그인 라우트
server.post('/api/auth/login', (req, res) => {
    const { studentId, password } = req.body
    const db = router.db
    const user = db.get('users').find({ student_id: studentId }).value()

    if (user) {
        if (user.password === password) {
            // 가짜 토큰 생성 (실제 프로덕션에서는 진짜 JWT가 됩니다)
            const accessToken = `mock_token_${user.id}_${Date.now()}`
            res.json({
                user,
                accessToken
            })
        } else {
            res.status(401).json({ error: "비밀번호가 일치하지 않습니다." })
        }
    } else {
        res.status(401).json({ error: "존재하지 않는 사용자입니다." })
    }
})

// 인증 미들웨어
server.use((req, res, next) => {
    // 인증이 필요 없는 공개 라우트
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/register',
    ]

    const isPublic = publicPaths.some(path => req.path.startsWith(path))

    if (isPublic) {
        return next()
    }

    // 데이터 변경(안전하지 않은 메서드) 요청인지 확인 - 인증 필요
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Unauthorized: Missing Token" })
        }
    }

    // JSON Server 라우터로 계속 진행
    next()
})

// 커스텀 회원가입 라우트
server.post('/api/auth/register', (req, res) => {
    const { name, student_id, email, phone, password } = req.body
    const db = router.db

    // 사용자 존재 여부 확인
    const existing = db.get('users').find({ student_id }).value()
    if (existing) {
        return res.status(409).json({ error: "User already exists" })
    }
    const users = db.get('users').value()
    const nextId = users.length > 0 ? Math.max(...users.map(u => Number(u.id))) + 1 : 1

    const newUser = {
        id: String(nextId),
        student_id,
        password,
        name,
        email,
        phone,
        department: '컴퓨터공학과',
        role: 'student',
        is_verified: false,
        verification_status: 'pending',
        membership_paid: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    db.get('users').push(newUser).write()
    res.status(201).json(newUser)
})

// URL 재작성 (Rewrites)
server.use(jsonServer.rewriter({
    '/api/*': '/$1',
    '/welfare/rentals': '/rentals'
}))

server.use(router)

const PORT = 4000
server.listen(PORT, () => {
    console.log(`JSON Server is running on port ${PORT}`)
})
