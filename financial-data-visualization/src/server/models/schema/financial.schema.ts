import {
    pgTable,
    serial,
    varchar,
    timestamp,
    integer,
    date,
    jsonb,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

// Enums
export const periodTypeEnum = pgEnum("period_type", [
    "period",
    "quarterly",
    "yearly",
] as const);

// Report Type Table
export const reportType = pgTable("report_type", {
    id: serial().primaryKey(),
    typeName: varchar({ length: 50 }).notNull().unique(),
});

// Report Table
export const report = pgTable(
    "report",
    {
        id: serial().primaryKey(),
        typeId: integer()
            .references(() => reportType.id)
            .notNull(),
        stockCode: varchar({ length: 20 }).notNull(),
        periodType: periodTypeEnum().notNull(),
        reportDate: varchar({ length: 20 }).notNull(),
        reportData: jsonb().notNull(),
        updatedAt: timestamp().defaultNow(),
    },
    (table) => [
        index("idx_stock_date").on(table.stockCode, table.reportDate),
        index("idx_period_date").on(table.periodType, table.reportDate),
    ]
);

export const reportTypesRelations = relations(reportType, ({ many }) => ({
    reports: many(report),
}));

export const reportsRelations = relations(report, ({ one }) => ({
    type: one(reportType, {
        fields: [report.typeId],
        references: [reportType.id],
    }),
}));
