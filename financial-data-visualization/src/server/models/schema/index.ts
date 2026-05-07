import * as financeSchema from "./financial.schema";
// import * as syncSchema from "./sync.schema";
// import * as userSchema from "./user.schema";

export const table = {
    ...financeSchema,
    // ...syncSchema,
    // ...userSchema,
} as const;

export type Table = typeof table;
