import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface TimelineData {
  timestamp: string;
  volume: number;
  riskScore: number;
  anomalies: number;
}

interface TransactionTimelineProps {
  data?: TimelineData[];
}

export function TransactionTimeline({ data }: TransactionTimelineProps) {
  // Mock data if no data provided
  const mockData: TimelineData[] = [
    { timestamp: '00:00', volume: 45, riskScore: 20, anomalies: 0 },
    { timestamp: '02:00', volume: 23, riskScore: 15, anomalies: 0 },
    { timestamp: '04:00', volume: 12, riskScore: 10, anomalies: 0 },
    { timestamp: '06:00', volume: 67, riskScore: 35, anomalies: 1 },
    { timestamp: '08:00', volume: 134, riskScore: 25, anomalies: 0 },
    { timestamp: '10:00', volume: 189, riskScore: 40, anomalies: 2 },
    { timestamp: '12:00', volume: 156, riskScore: 30, anomalies: 1 },
    { timestamp: '14:00', volume: 278, riskScore: 85, anomalies: 5 },
    { timestamp: '16:00', volume: 345, riskScore: 75, anomalies: 3 },
    { timestamp: '18:00', volume: 298, riskScore: 60, anomalies: 2 },
    { timestamp: '20:00', volume: 234, riskScore: 45, anomalies: 1 },
    { timestamp: '22:00', volume: 156, riskScore: 25, anomalies: 0 },
  ];

  const displayData = data || mockData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-glass-background border border-glass-border rounded-lg p-3 backdrop-blur-sm">
          <p className="text-foreground font-medium">{`Time: ${label}`}</p>
          <p className="text-quantum-green">{`Volume: ${payload[0].value} transactions`}</p>
          <p className="text-blue-400">{`Risk Score: ${payload[1]?.value || 0}`}</p>
          {payload[2] && (
            <p className="text-red-400">{`Anomalies: ${payload[2].value}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Timeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-quantum-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">24h</p>
              <p className="text-sm text-muted-foreground">Analysis Period</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">345</p>
              <p className="text-sm text-muted-foreground">Peak Volume</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-sm text-muted-foreground">Max Anomalies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Volume Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Transaction Volume Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(0, 255, 136)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(0, 255, 136)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="timestamp" 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="rgb(0, 255, 136)"
                fillOpacity={1}
                fill="url(#volumeGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Score Timeline */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Risk Score & Anomaly Timeline</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="timestamp" 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="riskScore"
                stroke="rgb(59, 130, 246)"
                strokeWidth={2}
                dot={{ fill: 'rgb(59, 130, 246)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'rgb(59, 130, 246)', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="anomalies"
                stroke="rgb(239, 68, 68)"
                strokeWidth={2}
                dot={{ fill: 'rgb(239, 68, 68)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'rgb(239, 68, 68)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}