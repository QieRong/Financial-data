// src/server/controller/finance.controller.ts
import { Elysia, t } from "elysia";
import { FinanceService } from "../services";
import { error } from "console";

export const FinanceController = new Elysia({ prefix: `/api/` + "finance" })
    .use(FinanceService)
    // ReportType endpoints
    .get(
        "/report-type/:id",
        async ({ params: { id }, FinanceService }) => {
            const reportTypes = await FinanceService.getReportType(id);
            if (reportTypes.length === 0) {
                return { error: "Report Type not found" };
            }
            return reportTypes;
        },
        {
            params: t.Object({
                id: t.Numeric({
                    error: "Report Type ID must be a number",
                }),
            }),
            detail: {
                tags: ["Report Types"],
                summary: "Get report types by id",
            },
        }
    )
    .get(
        "/report-types",
        async ({ FinanceService }) => {
            const reportTypes = await FinanceService.getAllReportTypes();
            return reportTypes;
        },
        {
            detail: {
                tags: ["Report Types"],
                summary: "Get all report types",
            },
        }
    )
    .post(
        "/report-type",
        async ({ body, FinanceService }) => {
            const reportType = await FinanceService.addReportType(body);
            return reportType;
        },
        {
            body: t.Object({
                typeName: t.String(),
                id: t.Optional(t.Numeric()),
            }),
            detail: {
                tags: ["Report Types"],
                summary: "Create a new report type",
            },
        }
    )
    .delete(
        "/report-type/:id",
        async ({ params: { id }, FinanceService }) => {
            await FinanceService.removeReportType(+id);
            return { success: true };
        },
        {
            params: t.Object({
                id: t.Numeric({
                    error: "Report Type ID must be a number",
                }),
            }),
            detail: {
                tags: ["Report Types"],
                summary: "Delete a report type",
            },
        }
    )
    .patch(
        "/report-type/:id",
        async ({ params: { id }, body, FinanceService }) => {
            const reportType = await FinanceService.updateReportType(+id, body);
            return reportType;
        },
        {
            params: t.Object({
                id: t.Numeric({
                    error: "Report Type ID must be a number",
                }),
            }),
            body: t.Object({
                typeName: t.String(),
            }),
            detail: {
                tags: ["Report Types"],
                summary: "Update an existing report type",
            },
        }
    )
    // Reports endpoints
    .post(
        "/report",
        async ({ body, FinanceService }) => {
            const report = await FinanceService.addReport(body);
            return report;
        },
        {
            body: t.Object({
                typeId: t.Numeric(),
                stockCode: t.String(),
                periodType: t.Union([
                    t.Literal("period"),
                    t.Literal("quarterly"),
                    t.Literal("yearly"),
                ]),
                reportDate: t.String(),
                reportData: t.Any(),
            }),
            detail: {
                tags: ["Reports"],
                summary: "Create a new report",
            },
        }
    )
    .patch(
        "/report/:id",
        async ({ params: { id }, body, FinanceService }) => {
            const report = await FinanceService.updateReport(+id, body);
            return report;
        },
        {
            params: t.Object({
                id: t.Numeric({
                    error: "Report ID must be a number",
                }),
            }),
            body: t.Object({
                typeId: t.Numeric(),
                stockCode: t.String(),
                periodType: t.Union([
                    t.Literal("period"),
                    t.Literal("quarterly"),
                    t.Literal("yearly"),
                ]),
                reportDate: t.String(),
                reportData: t.Any(),
            }),
            detail: {
                tags: ["Reports"],
                summary: "Update an existing report",
            },
        }
    )
    .delete(
        "/report/:id",
        async ({ params: { id }, FinanceService }) => {
            await FinanceService.removeReport(+id);
            return { success: true };
        },
        {
            params: t.Object({
                id: t.Numeric({
                    error: "Report ID must be a number",
                }),
            }),
            detail: {
                tags: ["Reports"],
                summary: "Delete a report",
            },
        }
    )
    // Financial data endpoints
    .get(
        "/financial-data/:reportType/:stockCode/:periodType",
        async ({
            params: { stockCode, reportType, periodType },
            FinanceService,
        }) => {
            const data = await FinanceService.getReportData(
                stockCode,
                periodType,
                reportType
            );
            return data;
        },
        {
            params: t.Object({
                stockCode: t.String({
                    minLength: 1,
                    maxLength: 10,
                    error: "Invalid stock code",
                }),
                reportType: t.String(),
                periodType: t.Union([
                    t.Literal("period"),
                    t.Literal("quarterly"),
                    t.Literal("yearly"),
                ]),
            }),
            detail: {
                tags: ["Reports"],
                summary:
                    "Get financial data by stock code, report type, and period type",
            },
        }
    )
    // 状态检查端点
    .get("/health", () => ({ status: "healthy" }), {
        response: t.Object({
            status: t.String(),
        }),
        detail: {
            tags: ["System"],
            summary: "Health check endpoint",
        },
    });
