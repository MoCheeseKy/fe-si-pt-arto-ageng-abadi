// src/types/index.ts

export interface GenericResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
}
