import * as yup from "yup";

const loanApplication = yup.object({
  accountId: yup.string().trim().required(),
  amount: yup.number().required(),
});

const approveOrDeclineLoanSchema = yup.object({
  loanId: yup.string().trim().required(),
  status: yup
    .string()
    .required()
    .oneOf(Object.values(["ACTIVE", "DECLINED"])),
});

const ValidationSchema = {
  loanApplication,
  approveOrDeclineLoanSchema,
};

export default ValidationSchema;
