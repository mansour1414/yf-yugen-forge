export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
}

export function getPaginationParams(options: PaginationOptions) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginationResult(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
