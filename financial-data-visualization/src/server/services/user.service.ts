// import { Elysia } from "elysia";
// import { eq } from "drizzle-orm";
// import { dbPlugin } from "../config/db.config";
// import { models } from "../models/validator";
// import type { InsertUser } from "../models/entity";
// import { table } from "../models/schema";

// export const UserService = new Elysia({ name: "user.service" })
//     .use(dbPlugin)
//     .use(models.UserModel)
//     .derive(({ db }) => ({
//         UserRepo: {
//             async createUser(data: InsertUser) {
//                 return await db().insert(table.users).values(data).returning();
//             },

//             async updateUser(id: number, data: Partial<InsertUser>) {
//                 return await db()
//                     .update(table.users)
//                     .set(data)
//                     .where(eq(table.users.id, id))
//                     .returning();
//             },

//             async deleteUser(id: number) {
//                 return await db()
//                     .delete(table.users)
//                     .where(eq(table.users.id, id));
//             },

//             async getUserById(id: number) {
//                 return await db()
//                     .select()
//                     .from(table.users)
//                     .where(eq(table.users.id, id));
//             },
//         },
//     }))
//     .derive(({ UserRepo }) => ({
//         UserService: {
//             async addUser(data: InsertUser) {
//                 return await UserRepo.createUser(data);
//             },

//             async updateUser(id: number, data: Partial<InsertUser>) {
//                 return await UserRepo.updateUser(id, data);
//             },

//             async deleteUser(id: number) {
//                 return await UserRepo.deleteUser(id);
//             },

//             async getUserById(id: number) {
//                 return await UserRepo.getUserById(id);
//             },
//         },
//     }))
//     .as("plugin");
