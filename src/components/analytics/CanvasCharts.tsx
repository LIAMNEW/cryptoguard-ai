import { useEffect, useRef, useState } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

Chart.register(...registerables);

interface CanvasChartsProps {
  riskData: { low: number; medium: number; high: number; critical: number };
  timelineData: Array<{ date: string; volume: number; count: number }>;
}

export function CanvasCharts({ riskData, timelineData }: CanvasChartsProps) {
  const riskChartRef = useRef<HTMLCanvasElement>(null);
  const timelineChartRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    // Cleanup previous charts
    chartInstances.current.forEach(chart => chart.destroy());
    chartInstances.current = [];

    if (!riskChartRef.current || !timelineChartRef.current) return;

    const ctx1 = riskChartRef.current.getContext('2d');
    const ctx2 = timelineChartRef.current.getContext('2d');

    if (!ctx1 || !ctx2) return;

    // Risk Distribution Doughnut Chart
    const riskConfig: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
        datasets: [{
          data: [riskData.low, riskData.medium, riskData.high, riskData.critical],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',  // green
            'rgba(234, 179, 8, 0.8)',   // yellow
            'rgba(249, 115, 22, 0.8)',  // orange
            'rgba(239, 68, 68, 0.8)'    // red
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(234, 179, 8, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              padding: 15,
              font: { size: 12 }
            }
          },
          title: {
            display: true,
            text: 'Risk Distribution',
            color: 'rgba(255, 255, 255, 0.9)',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    };

    // Timeline Bar Chart
    const timelineConfig: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: timelineData.map(d => d.date),
        datasets: [{
          label: 'Transaction Volume',
          data: timelineData.map(d => d.volume),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          yAxisID: 'y'
        }, {
          label: 'Transaction Count',
          data: timelineData.map(d => d.count),
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 2,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              padding: 15,
              font: { size: 12 }
            }
          },
          title: {
            display: true,
            text: 'Transaction Timeline',
            color: 'rgba(255, 255, 255, 0.9)',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            title: {
              display: true,
              text: 'Volume',
              color: 'rgba(255, 255, 255, 0.8)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
            grid: { display: false },
            title: {
              display: true,
              text: 'Count',
              color: 'rgba(255, 255, 255, 0.8)'
            }
          }
        }
      }
    };

    const chart1 = new Chart(ctx1, riskConfig);
    const chart2 = new Chart(ctx2, timelineConfig);

    chartInstances.current.push(chart1, chart2);
    setLoading(false);

    return () => {
      chartInstances.current.forEach(chart => chart.destroy());
      chartInstances.current = [];
    };
  }, [riskData, timelineData]);

  if (loading && timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-quantum-green" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card p-6">
        <div style={{ height: '400px' }}>
          <canvas ref={riskChartRef}></canvas>
        </div>
      </Card>
      <Card className="glass-card p-6">
        <div style={{ height: '400px' }}>
          <canvas ref={timelineChartRef}></canvas>
        </div>
      </Card>
    </div>
  );
}
