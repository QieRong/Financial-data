import {
    Bar,
    Line,
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Legend,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { DataSummary } from "./data-summary";

interface ChartCardProps {
    data: Array<{
        period: string;
        value: number;
        环比?: number;
        同比: number;
    }>;
    isPercentage?: boolean;
    isAmount?: boolean;
    unit?: "亿" | "万";
    invertColors?: boolean;
    showMoM?: boolean;
    rotateLabel?: boolean;
}

export function ChartCard({
    data,
    isPercentage = false,
    isAmount = false,
    unit,
    invertColors = false,
    showMoM = true,
    rotateLabel = false,
}: ChartCardProps) {
    const formatValue = (value: number) => {
        if (unit === "亿") {
            return `${(value / 100000000).toFixed(2)}亿`;
        } else if (unit === "万") {
            return `${(value / 10000).toFixed(2)}万`;
        }
        return value.toFixed(2);
    };

    return (
        <div className="space-y-2">
            <div className="w-full h-[400px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 50, bottom: rotateLabel ? 50 : 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            padding={{ left: 30, right: 30 }}
                            tick={(props) => {
                                const { x, y, payload } = props;
                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        <text
                                            x={0}
                                            y={0}
                                            dy={rotateLabel ? 0 : 10}
                                            dx={rotateLabel ? -10 : 0}
                                            textAnchor={rotateLabel ? "end" : "middle"}
                                            transform={rotateLabel ? "rotate(-45)" : undefined}
                                            fontSize={12}
                                        >
                                            {payload.value}
                                        </text>
                                    </g>
                                );
                            }}
                        />
                        <YAxis
                            yAxisId="left"
                            tickLine={false}
                            axisLine={false}
                            label={{
                                value: isAmount
                                    ? "金额" + (unit ? `(${unit})` : "")
                                    : "比率",
                                angle: -90,
                                position: "insideLeft",
                                style: { textAnchor: "middle" },
                                offset: -35,
                            }}
                            tickFormatter={
                                isPercentage
                                    ? (value) => `${value.toFixed(2)}%`
                                    : unit
                                    ? (value) => formatValue(value)
                                    : undefined
                            }
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            label={{
                                value: "变化率(%)",
                                angle: 90,
                                position: "insideRight",
                                style: { textAnchor: "middle" },
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                            }}
                            formatter={(value: number, name: string) => {
                                if (name === "数值") {
                                    if (isPercentage) {
                                        return [`${value.toFixed(2)}%`, name];
                                    }
                                    return [formatValue(value), name];
                                }
                                return [`${value.toFixed(2)}%`, name];
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            wrapperStyle={{
                                paddingBottom: "20px",
                            }}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="value"
                            fill="#8884d8"
                            name="数值"
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                            maxBarSize={60}
                        />
                        {showMoM && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="环比"
                                stroke="#82ca9d"
                                name="环比(%)"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                connectNulls
                            />
                        )}
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="同比"
                            stroke="#ff7300"
                            name="同比(%)"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            connectNulls
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <DataSummary
                data={data}
                isPercentage={isPercentage}
                unit={unit}
                invertColors={invertColors}
                showMoM={showMoM}
            />
        </div>
    );
}
