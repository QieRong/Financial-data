import { describe, expect, it } from "vitest";
import {
    formatAmountByUnit,
    formatNumber,
    formatPercentRatio,
    formatSignedPercentRatio,
} from "./chart-format";

describe("chart formatting", () => {
    it("formats decimal ratios as percentages", () => {
        expect(formatPercentRatio(0.25)).toBe("25.00%");
        expect(formatPercentRatio(-0.034)).toBe("-3.40%");
        expect(formatPercentRatio(0)).toBe("0.00%");
    });

    it("formats signed decimal ratios as percentages", () => {
        expect(formatSignedPercentRatio(0.12)).toBe("+12.00%");
        expect(formatSignedPercentRatio(-0.12)).toBe("-12.00%");
    });

    it("formats amounts with explicit chart units", () => {
        expect(formatAmountByUnit(123456789, "亿")).toBe("1.23亿");
        expect(formatAmountByUnit(-123456789, "亿")).toBe("-1.23亿");
        expect(formatAmountByUnit(123456789, "万")).toBe("12345.68万");
        expect(formatAmountByUnit(3.456, "次")).toBe("3.46次");
        expect(formatAmountByUnit(2.1, "倍")).toBe("2.10倍");
    });

    it("formats plain numbers without hiding zero", () => {
        expect(formatNumber(1.234)).toBe("1.23");
        expect(formatNumber(0)).toBe("0.00");
    });
});
