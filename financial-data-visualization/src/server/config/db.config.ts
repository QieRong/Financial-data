import { Elysia } from "elysia";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const dbPlugin = new Elysia({ name: "database" })
    .decorate("db", () => {
        // Disable prefetch as it is not supported for "Transaction" pool mode
        // 数据库连接由supabase分配, 无需设置单例
        const client = postgres(process.env.DATABASE_URL!, { prepare: false });
        // BUG 使用snake_case命名法，但是失效，在config.ts中重新设置
        return drizzle(client, { casing: "snake_case" });
    })
    .onStart(() => {
        console.log("Database connection initialized");
    })
    .onStop(async () => {
        console.log("Database connection closed");
    })
    .onError(({ error }) => {
        if (error instanceof postgres.PostgresError) {
            console.error("Database error:", error.message);
            return new Response("Database error occurred", { status: 500 });
        }
    });
