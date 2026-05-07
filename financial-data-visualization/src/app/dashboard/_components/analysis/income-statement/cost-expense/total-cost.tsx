"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoadingState } from "@/components/ui/loading-state";
import { ChartCard } from "@/components/ui/chart-card";
import { fetchReportData } from "@/app/dashboard/_components/analysis/report-data";
import { formatPeriod, formatValue } from "@/app/lib/utils";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RangeSelector } from "@/components/ui/range-selector";

// 定义接口类型
interface TotalCostData {
    报告日期: string;
    营业总成本: number;
    营业总成本_环比: number;
    营业总成本_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<TotalCostData[]> =>
    fetchReportData<TotalCostData>("income", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<TotalCostData[]> =>
    fetchReportData<TotalCostData>("income", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<TotalCostData[]> =>
    fetchReportData<TotalCostData>("income", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTION = {
    title: "营业总成本",
    formula: "营业成本 + 销售费用 + 管理费用 + 研发费用 + 财务费用",
    description: "反映企业在经营活动中所发生的各项成本和费用的总和，是衡量企业经营效率的重要指标。",
} as const;

// 添加 MetricDescription 组件
const MetricDescription = () => {
    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">{METRIC_DESCRIPTION.title}指标说明</h4>
            <div className="space-y-2 text-sm">
                <p>
                    <span className="font-medium">计算公式：</span>
                    {METRIC_DESCRIPTION.formula}
                </p>
                <p>
                    <span className="font-medium">指标说明：</span>
                    {METRIC_DESCRIPTION.description}
                </p>
            </div>
        </div>
    );
};

// 修改内容组件
function TotalCostContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [dataType, setDataType] = useState<"period" | "quarterly" | "yearly">("period");
    const [startPeriod, setStartPeriod] = useState<string>("");
    const [endPeriod, setEndPeriod] = useState<string>("");

    const { data: periodData } = useSuspenseQuery({
        queryKey: ["incomeStatementPeriod", stockCode],
        queryFn: () => fetchPeriodData(stockCode),
    });

    const { data: quarterlyData } = useSuspenseQuery({
        queryKey: ["incomeStatementQuarterly", stockCode],
        queryFn: () => fetchQuarterlyData(stockCode),
    });

    const { data: yearlyData } = useSuspenseQuery({
        queryKey: ["incomeStatementYearly", stockCode],
        queryFn: () => fetchYearlyData(stockCode),
    });

    if (!periodData || !quarterlyData || !yearlyData) return null;

    // 获取当前数据集
    const currentData = {
        period: periodData,
        quarterly: quarterlyData,
        yearly: yearlyData,
    }[dataType];

    // 在数据加载后设置初始区间
    useEffect(() => {
        if (currentData && currentData.length > 0) {
            const sortedPeriods = [...currentData]
                .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
                .map(item => item.报告日期);
            
            // 默认显示最近20期数据
            const defaultStart = sortedPeriods[Math.max(0, sortedPeriods.length - 20)];
            const defaultEnd = sortedPeriods[sortedPeriods.length - 1];
            
            setStartPeriod(defaultStart);
            setEndPeriod(defaultEnd);
        }
    }, [currentData, dataType]);

    // 获取数据
    const getData = () => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        return sortedData.map((item) => {
            const value = item.营业总成本;
            const 环比 = dataType === "quarterly" 
                ? item.营业总成本_环比
                : null;
            const 同比 = item.营业总成本_同比;

            return {
                period: item.报告日期,
                value: Number(value),
                ...(环比 !== null && { 环比: Number(环比) }),
                同比: Number(同比),
            };
        });
    };

    // 获取所有可选的时间点
    const availablePeriods = useMemo(() => {
        if (!currentData) return [];
        return [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .map(item => item.报告日期);
    }, [currentData]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>营业总成本分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间营业总成本分析`}</span>
                    <div className="flex items-center gap-4">
                        <RangeSelector
                            periods={availablePeriods}
                            startPeriod={startPeriod}
                            endPeriod={endPeriod}
                            onRangeChange={(start, end) => {
                                setStartPeriod(start);
                                setEndPeriod(end);
                            }}
                        />
                        <Tabs
                            value={dataType}
                            className="w-[300px]"
                            onValueChange={(value) =>
                                setDataType(value as "period" | "quarterly" | "yearly")
                            }
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="period">报告期</TabsTrigger>
                                <TabsTrigger value="quarterly">季度</TabsTrigger>
                                <TabsTrigger value="yearly">年度</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartCard
                    data={getData()}
                    isAmount
                    unit="亿"
                    showMoM={dataType === "quarterly"}
                    rotateLabel
                    invertColors
                />
                <MetricDescription />
            </CardContent>
        </Card>
    );
}

// 添加错误回调函数
function ErrorFallback({ error }: { error: Error }) {
    return (
        <div className="text-red-500">
            <p>出错了:</p>
            <pre>{error.message}</pre>
        </div>
    );
}

// 修改导出组件
export default function TotalCostAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <TotalCostContent />
            </Suspense>
        </ErrorBoundary>
    );
}
