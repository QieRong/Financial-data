import { TrendingUp, TrendingDown } from "lucide-react";
import { TrendLabel } from "./trend-label";
import { formatAmount } from "@/app/lib/utils";

interface DataSummaryProps {
    data: Array<{
        period: string;
        value: number;
        环比?: number;
        同比: number;
    }>;
    isPercentage?: boolean;
    unit?: "亿" | "万";
    invertColors?: boolean;
    showMoM?: boolean;
}

export function DataSummary({
    data,
    isPercentage = false,
    unit,
    invertColors = false,
    showMoM = true,
}: DataSummaryProps) {
    const latestData = data[data.length - 1];
    const previousData = data[data.length - 2];

    if (!latestData?.value || !previousData?.value) {
        return (
            <div className="mt-4 p-3 border rounded-lg bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium min-w-[4.5rem]">
                            最新数值:
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="font-semibold">-</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const valueChange =
        ((latestData.value - previousData.value) / previousData.value) * 100;

    const formatValue = (value: number) => {
        if (isPercentage) {
            return `${value.toFixed(2)}%`;
        }
        if (unit) {
            const absValue = Math.abs(value);
            const formattedAbsValue = formatAmount(absValue);
            return value < 0 ? `-${formattedAbsValue}` : formattedAbsValue;
        }
        return value.toFixed(2);
    };

    return (
        <div className="mt-4 p-3 border rounded-lg bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-medium min-w-[4.5rem]">
                        最新数值:
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="font-semibold">
                            {formatValue(latestData.value)}
                        </span>
                        <span
                            className={`flex items-center text-sm ${
                                valueChange >= 0
                                    ? "text-green-500"
                                    : "text-red-500"
                            }`}
                        >
                            ({valueChange >= 0 ? "+" : ""}
                            {valueChange.toFixed(2)}%)
                            {valueChange >= 0 ? (
                                <TrendingUp className="h-3 w-3 ml-1" />
                            ) : (
                                <TrendingDown className="h-3 w-3 ml-1" />
                            )}
                        </span>
                    </div>
                </div>
                {showMoM && latestData.环比 !== undefined && (
                    <div className="flex items-center gap-2">
                        <span className="font-medium min-w-[4.5rem]">
                            环比变化:
                        </span>
                        <TrendLabel
                            value={latestData.环比}
                            type="环比"
                            invertColors={invertColors}
                        />
                    </div>
                )}
                {latestData.同比 !== undefined && (
                    <div className="flex items-center gap-2">
                        <span className="font-medium min-w-[4.5rem]">
                            同比变化:
                        </span>
                        <TrendLabel
                            value={latestData.同比}
                            type="同比"
                            invertColors={invertColors}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
