export type ReportType = "balance" | "income" | "cashflow";
export type PeriodType = "period" | "quarterly" | "yearly";

export async function fetchReportData<T>(
    reportType: ReportType,
    periodType: PeriodType,
    stockCode: string
): Promise<T[]> {
    const response = await fetch(
        `/api/report/${reportType}/${periodType}/${stockCode}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${reportType} ${periodType} data: ${response.status}`
        );
    }

    return await response.json();
}
