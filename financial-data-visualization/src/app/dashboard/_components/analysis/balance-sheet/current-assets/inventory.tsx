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
interface InventoryData {
    报告日期: string;
    存货: number;
    存货_环比: number;
    存货_同比: number;
    存货周转率: number;
    存货周转率_环比: number;
    存货周转率_同比: number;
}

// 获取数据的函数
const fetchPeriodData = async (stockCode: string): Promise<InventoryData[]> => {
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

const fetchQuarterlyData = async (
    stockCode: string
): Promise<InventoryData[]> => {
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

const fetchYearlyData = async (stockCode: string): Promise<InventoryData[]> => {
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
    amount: {
        title: "存货金额",
        formula: "存货",
        description:
            "反映企业库存商品、原材料等存货的规模。金额过大可能表明存货周转慢，占用资金多。",
    },
    turnover: {
        title: "存货周转率",
        formula: "营业成本 ÷ 平均存货\n平均存货 = （期初存货 + 期末存货） ÷ 2",
        description:
            "反映企业存货周转速度，数值越大表示存货流动性越强，营运能力越好。",
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

// 修改 InventoryContent 组件
function InventoryContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("amount");
    const [dataType, setDataType] = useState<"period" | "quarterly" | "yearly">(
        "period"
    );
    const [displayRange, setDisplayRange] = useState<number>(8); // 默认显示8期数据
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
                .map((item) => item.报告日期);

            // 默认显示最近20期数据
            const defaultStart =
                sortedPeriods[Math.max(0, sortedPeriods.length - 20)];
            const defaultEnd = sortedPeriods[sortedPeriods.length - 1];

            setStartPeriod(defaultStart);
            setEndPeriod(defaultEnd);
        }
    }, [currentData, dataType]);

    // 获取数据
    const getData = (type: "amount" | "turnover") => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(
                (item) =>
                    item.报告日期 >= startPeriod && item.报告日期 <= endPeriod
            );

        return sortedData.map((item) => {
            const value = type === "amount" ? item.存货 : item.存货周转率;
            const 环比 =
                dataType === "quarterly"
                    ? type === "amount"
                        ? item.存货_环比
                        : item.存货周转率_环比
                    : null;
            const 同比 =
                type === "amount" ? item.存货_同比 : item.存货周转率_同比;

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
            .map((item) => item.报告日期);
    }, [currentData]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>存货分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间存货相关指标分析`}</span>
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
                                setDataType(
                                    value as "period" | "quarterly" | "yearly"
                                )
                            }
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="period">报告期</TabsTrigger>
                                <TabsTrigger value="quarterly">
                                    季度
                                </TabsTrigger>
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
                        <TabsTrigger value="amount">存货金额</TabsTrigger>
                        <TabsTrigger value="turnover">存货周转</TabsTrigger>
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

                    <TabsContent value="turnover">
                        <ChartCard
                            data={getData("turnover")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="turnover" />
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
export default function InventoryAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <InventoryContent />
            </Suspense>
        </ErrorBoundary>
    );
}
