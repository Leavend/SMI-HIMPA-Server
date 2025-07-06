/**
 * HTTP response codes enumeration
 */
export const ResponseCode = {
  ALREADY_EXIST: 401,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  SUCCESS: 200,
  SERVER_ERROR: 500,
  INVALID_DATA: 422,
  FORBIDDEN: 403,
} as const;
