/** 与后端 ResultCode 对齐的业务码 */
export const ResultCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  INTERNAL_ERROR: 50000,
  USER_DISABLED: 10002,
};

/** 需要跳转错误页的业务码 → 页面类型 */
export const ERROR_CODE_PAGE_MAP = {
  [ResultCode.FORBIDDEN]: 'forbidden',
  [ResultCode.NOT_FOUND]: 'not-found',
  [ResultCode.USER_DISABLED]: 'disabled',
  [ResultCode.INTERNAL_ERROR]: 'server',
};

/** HTTP 状态码 → 页面类型（401 走登录，不在此表） */
export const HTTP_STATUS_PAGE_MAP = {
  403: 'forbidden',
  404: 'not-found',
  500: 'server',
  502: 'server',
  503: 'server',
};
