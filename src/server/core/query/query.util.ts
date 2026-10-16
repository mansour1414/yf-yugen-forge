import { ApiError } from '../errors/api-error';

export interface QueryOptions {
  search?: string;
  searchFields?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  sortableFields: readonly string[];
  excludeSoftDeleted?: boolean;
}

export function buildPrismaQuery(options: QueryOptions) {
  const where: any = options.excludeSoftDeleted === false ? {} : { deletedAt: null };

  // Search
  if (options.search && options.searchFields && options.searchFields.length > 0) {
    where.OR = options.searchFields.map((field) => ({
      [field]: {
        contains: options.search,
        mode: 'insensitive',
      },
    }));
  }

  // Filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    }
  }

  // Sorting
  const sortBy = options.sortBy || 'createdAt';
  if (!options.sortableFields.includes(sortBy)) {
    throw new ApiError(400, `Invalid sort field: ${sortBy}`);
  }
  const sortOrder = options.sortOrder || 'desc';
  const orderBy = { [sortBy]: sortOrder };

  return { where, orderBy };
}
