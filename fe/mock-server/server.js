const jsonServer = require('json-server')
const path = require('path')
const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// Custom Login Route
server.post('/api/auth/login', (req, res) => {
    const { studentId, password } = req.body
    const db = router.db
    const user = db.get('users').find({ student_id: studentId }).value()

    if (user) {
        if (user.password === password) {
            // Generate a fake token (this would be a real JWT in production)
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

// Authentication Middleware
server.use((req, res, next) => {
    // Public routes that don't require authentication
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/register',
    ]

    // Allow read-only access to some resources without token if needed, 
    // or strictly require token for everything.
    // For this example, let's say POST/PUT/DELETE/PATCH require auth.
    // AND specific GET routes if necessary.

    const isPublic = publicPaths.some(path => req.path.startsWith(path))

    if (isPublic) {
        return next()
    }

    // Check if it's a mutation (unsafe method) - require auth
    // OR if you want to protect everything:
    // const isProtected = true; 

    // For now, let's protect mutations
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Unauthorized: Missing Token" })
        }
    }

    // Continue to JSON Server router
    next()
})

// Custom Register Route
server.post('/api/auth/register', (req, res) => {
    const { name, student_id, email, phone, password } = req.body
    const db = router.db

    // Check if user exists
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

// Rewrites
server.use(jsonServer.rewriter({
    '/api/*': '/$1',
    '/welfare/rentals': '/rentals'
}))

server.use(router)

const PORT = 4000
server.listen(PORT, () => {
    console.log(`JSON Server is running on port ${PORT}`)
})
