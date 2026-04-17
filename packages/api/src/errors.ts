export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  BadRequest: (message: string, details?: unknown) =>
    new AppError(400, 'BAD_REQUEST', message, details),
  Unauthorized: (message = 'Требуется авторизация') =>
    new AppError(401, 'UNAUTHORIZED', message),
  Forbidden: (message = 'Недостаточно прав') => new AppError(403, 'FORBIDDEN', message),
  NotFound: (entity = 'Ресурс') => new AppError(404, 'NOT_FOUND', `${entity} не найден`),
  Conflict: (message: string) => new AppError(409, 'CONFLICT', message),
  Validation: (message: string, details?: unknown) =>
    new AppError(422, 'VALIDATION_ERROR', message, details),
  Internal: (message = 'Внутренняя ошибка сервера') =>
    new AppError(500, 'INTERNAL_ERROR', message),
};
