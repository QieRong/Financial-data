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
interface GoodwillData {
    报告日期: string;
    商誉: number;
    商誉_环比: number;
    商誉_同比: number;
    商誉占总资产比率: number;
    商誉占总资产比率_环比: number;
    商誉占总资产比率_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<GoodwillData[]> =>
    fetchReportData<GoodwillData>("balance", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<GoodwillData[]> =>
    fetchReportData<GoodwillData>("balance", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<GoodwillData[]> =>
    fetchReportData<GoodwillData>("balance", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    goodwill: {
        title: "商誉",
        formula: "商誉",
        description: "反映企业在收购其他企业时支付的收购价格超过被收购企业可辨认净资产公允价值的部分。商誉金额较大可能存在减值风险。",
    },
    ratio: {
        title: "商誉占总资产比率",
        formula: "商誉 ÷ 总资产",
        description: "反映商誉在企业总资产中的占比。比率过高表明企业可能存在较大的商誉减值风险。",
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
function GoodwillContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("goodwill");
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
    const getData = (type: "goodwill" | "ratio") => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        const propertyMap = {
            goodwill: {
                value: "商誉",
                环比: "商誉_环比",
                同比: "商誉_同比",
            },
            ratio: {
                value: "商誉占总资产比率",
                环比: "商誉占总资产比率_环比",
                同比: "商誉占总资产比率_同比",
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
                <CardTitle>商誉分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间商誉相关指标分析`}</span>
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
                    defaultValue="goodwill"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="goodwill">商誉</TabsTrigger>
                        <TabsTrigger value="ratio">商誉占比</TabsTrigger>
                    </TabsList>

                    <TabsContent value="goodwill">
                        <ChartCard
                            data={getData("goodwill")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="goodwill" />
                    </TabsContent>

                    <TabsContent value="ratio">
                        <ChartCard
                            data={getData("ratio")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="ratio" />
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
export default function GoodwillAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <GoodwillContent />
            </Suspense>
        </ErrorBoundary>
    );
} 
