/** API 공통 응답 포맷 */
export interface DataResult<T> {
  trId: string;
  code: string;
  message: string;
  data: T;
}
