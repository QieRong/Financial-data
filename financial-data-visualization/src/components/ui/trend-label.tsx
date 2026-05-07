import { TrendingUp, TrendingDown } from 'lucide-react'

export interface TrendLabelProps {
  value: number
  type: '环比' | '同比'
  invertColors?: boolean
}

export function TrendLabel({ value, type, invertColors = false }: TrendLabelProps) {
  const isPositive = value >= 0;
  const colorClass = invertColors
    ? isPositive ? 'text-red-500' : 'text-green-500'
    : isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div className="flex items-center gap-1">
      <span className="font-medium">{type}:</span>
      <span className={`flex items-center ${colorClass}`}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        {value >= 0 ? 
          <TrendingUp className="h-4 w-4 ml-1" /> : 
          <TrendingDown className="h-4 w-4 ml-1" />
        }
      </span>
    </div>
  )
} 
