import { AppError } from './AppError.js';

export const isValidId = (id) => {
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
};

export const assertValidId = (id, label = 'ID') => {
  if (!isValidId(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return Number(id);
};
