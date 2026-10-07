export default class ApiResponse<T> {
  message?: string;
  status = true;
  statusCode = 200;
  data!: T;

  constructor(options?: Partial<ApiResponse<T>>) {
    if (options) {
      Object.assign(this, options);
    }
  }
}
