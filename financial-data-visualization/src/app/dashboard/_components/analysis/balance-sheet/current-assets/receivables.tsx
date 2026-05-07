"use client";

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
interface ReceivablesData {
    报告日期: string;
    应收账款周转率: number;
    应收账款周转率_环比: number;
    应收账款周转率_同比: number;
    存货周转率: number;
    存货周转率_环比: number;
    存货周转率_同比: number;
    固定资产周转率: number;
    固定资产周转率_环比: number;
    固定资产周转率_同比: number;
}

// 获取数据的函数
const fetchPeriodData = async (stockCode: string): Promise<ReceivablesData[]> => {
    const response = await fetch(
        `/api/report/balance/period/${stockCode}`,
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

const fetchQuarterlyData = async (stockCode: string): Promise<ReceivablesData[]> => {
    const response = await fetch(
        `/api/report/balance/quarterly/${stockCode}`,
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

const fetchYearlyData = async (stockCode: string): Promise<ReceivablesData[]> => {
    const response = await fetch(
        `/api/report/balance/yearly/${stockCode}`,
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
    receivables: {
        title: "应收账款周转率",
        formula: "营业收入 ÷ 应收账款",
        description:
            "反映企业应收账款周转速度，数值越大表示回收越快，经营效率越高。",
    },
    inventory: {
        title: "存货周转率",
        formula: "营业成本 ÷ 平均存货",
        description:
            "反映企业存货周转速度，数值越大表示存货流动性越强，营运能力越好。",
    },
    "fixed-assets": {
        title: "固定资产周转率",
        formula: "营业收入 ÷ 平均固定资产",
        description:
            "反映企业固定资产利用效率，数值越大表示固定资产利用效率越高。",
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

// 修改 ReceivablesContent 组件
function ReceivablesContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("receivables");
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
            receivables: "应收账款周转率",
            inventory: "存货周转率",
            "fixed-assets": "固定资产周转率",
        } as const;

        const propertyName = propertyMap[type];

        return sortedData.map((item) => {
            const value = item[`${propertyName}` as keyof typeof item];
            const 环比 = dataType === "quarterly" 
                ? item[`${propertyName}_环比` as keyof typeof item]
                : null;
            const 同比 = item[`${propertyName}_同比` as keyof typeof item];

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
                <CardTitle>资产周转效率分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间资产周转效率指标分析`}</span>
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
                    defaultValue="receivables"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="receivables">应收账款周转</TabsTrigger>
                        <TabsTrigger value="inventory">存货周转</TabsTrigger>
                        <TabsTrigger value="fixed-assets">固定资产周转</TabsTrigger>
                    </TabsList>

                    <TabsContent value="receivables">
                        <ChartCard
                            data={getData("receivables")}
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="receivables" />
                    </TabsContent>

                    <TabsContent value="inventory">
                        <ChartCard
                            data={getData("inventory")}
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="inventory" />
                    </TabsContent>

                    <TabsContent value="fixed-assets">
                        <ChartCard
                            data={getData("fixed-assets")}
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="fixed-assets" />
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
export default function ReceivablesAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <ReceivablesContent />
            </Suspense>
        </ErrorBoundary>
    );
}
