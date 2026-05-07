"use client"

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { ChartCard } from "@/components/ui/chart-card";
import { RangeSelector } from "@/components/ui/range-selector";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// 定义接口类型
interface FinancingData {
    报告日期: string;
    筹资活动产生的现金流量净额: number;
    筹资活动产生的现金流量净额_环比: number;
    筹资活动产生的现金流量净额_同比: number;
    经营活动产生的现金流量净额: number;
}

// 获取数据的函数
const fetchPeriodData = async (stockCode: string): Promise<FinancingData[]> => {
    const response = await fetch(
        `/api/report/cashflow/period/${stockCode}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    return await response.json();
};

const fetchQuarterlyData = async (stockCode: string): Promise<FinancingData[]> => {
    const response = await fetch(
        `/api/report/cashflow/quarterly/${stockCode}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    return await response.json();
};

const fetchYearlyData = async (stockCode: string): Promise<FinancingData[]> => {
    const response = await fetch(
        `/api/report/cashflow/yearly/${stockCode}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    return await response.json();
};

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    amount: {
        title: "筹资活动现金流量净额",
        formula: "筹资活动产生的现金流量净额",
        description:
            "反映企业筹资活动的现金流入和流出的净额。正值表示企业通过筹资获得了现金，负值表示企业偿还债务或分配股利导致现金流出。",
    },
    ratio: {
        title: "筹资活动现金流量比率",
        formula: "筹资活动产生的现金流量净额 / 经营活动产生的现金流量净额",
        description:
            "反映企业筹资活动占用经营现金流的程度。比率为正表示企业在进行融资，为负表示企业在偿还债务或分配利润。",
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

// 修改 FinancingContent 组件
function FinancingContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("amount");
    const [dataType, setDataType] = useState<"period" | "quarterly" | "yearly">("period");
    const [startPeriod, setStartPeriod] = useState<string>("");
    const [endPeriod, setEndPeriod] = useState<string>("");

    const { data: periodData } = useSuspenseQuery({
        queryKey: ["cashFlowPeriod", stockCode],
        queryFn: () => fetchPeriodData(stockCode),
    });

    const { data: quarterlyData } = useSuspenseQuery({
        queryKey: ["cashFlowQuarterly", stockCode],
        queryFn: () => fetchQuarterlyData(stockCode),
    });

    const { data: yearlyData } = useSuspenseQuery({
        queryKey: ["cashFlowYearly", stockCode],
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
    const getData = (type: "amount" | "ratio") => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        return sortedData.map((item) => {
            let value;
            if (type === "amount") {
                value = item.筹资活动产生的现金流量净额;
            } else {
                // 计算筹资活动现金流量比率
                value = item.经营活动产生的现金流量净额 !== 0 
                    ? (item.筹资活动产生的现金流量净额 / item.经营活动产生的现金流量净额) * 100
                    : 0;
            }

            const 环比 = dataType === "quarterly" 
                ? item.筹资活动产生的现金流量净额_环比
                : null;
            const 同比 = item.筹资活动产生的现金流量净额_同比;

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
                <CardTitle>筹资活动现金流量分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间筹资活动现金流量分析`}</span>
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
                    defaultValue="amount"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="amount">现金流量净额</TabsTrigger>
                        <TabsTrigger value="ratio">现金流量比率</TabsTrigger>
                    </TabsList>

                    <TabsContent value="amount">
                        <ChartCard
                            data={getData("amount")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="amount" />
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
export default function FinancingAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <FinancingContent />
            </Suspense>
        </ErrorBoundary>
    );
}
