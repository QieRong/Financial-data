import { Elysia } from "elysia";
import { eq, and } from "drizzle-orm";
import { table } from "../models/schema";
import { dbPlugin } from "../config/db.config";
import {
    type InsertReport,
    type InsertReportType,
    type Report,
    type ReportType,
    reportEntity,
    reportTypeEntity,
} from "../models/entity";
import type { reportType } from "../models/schema/financial.schema";

export const FinanceService = new Elysia({ name: "finance.service" })
    .use(dbPlugin)
    //我再也不想写那个用elysia包裹的狗屎仓储层了
    .derive(({ db }) => ({
        // Repository layer
        FinanceRepo: {
            // ReportType methods
            async createReportType(data: InsertReportType) {
                return await db()
                    .insert(table.reportType)
                    .values(data)
                    .returning();
            },

            async deleteReportType(id: number) {
                return await db()
                    .delete(table.reportType)
                    .where(eq(table.reportType.id, id))
                    .returning();
            },

            async updateReportType(id: number, data: InsertReportType) {
                return await db()
                    .update(table.reportType)
                    .set(data)
                    .where(eq(table.reportType.id, id))
                    .returning();
            },

            async getReportTypes(id: number) {
                return await db()
                    .select()
                    .from(table.reportType)
                    .where(eq(table.reportType.id, id));
            },

            async getAllReportTypes() {
                return await db().select().from(table.reportType);
            },

            // Report methods
            async createReport(data: InsertReport) {
                return await db().insert(table.report).values(data).returning();
            },

            async deleteReport(id: number) {
                return await db()
                    .delete(table.report)
                    .where(eq(table.report.id, id))
                    .returning();
            },

            async updateReport(id: number, data: Partial<InsertReport>) {
                return await db()
                    .update(table.report)
                    .set(data)
                    .where(eq(table.report.id, id))
                    .returning();
            },

            async getReportsByCodeAndperiodType(
                code: string,
                periodType: "period" | "quarterly" | "yearly",
                typeId: number
            ) {
                return await db()
                    .select()
                    .from(table.report)
                    .where(
                        and(
                            eq(table.report.stockCode, code),
                            eq(table.report.periodType, periodType),
                            eq(table.report.typeId, typeId)
                        )
                    );
            },

            async getAllReports() {
                return await db().select().from(table.report);
            },
        },
    }))
    .derive(({ FinanceRepo, set }) => ({
        FinanceService: {
            // ReportType service methods
            async addReportType(data: InsertReportType) {
                return await FinanceRepo.createReportType(data);
            },

            async removeReportType(id: number) {
                return await FinanceRepo.deleteReportType(id);
            },

            async updateReportType(id: number, data: InsertReportType) {
                return await FinanceRepo.updateReportType(id, data);
            },

            async getReportType(id: number) {
                return await FinanceRepo.getReportTypes(id);
            },

            async getAllReportTypes() {
                return await FinanceRepo.getAllReportTypes();
            },

            // Reports service methods

            // 弱相关，不需要关联字段
            async addReport(data: InsertReport) {
                return await FinanceRepo.createReport(data);
            },

            async updateReport(id: number, data: Partial<InsertReport>) {
                return await FinanceRepo.updateReport(id, data);
            },

            // 弱相关，不需要关联字段
            async removeReport(id: number) {
                return await FinanceRepo.deleteReport(id);
            },

            // 定义响应格式接口
            async getReportsByCodeAndperiodType(
                stockCode: string,
                periodType: "period" | "quarterly" | "yearly",
                typeId: number
            ) {
                return await FinanceRepo.getReportsByCodeAndperiodType(
                    stockCode,
                    periodType,
                    typeId
                );
            },

            async getReportData(
                stockCode: string,
                periodType: "period" | "quarterly" | "yearly",
                reportType: string
            ): Promise<any> {
                try {
                    const reportTypes = await FinanceRepo.getAllReportTypes();
                    const typeInfo = reportTypes.find(
                        (type) => type.typeName === reportType
                    );

                    if (!typeInfo) {
                        set.status = 404;
                        return {
                            success: false,
                            data: null,
                            message: "Report type not found",
                        };
                    }

                    // 再查询数据库中是否已有该股票的数据
                    let dbData =
                        await FinanceRepo.getReportsByCodeAndperiodType(
                            stockCode,
                            periodType,
                            typeInfo.id
                        );

                    if (dbData.length === 0) {
                        // 如果数据库中没有数据，从API获取
                        const reportApiBaseUrl =
                            process.env.REPORT_API_BASE_URL ??
                            "http://127.0.0.1:8000";
                        const statmentUrl = new URL(
                            `/api/report/${reportType}/${periodType}/${stockCode}`,
                            reportApiBaseUrl
                        ).toString();

                        try {
                            const response = await fetch(statmentUrl);
                            if (!response.ok) {
                                set.status = 404;
                                return {
                                    success: false,
                                    data: null,
                                    message: "Cannot fetch data from API",
                                };
                            }

                            const statment = await response.json();

                            if (
                                !Array.isArray(statment) ||
                                statment.length === 0
                            ) {
                                set.status = 404;
                                return {
                                    success: false,
                                    data: null,
                                    message: "No report data returned from API",
                                };
                            }

                            // 保存完整数据到数据库
                            var reportData = await FinanceRepo.createReport({
                                typeId: typeInfo.id,
                                stockCode: stockCode,
                                periodType: periodType,
                                reportDate: statment[0].报告日期,
                                reportData: statment,
                                updatedAt: new Date(),
                            });

                            return {
                                success: true,
                                data: reportData,
                                message: "Data retrieved successfully",
                            };
                        } catch (error: any) {
                            set.status = 500;
                            return {
                                success: false,
                                message: error.message,
                            };
                        }
                    }
                    return {
                        success: true,
                        data: dbData,
                        message: "Data retrieved from database",
                    };
                } catch (error: any) {
                    set.status = 500;
                    return {
                        success: false,
                        data: null,
                        message: error.message,
                    };
                }
            },
        },
    }))
    .as("plugin");
