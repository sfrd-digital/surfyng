// Middleware global de tratamento de erros
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error('[Erro]', err.message, err.stack);

  // Erro de validação Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos',
      detalhes: err.errors.map((e) => ({
        campo: e.path.join('.'),
        mensagem: e.message,
      })),
    });
    return;
  }

  // Erro com status HTTP customizado
  const status = err.statusCode ?? 500;
  const message =
    status === 500 ? 'Erro interno do servidor' : err.message;

  res.status(status).json({ error: message });
}

// Cria um erro com status HTTP customizado
export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  return err;
}
