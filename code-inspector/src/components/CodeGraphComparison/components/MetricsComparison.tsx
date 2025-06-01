import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricComparison } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface MetricsComparisonProps {
  metrics: MetricComparison[];
}

export const MetricsComparison = ({ metrics }: MetricsComparisonProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrik Karşılaştırması</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="originalValue" fill="#64748b" name="Orijinal" />
              <Bar dataKey="comparedValue" fill="#ef4444" name="Karşılaştırılan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="font-medium">{metric.metric}</span>
              <div className="flex items-center space-x-4">
                <span className="text-slate-600">{metric.originalValue.toFixed(2)}</span>
                <span className="text-red-500">{metric.comparedValue.toFixed(2)}</span>
                <span className={`${metric.percentageChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {metric.percentageChange > 0 ? '+' : ''}{metric.percentageChange.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 