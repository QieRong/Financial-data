import { t } from "elysia";

import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { table } from "@/server/models/schema";
import { spreads } from "@/server/utils";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// 推断插入和选择类型, 并细化为更具体的类型
const reportTypeEntity = {
    insert: spreads(
        {
            reportType: createInsertSchema(table.reportType, {
                typeName: t.String({
                    minLength: 1,
                    maxLength: 10,
                    error: "报表名称字符应该在1到10之内",
                }),
            }),
        },
        "insert"
    ),
    select: spreads(
        {
            reportType: createSelectSchema(table.reportType, {
                typeName: t.String({
                    minLength: 1,
                    maxLength: 10,
                    error: "报表名称字符应该在1到10之内",
                }),
            }),
        },
        "select"
    ),
} as const;

const reportEntity = {
    insert: spreads(
        {
            report: createInsertSchema(table.report, {
                // 设置periodType为枚举类型,限制为yearly，quarterly，period
                periodType: t.Enum({
                    yearly: "yearly",
                    quarterly: "quarterly",
                    period: "period",
                }),
                stockCode: t.String({
                    maxLength: 6,
                    minLength: 6,
                }),
                reportDate: t.String({
                    format: "date",
                }),
            }),
        },
        "insert"
    ),
    select: spreads(
        {
            report: createSelectSchema(table.report, {
                periodType: t.Enum({
                    yearly: "yearly",
                    quarterly: "quarterly",
                    period: "period",
                }),
                stockCode: t.String({
                    maxLength: 6,
                    minLength: 6,
                }),
                reportDate: t.String({
                    format: "date",
                }),
            }),
        },
        "select"
    ),
} as const;

// 运行时类型(用作JSON Schema验证)
export { reportEntity, reportTypeEntity };

// 编译时类型(用作TypeScript类型)
// Report Types
export type Report = InferSelectModel<typeof table.report>;
export type InsertReport = InferInsertModel<typeof table.report>;

// Report Types Types
export type ReportType = InferSelectModel<typeof table.reportType>;
export type InsertReportType = InferInsertModel<typeof table.reportType>;
