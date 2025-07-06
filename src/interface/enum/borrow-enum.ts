/**
 * Borrow status enumeration
 */
export const BorrowStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  RETURNED: "RETURNED",
} as const;

export type BorrowStatus = (typeof BorrowStatus)[keyof typeof BorrowStatus];
