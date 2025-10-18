import { useEffect, useRef } from "react";
import { Network } from "lucide-react";

interface Node {
  id: string;
  address: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  amount: number;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
}

export function NetworkGraph({ nodes, links }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="relative w-full h-96 flex items-center justify-center border border-glass-border rounded-lg bg-glass-background">
        <div className="text-center space-y-2">
          <Network className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No transaction data available</p>
          <p className="text-sm text-muted-foreground">Upload transactions to see network graph</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Position nodes in a circular layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    function draw() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);

      // Draw links
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.lineWidth = 1;
      
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        if (!node.x || !node.y) return;
        
        const nodeRadius = Math.sqrt(node.amount / 1000) + 5;
        
        // Risk level colors
        const colors = {
          low: '#00ff88',
          medium: '#fbbf24',
          high: '#ef4444'
        };
        
        ctx.fillStyle = colors[node.riskLevel];
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Node border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Node label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.address, node.x, node.y + nodeRadius + 15);
      });
    }

    let animationId: number;
    
    function animate() {
      draw();
      animationId = requestAnimationFrame(animate);
    }
    
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [nodes, links]);

  return (
    <div className="relative w-full h-96">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg border border-glass-border"
        style={{ background: 'var(--glass-background)' }}
      />
      <div className="absolute top-4 left-4 bg-glass-background/80 backdrop-blur-sm border border-glass-border rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm">
          <Network className="w-4 h-4 text-quantum-green" />
          <span className="text-foreground font-medium">Network Analysis</span>
        </div>
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-quantum-green"></div>
            <span className="text-muted-foreground">Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-muted-foreground">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span className="text-muted-foreground">High Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}