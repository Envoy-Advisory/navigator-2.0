import { Request } from 'express';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  headers: any;
  file?: Express.Multer.File;
}
