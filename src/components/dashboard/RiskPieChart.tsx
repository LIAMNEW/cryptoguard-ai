import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Shield } from "lucide-react";

interface RiskPieChartProps {
  riskData: {
    low: number;
    medium: number;
    high: number;
  };
}

const COLORS = {
  low: 'hsl(var(--quantum-green))',
  medium: 'hsl(var(--warning))',
  high: 'hsl(var(--danger))'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="glass-card p-3 border border-glass-border rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-foreground capitalize">
          {data.name} Risk
        </p>
        <p className="text-lg font-bold" style={{ color: data.payload.fill }}>
          {data.value} transactions
        </p>
        <p className="text-xs text-muted-foreground">
          {data.payload.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

export function RiskPieChart({ riskData }: RiskPieChartProps) {
  const total = riskData.low + riskData.medium + riskData.high;
  
  const chartData = [
    { 
      name: 'Low', 
      value: riskData.low, 
      percentage: total > 0 ? ((riskData.low / total) * 100).toFixed(1) : 0 
    },
    { 
      name: 'Medium', 
      value: riskData.medium, 
      percentage: total > 0 ? ((riskData.medium / total) * 100).toFixed(1) : 0 
    },
    { 
      name: 'High', 
      value: riskData.high, 
      percentage: total > 0 ? ((riskData.high / total) * 100).toFixed(1) : 0 
    }
  ].filter(item => item.value > 0);

  return (
    <Card className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-quantum-green" />
        <h3 className="text-lg font-semibold text-foreground">Risk Distribution</h3>
      </div>
      
      {total === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No transaction data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-glass-border">
            <div className="text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS.low }} />
              <p className="text-2xl font-bold text-foreground">{riskData.low}</p>
              <p className="text-xs text-muted-foreground">Low Risk</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS.medium }} />
              <p className="text-2xl font-bold text-foreground">{riskData.medium}</p>
              <p className="text-xs text-muted-foreground">Medium Risk</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS.high }} />
              <p className="text-2xl font-bold text-foreground">{riskData.high}</p>
              <p className="text-xs text-muted-foreground">High Risk</p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
