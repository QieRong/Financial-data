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
interface FixedAssetsData {
    报告日期: string;
    固定资产及清理合计: number;
    固定资产及清理合计_环比: number;
    固定资产及清理合计_同比: number;
    固定资产周转率: number;
    固定资产周转率_环比: number;
    固定资产周转率_同比: number;
}

// 获取数据的函数
const fetchPeriodData = (stockCode: string): Promise<FixedAssetsData[]> =>
    fetchReportData<FixedAssetsData>("balance", "period", stockCode);

const fetchQuarterlyData = (stockCode: string): Promise<FixedAssetsData[]> =>
    fetchReportData<FixedAssetsData>("balance", "quarterly", stockCode);

const fetchYearlyData = (stockCode: string): Promise<FixedAssetsData[]> =>
    fetchReportData<FixedAssetsData>("balance", "yearly", stockCode);

// 添加指标说明常量
const METRIC_DESCRIPTIONS = {
  amount: {
    title: "固定资产金额",
    formula: "固定资产及清理合计",
        description: "反映企业固定资产的规模，包括房屋建筑物、机器设备等长期资产的总额。",
  },
  turnover: {
    title: "固定资产周转率",
    formula: "营业收入 ÷ 平均固定资产",
        description: "反映企业固定资产的利用效率，数值越大表示固定资产利用效率越高。",
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

// 修改 FixedAssetsContent 组件
function FixedAssetsContent() {
    const searchParams = useSearchParams();
    const stockCode = searchParams.get("stock")?.replace("sh", "") || "600519";
    const [activeTab, setActiveTab] = useState("amount");
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
    const getData = (type: "amount" | "turnover") => {
        // 对数据进行排序和过滤
        const sortedData = [...currentData]
            .sort((a, b) => a.报告日期.localeCompare(b.报告日期))
            .filter(item => 
                item.报告日期 >= startPeriod && 
                item.报告日期 <= endPeriod
            );

        const propertyMap = {
            amount: {
                value: "固定资产及清理合计",
                环比: "固定资产及清理合计_环比",
                同比: "固定资产及清理合计_同比",
            },
            turnover: {
                value: "固定资产周转率",
                环比: "固定资产周转率_环比",
                同比: "固定资产周转率_同比",
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
        <CardTitle>固定资产分析</CardTitle>
        <CardDescription className="flex justify-between items-center">
                    <span>{`${startPeriod}-${endPeriod}期间固定资产相关指标分析`}</span>
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
            <TabsTrigger value="amount">固定资产金额</TabsTrigger>
            <TabsTrigger value="turnover">固定资产周转</TabsTrigger>
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
                            unit="次"
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
export default function FixedAssetsAnalysis() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingState />}>
                <FixedAssetsContent />
      </Suspense>
    </ErrorBoundary>
  );
} 
