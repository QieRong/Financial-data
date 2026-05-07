"use client"

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
interface SolvencyData {
    报告日期: string;
    现金债务比: number;
    现金债务比_环比: number;
    现金债务比_同比: number;
    扩展现金债务比: number;
    扩展现金债务比_环比: number;
    扩展现金债务比_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<SolvencyData[]> =>
    fetchReportData<SolvencyData>("balance", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<SolvencyData[]> =>
    fetchReportData<SolvencyData>("balance", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<SolvencyData[]> =>
    fetchReportData<SolvencyData>("balance", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    coverage: {
        title: "现金债务比",
        formula: "现金及现金等价物 ÷ 有息负债",
        description: "反映企业现金对有息负债的覆盖程度。比率越高表明企业偿债能力越强。",
    },
    extendedCoverage: {
        title: "扩展现金债务比",
        formula: "(现金及现金等价物 + 交易性金融资产 + 一年内到期的非流动资产 + 其他流动资产) ÷ 有息负债",
        description: "反映企业流动资产对有息负债的覆盖程度。比率越高表明企业短期偿债能力越强。",
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

// 修改内容组件
function SolvencyContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("coverage");
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
    const getData = (type: keyof typeof METRIC_DESCRIPTIONS) => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        const propertyMap = {
            coverage: {
                value: "现金债务比",
                环比: "现金债务比_环比",
                同比: "现金债务比_同比",
            },
            extendedCoverage: {
                value: "扩展现金债务比",
                环比: "扩展现金债务比_环比",
                同比: "扩展现金债务比_同比",
            },
        } as const;

        const keys = propertyMap[type];

        return sortedData.map((item) => {
            const value = item[keys.value as keyof typeof item];
            const 环比 = dataType === "quarterly" 
                ? item[keys.环比 as keyof typeof item]
                : null;
            const 同比 = item[keys.同比 as keyof typeof item];

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
                <CardTitle>偿债能力分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间偿债能力相关指标分析`}</span>
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
                <Tabs
                    defaultValue="coverage"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="coverage">现金债务比</TabsTrigger>
                        <TabsTrigger value="extendedCoverage">扩展现金债务比</TabsTrigger>
                    </TabsList>

                    <TabsContent value="coverage">
                        <ChartCard
                            data={getData("coverage")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="coverage" />
                    </TabsContent>

                    <TabsContent value="extendedCoverage">
                        <ChartCard
                            data={getData("extendedCoverage")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="extendedCoverage" />
                    </TabsContent>
                </Tabs>
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
export default function SolvencyAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <SolvencyContent />
            </Suspense>
        </ErrorBoundary>
    );
} 
