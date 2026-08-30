export const ADMIN_ROLE = {
  MASTER: 'master',
  ADMIN: 'admin',
};

export const REVIEW_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

export const REVIEW_ACTION = {
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

/** JWT payload marker so student OTP tokens cannot hit admin routes. */
export const ADMIN_TOKEN_KIND = 'admin';
