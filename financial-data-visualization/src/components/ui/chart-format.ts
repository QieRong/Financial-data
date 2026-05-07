export type AmountUnit = "亿" | "万" | "次" | "倍";

export function formatNumber(value: number) {
    return value.toFixed(2);
}

export function formatPercentRatio(value: number) {
    return `${formatNumber(value * 100)}%`;
}

export function formatSignedPercentRatio(value: number) {
    return `${value >= 0 ? "+" : ""}${formatPercentRatio(value)}`;
}

export function formatAmountByUnit(value: number, unit?: AmountUnit) {
    if (unit === "亿") {
        return `${formatNumber(value / 100000000)}亿`;
    }
    if (unit === "万") {
        return `${formatNumber(value / 10000)}万`;
    }
    if (unit === "次" || unit === "倍") {
        return `${formatNumber(value)}${unit}`;
    }
    return formatNumber(value);
}
