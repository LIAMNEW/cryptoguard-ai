import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface RiskPieChartProps {
  riskData: { low: number; medium: number; high: number; critical: number };
  onSegmentClick?: (riskLevel: string) => void;
}

export function RiskPieChart({ riskData, onSegmentClick }: RiskPieChartProps) {
  const data = [
    { name: 'Low Risk', value: riskData.low, color: 'hsl(var(--quantum-green))' },
    { name: 'Medium Risk', value: riskData.medium, color: '#fbbf24' },
    { name: 'High Risk', value: riskData.high, color: '#f97316' },
    { name: 'Critical Risk', value: riskData.critical, color: '#ef4444' }
  ];

  const handleClick = (entry: any) => {
    const riskLevel = entry.name.split(' ')[0].toLowerCase();
    onSegmentClick?.(riskLevel);
  };

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
