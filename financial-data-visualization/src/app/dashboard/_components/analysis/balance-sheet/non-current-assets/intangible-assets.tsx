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
interface IntangibleAssetsData {
    报告日期: string;
    无形资产: number;
    无形资产_环比: number;
    无形资产_同比: number;
    开发支出: number;
    开发支出_环比: number;
    开发支出_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<IntangibleAssetsData[]> =>
    fetchReportData<IntangibleAssetsData>("balance", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<IntangibleAssetsData[]> =>
    fetchReportData<IntangibleAssetsData>("balance", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<IntangibleAssetsData[]> =>
    fetchReportData<IntangibleAssetsData>("balance", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    intangible: {
        title: "无形资产",
        formula: "无形资产",
        description: "反映企业拥有的专利权、商标权、土地使用权等无形资产的价值。无形资产是企业的重要资源，体现企业的创新能力和竞争优势。",
    },
    development: {
        title: "开发支出",
        formula: "开发支出",
        description: "反映企业研究开发项目开发阶段的支出。根据会计准则，研究阶段支出费用化，开发阶段支出资本化。开发支出较大表明企业重视研发投入。",
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
function IntangibleAssetsContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("intangible");
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
    const getData = (type: "intangible" | "development") => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        const propertyMap = {
            intangible: {
                value: "无形资产",
                环比: "无形资产_环比",
                同比: "无形资产_同比",
            },
            development: {
                value: "开发支出",
                环比: "开发支出_环比",
                同比: "开发支出_同比",
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
                <CardTitle>无形资产分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间无形资产相关指标分析`}</span>
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
                    defaultValue="intangible"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="intangible">无形资产</TabsTrigger>
                        <TabsTrigger value="development">开发支出</TabsTrigger>
                    </TabsList>

                    <TabsContent value="intangible">
                        <ChartCard
                            data={getData("intangible")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="intangible" />
                    </TabsContent>

                    <TabsContent value="development">
                        <ChartCard
                            data={getData("development")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="development" />
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
export default function IntangibleAssetsAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <IntangibleAssetsContent />
            </Suspense>
        </ErrorBoundary>
    );
}
