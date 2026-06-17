import { Op } from 'sequelize';
import { Customer, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatCustomerForApi } from '../utils/formatters.js';
import { assertValidId } from '../utils/validators.js';

const createdByInclude = {
  model: User,
  as: 'createdBy',
  attributes: ['id', 'name', 'email'],
};

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildCustomerWhere = (search, includeInactive) => {
  const where = {};

  if (!includeInactive) {
    where.isActive = true;
  }

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { phone: { [Op.like]: term } },
      { company: { [Op.like]: term } },
    ];
  }

  return where;
};

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, address, company, notes } = req.body;

  if (!name?.trim() || !phone?.trim()) {
    throw new AppError('Customer name and phone are required', 400);
  }

  const customer = await Customer.create({
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim() || null,
    address: address || {},
    company: company?.trim() || null,
    notes: notes?.trim() || null,
    createdById: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: formatCustomerForApi(customer),
  });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const { search, includeInactive } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  const where = buildCustomerWhere(search, includeInactive === 'true');

  const total = await Customer.count({ where });

  const customers = await Customer.findAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit,
    include: [createdByInclude],
  });

  res.status(200).json({
    success: true,
    count: customers.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: customers.map(formatCustomerForApi),
  });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const id = assertValidId(req.params.id, 'customer ID');

  const customer = await Customer.findOne({
    where: { id },
    include: [createdByInclude],
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.status(200).json({
    success: true,
    data: formatCustomerForApi(customer),
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const id = assertValidId(req.params.id, 'customer ID');

  const allowedFields = ['name', 'phone', 'email', 'address', 'company', 'notes', 'isActive'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const [updatedCount] = await Customer.update(updates, { where: { id } });

  if (!updatedCount) {
    throw new AppError('Customer not found', 404);
  }

  const customer = await Customer.findOne({
    where: { id },
    include: [createdByInclude],
  });

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: formatCustomerForApi(customer),
  });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const id = assertValidId(req.params.id, 'customer ID');

  const customer = await Customer.findOne({ where: { id } });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  await customer.update({ isActive: false });

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully',
  });
});
