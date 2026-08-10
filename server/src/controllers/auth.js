import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { signToken } from '../utils/jwt.js'

const sendAuth = (res, user, status = 200) => {
  const token = signToken(user)
  res.status(status).json({ token, user: user.toJSON() })
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists')
  }

  const user = await User.create({ name, email, passwordHash: password })
  sendAuth(res, user, 201)
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password')
  }

  sendAuth(res, user)
})

export const logout = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out' })
})

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  res.json({ user: user.toJSON() })
})