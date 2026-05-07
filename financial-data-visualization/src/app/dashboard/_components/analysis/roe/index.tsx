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
interface ROEData {
    报告日期: string;
    ROE: number;
    ROE_环比: number;
    ROE_同比: number;
    ROE净利率: number;
    ROE净利率_环比: number;
    ROE净利率_同比: number;
    生产资产回报率: number;
    生产资产回报率_环比: number;
    生产资产回报率_同比: number;
    总资产周转率: number;
    总资产周转率_环比: number;
    总资产周转率_同比: number;
    杠杆系数: number;
    杠杆系数_环比: number;
    杠杆系数_同比: number;
    总资产收益率: number;
    总资产收益率_环比: number;
    总资产收益率_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<ROEData[]> =>
    fetchReportData<ROEData>("income", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<ROEData[]> =>
    fetchReportData<ROEData>("income", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<ROEData[]> =>
    fetchReportData<ROEData>("income", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    roe: {
        title: "ROE",
        formula: "净利率 × 总资产周转率 × 权益乘数",
        description: "反映股东权益的收益水平，指标值越高表明投资带来的收益越高。",
    },
    netProfitMargin: {
        title: "ROE净利率",
        formula: "净利润 ÷ 平均净资产",
        description: "反映企业利用股东权益获取净利润的能力，是ROE的重要组成部分。",
    },
    productiveAssetReturn: {
        title: "生产资产回报率",
        formula: "(利润总额 + 所得税费用) ÷ 生产资产",
        description: "反映企业生产性资产的收益水平，生产资产包括固定资产、在建工程、无形资产等。",
    },
    assetTurnover: {
        title: "总资产周转率",
        formula: "营业总收入 ÷ 总资产",
        description: "反映企业资产的运营效率，指标值越高表明资产利用效率越高。",
    },
    leverage: {
        title: "杠杆系数",
        formula: "总资产 ÷ 所有者权益",
        description: "反映企业的财务杠杆水平，值越大表明杠杆程度越高，风险也越大。",
    },
    roa: {
        title: "总资产收益率",
        formula: "净利润 ÷ 总资产",
        description: "反映企业资产的收益水平，不考虑财务杠杆的影响。",
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

// 修改 ROEContent 组件
function ROEContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("roe");
    const [dataType, setDataType] = useState<"period" | "quarterly" | "yearly">("period");
    const [startPeriod, setStartPeriod] = useState<string>("");
    const [endPeriod, setEndPeriod] = useState<string>("");

    const { data: periodData } = useSuspenseQuery({
        queryKey: ["roePeriod", stockCode],
        queryFn: () => fetchPeriodData(stockCode),
    });

    const { data: quarterlyData } = useSuspenseQuery({
        queryKey: ["roeQuarterly", stockCode],
        queryFn: () => fetchQuarterlyData(stockCode),
    });

    const { data: yearlyData } = useSuspenseQuery({
        queryKey: ["roeYearly", stockCode],
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
            roe: {
                value: "ROE",
                环比: "ROE_环比",
                同比: "ROE_同比",
            },
            netProfitMargin: {
                value: "ROE净利率",
                环比: "ROE净利率_环比",
                同比: "ROE净利率_同比",
            },
            productiveAssetReturn: {
                value: "生产资产回报率",
                环比: "生产资产回报率_环比",
                同比: "生产资产回报率_同比",
            },
            assetTurnover: {
                value: "总资产周转率",
                环比: "总资产周转率_环比",
                同比: "总资产周转率_同比",
            },
            leverage: {
                value: "杠杆系数",
                环比: "杠杆系数_环比",
                同比: "杠杆系数_同比",
            },
            roa: {
                value: "总资产收益率",
                环比: "总资产收益率_环比",
                同比: "总资产收益率_同比",
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
                <CardTitle>ROE 分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间 ROE 相关指标分析`}</span>
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
                    defaultValue="roe"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
                        <TabsTrigger value="roe">ROE</TabsTrigger>
                        <TabsTrigger value="netProfitMargin">ROE净利率</TabsTrigger>
                        <TabsTrigger value="productiveAssetReturn">生产资产回报率</TabsTrigger>
                        <TabsTrigger value="assetTurnover">总资产周转率</TabsTrigger>
                        <TabsTrigger value="leverage">杠杆系数</TabsTrigger>
                        <TabsTrigger value="roa">总资产收益率</TabsTrigger>
                    </TabsList>

                    <TabsContent value="roe">
                        <ChartCard
                            data={getData("roe")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="roe" />
                    </TabsContent>

                    <TabsContent value="netProfitMargin">
                        <ChartCard
                            data={getData("netProfitMargin")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="netProfitMargin" />
                    </TabsContent>

                    <TabsContent value="productiveAssetReturn">
                        <ChartCard
                            data={getData("productiveAssetReturn")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="productiveAssetReturn" />
                    </TabsContent>

                    <TabsContent value="assetTurnover">
                        <ChartCard
                            data={getData("assetTurnover")}
                            unit="次"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="assetTurnover" />
                    </TabsContent>

                    <TabsContent value="leverage">
                        <ChartCard
                            data={getData("leverage")}
                            unit="倍"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="leverage" />
                    </TabsContent>

                    <TabsContent value="roa">
                        <ChartCard
                            data={getData("roa")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="roa" />
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
export default function ROEAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <ROEContent />
            </Suspense>
        </ErrorBoundary>
    );
}
