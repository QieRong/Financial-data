import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface RangeSelectorProps {
    periods: string[];  // 所有可选的时间点
    startPeriod: string;
    endPeriod: string;
    onRangeChange: (start: string, end: string) => void;
}

export function RangeSelector({ 
    periods, 
    startPeriod, 
    endPeriod, 
    onRangeChange 
}: RangeSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <Select 
                value={startPeriod} 
                onValueChange={(value) => onRangeChange(value, endPeriod)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="起始时间" />
                </SelectTrigger>
                <SelectContent>
                    {periods.map((period) => (
                        <SelectItem 
                            key={period} 
                            value={period}
                            disabled={period > endPeriod}
                        >
                            {period}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">至</span>
            <Select 
                value={endPeriod} 
                onValueChange={(value) => onRangeChange(startPeriod, value)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="结束时间" />
                </SelectTrigger>
                <SelectContent>
                    {periods.map((period) => (
                        <SelectItem 
                            key={period} 
                            value={period}
                            disabled={period < startPeriod}
                        >
                            {period}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
} 
