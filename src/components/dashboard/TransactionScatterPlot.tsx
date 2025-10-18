import { Card } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";

interface Transaction {
  date: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  transactionId?: string;
}

interface TransactionScatterPlotProps {
  transactions?: Transaction[];
}

// Risk level color mapping using semantic tokens
const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'hsl(var(--quantum-green))';
    case 'medium':
      return 'hsl(var(--warning))';
    case 'high':
      return 'hsl(var(--danger))';
    default:
      return 'hsl(var(--quantum-green))';
  }
};

// Mock data generator
const generateMockData = (): Transaction[] => {
  const data: Transaction[] = [];
  const startDate = new Date('2024-08-30');
  
  for (let i = 0; i < 150; i++) {
    const daysOffset = Math.floor(Math.random() * 45);
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysOffset);
    
    // Generate realistic transaction amounts with some outliers
    let amount: number;
    let riskLevel: 'low' | 'medium' | 'high';
    
    const riskRoll = Math.random();
    if (riskRoll > 0.85) {
      // High risk - large amounts
      amount = Math.random() * 230000 + 15000;
      riskLevel = 'high';
    } else if (riskRoll > 0.65) {
      // Medium risk
      amount = Math.random() * 8000 + 3000;
      riskLevel = 'medium';
    } else {
      // Low risk - small amounts
      amount = Math.random() * 2000 + 100;
      riskLevel = 'low';
    }
    
    data.push({
      date: date.toISOString(),
      amount: Math.round(amount),
      riskLevel,
      transactionId: `TXN-${String(i + 1).padStart(6, '0')}`
    });
  }
  
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card p-3 border border-glass-border rounded-lg shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">
          {format(new Date(data.date), 'MMM dd, yyyy HH:mm')}
        </p>
        <p className="text-sm font-semibold text-foreground">
          ${data.amount.toLocaleString()}
        </p>
        <p className="text-xs mt-1">
          <span className="text-muted-foreground">Risk: </span>
          <span 
            className="font-medium capitalize"
            style={{ color: getRiskColor(data.riskLevel) }}
          >
            {data.riskLevel}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function TransactionScatterPlot({ transactions }: TransactionScatterPlotProps) {
  const displayData = transactions && transactions.length > 0 ? transactions : generateMockData();

  // Group data by risk level for rendering
  const lowRiskData = displayData.filter(t => t.riskLevel === 'low');
  const mediumRiskData = displayData.filter(t => t.riskLevel === 'medium');
  const highRiskData = displayData.filter(t => t.riskLevel === 'high');

  return (
    <Card className="glass-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">Transaction Scatter</h3>
        <p className="text-sm text-muted-foreground">
          Visualizing {displayData.length} transactions by amount and risk level
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 80 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--glass-border))" 
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            type="category"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={{ stroke: 'hsl(var(--glass-border))' }}
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStartEnd"
          />
          <YAxis
            dataKey="amount"
            type="number"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={{ stroke: 'hsl(var(--glass-border))' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Render low risk transactions */}
          <Scatter 
            data={lowRiskData} 
            fill={getRiskColor('low')}
            opacity={0.8}
          />
          
          {/* Render medium risk transactions */}
          <Scatter 
            data={mediumRiskData} 
            fill={getRiskColor('medium')}
            opacity={0.8}
          />
          
          {/* Render high risk transactions */}
          <Scatter 
            data={highRiskData} 
            fill={getRiskColor('high')}
            opacity={0.8}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getRiskColor('low') }}
          />
          <span className="text-muted-foreground">Low Risk ({lowRiskData.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getRiskColor('medium') }}
          />
          <span className="text-muted-foreground">Medium Risk ({mediumRiskData.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getRiskColor('high') }}
          />
          <span className="text-muted-foreground">High Risk ({highRiskData.length})</span>
        </div>
      </div>
    </Card>
  );
}
