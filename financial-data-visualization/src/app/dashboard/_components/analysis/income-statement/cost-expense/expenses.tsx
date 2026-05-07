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
interface ExpensesData {
    报告日期: string;
    销售费用: number;
    销售费用_环比: number;
    销售费用_同比: number;
    管理费用: number;
    管理费用_环比: number;
    管理费用_同比: number;
    研发费用: number;
    研发费用_环比: number;
    研发费用_同比: number;
    财务费用: number;
    财务费用_环比: number;
    财务费用_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<ExpensesData[]> =>
    fetchReportData<ExpensesData>("income", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<ExpensesData[]> =>
    fetchReportData<ExpensesData>("income", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<ExpensesData[]> =>
    fetchReportData<ExpensesData>("income", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
    selling: {
        title: "销售费用",
        formula: "销售商品和提供劳务过程中发生的费用",
        description: "反映企业在销售商品和提供劳务过程中发生的各项费用，包括销售人员工资、广告费、运输费等。",
    },
    admin: {
        title: "管理费用",
        formula: "企业行政管理部门发生的费用",
        description: "反映企业行政管理部门为组织和管理生产经营活动而发生的各项费用。",
    },
    rd: {
        title: "研发费用",
        formula: "企业研究开发活动发生的费用",
        description: "反映企业在产品、技术、材料、工艺等研究开发过程中发生的各项费用。",
    },
    financial: {
        title: "财务费用",
        formula: "企业筹集资金和资金使用过程中发生的费用",
        description: "反映企业在筹集资金和资金使用过程中发生的各项费用，包括利息支出、汇兑损益等。",
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
function ExpensesContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("selling");
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
    const getData = (type: keyof typeof METRIC_DESCRIPTIONS) => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        const propertyMap = {
            selling: {
                value: "销售费用",
                环比: "销售费用_环比",
                同比: "销售费用_同比",
            },
            admin: {
                value: "管理费用",
                环比: "管理费用_环比",
                同比: "管理费用_同比",
            },
            rd: {
                value: "研发费用",
                环比: "研发费用_环比",
                同比: "研发费用_同比",
            },
            financial: {
                value: "财务费用",
                环比: "财务费用_环比",
                同比: "财务费用_同比",
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
                <CardTitle>费用分析</CardTitle>
                <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间费用相关指标分析`}</span>
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
                    defaultValue="selling"
                    className="w-full"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="selling">销售费用</TabsTrigger>
                        <TabsTrigger value="admin">管理费用</TabsTrigger>
                        <TabsTrigger value="rd">研发费用</TabsTrigger>
                        <TabsTrigger value="financial">财务费用</TabsTrigger>
                    </TabsList>

                    <TabsContent value="selling">
                        <ChartCard
                            data={getData("selling")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                            invertColors
                        />
                        <MetricDescription type="selling" />
                    </TabsContent>

                    <TabsContent value="admin">
                        <ChartCard
                            data={getData("admin")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                            invertColors
                        />
                        <MetricDescription type="admin" />
                    </TabsContent>

                    <TabsContent value="rd">
                        <ChartCard
                            data={getData("rd")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                            invertColors
                        />
                        <MetricDescription type="rd" />
                    </TabsContent>

                    <TabsContent value="financial">
                        <ChartCard
                            data={getData("financial")}
                            isAmount
                            unit="亿"
                            showMoM={dataType === "quarterly"}
                            rotateLabel
                            invertColors
                        />
                        <MetricDescription type="financial" />
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
export default function ExpensesAnalysis() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingState />}>
                <ExpensesContent />
            </Suspense>
        </ErrorBoundary>
    );
}
