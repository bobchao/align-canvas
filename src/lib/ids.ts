import { nanoid } from 'nanoid';

export const newId = (prefix = '') => (prefix ? `${prefix}_${nanoid(10)}` : nanoid(10));
