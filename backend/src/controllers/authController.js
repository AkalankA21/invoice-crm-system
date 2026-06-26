import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';
import { formatUserForApi } from '../utils/formatters.js';

const buildAuthUser = (user) => {
  const formatted = formatUserForApi(user);
  return {
    id: formatted.id,
    _id: formatted._id,
    name: formatted.name,
    email: formatted.email,
    role: formatted.role,
  };
};

const sendAuthResponse = (user, statusCode, res) => {
  res.status(statusCode).json({
    success: true,
    token: generateToken(user.id),
    user: buildAuthUser(user),
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    throw new AppError('Please provide name, email, and password', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const existingUser = await User.unscoped().findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 400);
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim(),
    password,
    role: role === 'user' ? 'user' : 'admin',
  });

  sendAuthResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await User.scope('withPassword').findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated. Contact support.', 403);
  }

  sendAuthResponse(user, 200, res);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { id: req.user.id } });

  if (!user) {
    throw new AppError('User no longer exists.', 401);
  }

  res.status(200).json({
    success: true,
    user: {
      ...buildAuthUser(user),
      createdAt: user.createdAt,
    },
  });
});
