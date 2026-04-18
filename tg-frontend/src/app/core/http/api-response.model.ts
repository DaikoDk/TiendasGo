export interface ApiResponse<T> {
  timestamp: string;
  message: string;
  data: T;
  error?: string;
  path?: string;
}
