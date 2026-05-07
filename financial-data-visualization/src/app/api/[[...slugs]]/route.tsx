import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { FinanceController } from "@/server/controller/finance.controller";

const app = new Elysia()
    .use(swagger({ path: `/api/` + "swagger" }))
    .use(cors())
    .use(FinanceController);

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;
export const PATCH = app.handle;

export type App = typeof app;
