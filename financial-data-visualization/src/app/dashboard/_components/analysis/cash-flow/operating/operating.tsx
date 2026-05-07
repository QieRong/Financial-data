"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoadingState } from "@/components/ui/loading-state";
import { ChartCard } from "@/components/ui/chart-card";
import { formatPeriod, formatValue } from "@/app/lib/utils";
import { RangeSelector } from "@/components/ui/range-selector";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 定义接口类型
interface OperatingData {
    报告日期: string;
    主营业务收现比率: number;
    主营业务收现比率_环比: number;
    主营业务收现比率_同比: number;
    经营活动产生的现金流量净额: number;
    经营活动产生的现金流量净额_环比: number;
    经营活动产生的现金流量净额_同比: number;
    经营活动现金流净额与净利润比率: number;
    经营活动现金流净额与净利润比率_环比: number;
    经营活动现金流净额与净利润比率_同比: number;
}

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    cashRatio: {
        title: "主营业务收现比率",
        formula: "销售商品、提供劳务收到的现金 ÷ 营业收入 × 100%",
        description: "反映企业主营业务收入的现金回收质量。比率越高，表明企业销售现金回收能力越强，经营质量越好。",
    },
    operatingFlow: {
        title: "经营活动现金流量净额",
        formula: "经营活动产生的现金流入 - 经营活动产生的现金流出",
        description: "反映企业经营活动产生的现金流量状况。正值表示企业经营活动获得现金流入，负值表示企业经营活动造成现金流出。",
    },
    netProfitRatio: {
        title: "经营活动现金流净额与净利润比率",
        formula: "经营活动产生的现金流量净额 ÷ 净利润",
        description: "反映企业经营活动产生的现金流量与净利润的匹配程度。比率越接近1表示经营质量越好，大于1表示经营活动获取现金的能力强于盈利能力，小于1则表示盈利中包含较多非现金收益。",
    },
} as const;

// 获取数据的函数
const fetchPeriodData = async (stockCode: string): Promise<OperatingData[]> => {
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

const fetchQuarterlyData = async (stockCode: string): Promise<OperatingData[]> => {
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

const fetchYearlyData = async (stockCode: string): Promise<OperatingData[]> => {
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
function OperatingContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("cashRatio");
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
    const getData = (type: keyof typeof METRIC_DESCRIPTIONS) => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        const propertyMap = {
            cashRatio: {
                value: "主营业务收现比率",
                环比: "主营业务收现比率_环比",
                同比: "主营业务收现比率_同比",
            },
            operatingFlow: {
                value: "经营活动产生的现金流量净额",
                环比: "经营活动产生的现金流量净额_环比",
                同比: "经营活动产生的现金流量净额_同比",
            },
            netProfitRatio: {
                value: "经营活动现金流净额与净利润比率",
                环比: "经营活动现金流净额与净利润比率_环比",
                同比: "经营活动现金流净额与净利润比率_同比",
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
                <CardTitle>经营活动分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间经营活动相关指标分析`}</span>
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
                    defaultValue="cashRatio"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="cashRatio">
                            主营业务收现比率
                        </TabsTrigger>
                        <TabsTrigger value="operatingFlow">
                            经营活动现金流量
                        </TabsTrigger>
                        <TabsTrigger value="netProfitRatio">
                            现金流净额/净利润
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cashRatio">
                        <ChartCard
                            data={getData("cashRatio")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="cashRatio" />
                    </TabsContent>

                    <TabsContent value="operatingFlow">
                        <ChartCard
                            data={getData("operatingFlow")}
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                            isAmount
                            unit="亿"
                        />
                        <MetricDescription type="operatingFlow" />
                    </TabsContent>

                    <TabsContent value="netProfitRatio">
                        <ChartCard
                            data={getData("netProfitRatio")}
                            isPercentage
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                        />
                        <MetricDescription type="netProfitRatio" />
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

// 修改导出组件
export default function OperatingAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <OperatingContent />
            </Suspense>
        </ErrorBoundary>
    );
}
