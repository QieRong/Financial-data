"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { ChartCard } from "@/components/ui/chart-card";
import { fetchReportData } from "@/app/dashboard/_components/analysis/report-data";
import { RangeSelector } from "@/components/ui/range-selector";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// 定义接口类型
interface PrepaymentsData {
    报告日期: string;
    预付款项: number;
    预付款项_环比: number;
    预付款项_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<PrepaymentsData[]> =>
    fetchReportData<PrepaymentsData>("balance", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<PrepaymentsData[]> =>
    fetchReportData<PrepaymentsData>("balance", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<PrepaymentsData[]> =>
    fetchReportData<PrepaymentsData>("balance", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    prepayments: {
        title: "预付款项",
        formula: "预付款项",
        description:
            "反映企业预先支付的采购款项，包括预付供应商的货款、预付的工程款等。金额较大可能表明企业采购议价能力较弱或供应商要求预付较多。",
    },
} as const;

// 添加 MetricDescription 组件
const MetricDescription = ({
    type,
}: {
    type: keyof typeof METRIC_DESCRIPTIONS;
}) => {
    const info = METRIC_DESCRIPTIONS[type];
    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">{info.title}指标说明</h4>
            <div className="space-y-2 text-sm">
                <p>
                    <span className="font-medium">计算公式：</span>
                    {info.formula}
                </p>
                <p>
                    <span className="font-medium">指标说明：</span>
                    {info.description}
                </p>
            </div>
        </div>
    );
};

// 修改 PrepaymentsContent 组件
function PrepaymentsContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [dataType, setDataType] = useState<"period" | "quarterly" | "yearly">("period");
    const [startPeriod, setStartPeriod] = useState<string>("");
    const [endPeriod, setEndPeriod] = useState<string>("");

    const { data: periodData } = useSuspenseQuery({
        queryKey: ["balanceSheetPeriod", stockCode],
        queryFn: () => fetchPeriodData(stockCode),
    });

    const { data: quarterlyData } = useSuspenseQuery({
        queryKey: ["balanceSheetQuarterly", stockCode],
        queryFn: () => fetchQuarterlyData(stockCode),
    });

    const { data: yearlyData } = useSuspenseQuery({
        queryKey: ["balanceSheetYearly", stockCode],
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
            const value = item.预付款项;
            const 环比 = dataType === "quarterly" 
                ? item.预付款项_环比
                : null;
            const 同比 = item.预付款项_同比;

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
                <CardTitle>预付款项分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间预付款项分析`}</span>
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
                />
                <MetricDescription type="prepayments" />
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

// 修改主组件
export default function PrepaymentsAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <PrepaymentsContent />
            </Suspense>
        </ErrorBoundary>
    );
}
