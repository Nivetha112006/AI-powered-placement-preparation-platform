import { motion } from 'motion/react';

interface RadialProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  id?: string;
}

export function RadialProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  colorClass = 'stroke-indigo-400',
  id = 'radial-progress'
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }} id={`${id}-container`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-800 fill-none"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle with motion */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`fill-none ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          id={id}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-zinc-100 font-sans">
          {percentage}%
        </span>
        <span className="text-[9px] text-zinc-500 font-mono font-medium uppercase tracking-wider">
          Score
        </span>
      </div>
    </div>
  );
}

interface AreaChartProps {
  data: number[];
  labels: string[];
  height?: number;
  id?: string;
}

export function CustomAreaChart({ data, labels, height = 180, id = 'area-chart' }: AreaChartProps) {
  const maxVal = Math.max(...data, 100);
  const padding = 30;
  const chartHeight = height - padding * 2;
  
  // Calculate points for the SVG path
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1 || 1)) * (360 - padding * 2);
    const y = height - padding - (val / maxVal) * chartHeight;
    return { x, y };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') 
    : '';

  // Filled area path
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="w-full" id={`${id}-container`}>
      <svg viewBox={`0 0 360 ${height}`} className="w-full h-auto overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * chartHeight;
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx} className="opacity-40">
              <line 
                x1={padding} 
                y1={y} 
                x2={360 - padding} 
                y2={y} 
                className="stroke-zinc-850" 
                strokeDasharray="4 4" 
              />
              <text 
                x={padding - 8} 
                y={y + 4} 
                className="fill-zinc-500 text-[10px] font-mono font-medium text-right"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {areaD && (
          <motion.path
            d={areaD}
            fill="url(#area-gradient)"
            className="opacity-25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1 }}
          />
        )}

        {/* Main Line */}
        {pathD && (
          <motion.path
            d={pathD}
            fill="none"
            className="stroke-indigo-400"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {/* Interactive Dots */}
        {points.map((p, idx) => (
          <g key={idx}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-indigo-400 stroke-white dark:stroke-zinc-950 stroke-2 cursor-pointer"
              whileHover={{ r: 6 }}
            />
            <text
              x={p.x}
              y={height - padding + 16}
              className="fill-zinc-400 text-[9px] font-mono font-medium"
              textAnchor="middle"
            >
              {labels[idx]}
            </text>
            <text
              x={p.x}
              y={p.y - 8}
              className="fill-indigo-400 text-[9px] font-sans font-bold"
              textAnchor="middle"
            >
              {data[idx]}
            </text>
          </g>
        ))}

        {/* Gradients */}
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

interface SkillGapChartProps {
  skills: Array<{ skill: string; currentLevel: number; requiredLevel: number }>;
  id?: string;
}

export function SkillGapChart({ skills, id = 'skill-gap-chart' }: SkillGapChartProps) {
  return (
    <div className="space-y-4 w-full" id={id}>
      {skills.map((item, idx) => {
        const currentPercentage = Math.round((item.currentLevel / 10) * 100);
        const requiredPercentage = Math.round((item.requiredLevel / 10) * 100);
        
        return (
          <div key={idx} className="space-y-1" id={`${id}-item-${idx}`}>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300 font-sans">{item.skill}</span>
              <span className="text-zinc-500 font-mono text-[10px]">
                Current: <b className="text-indigo-400">{item.currentLevel}</b> / Required: <b className="text-zinc-300">{item.requiredLevel}</b>
              </span>
            </div>
            
            <div className="relative h-3 w-full bg-zinc-850 rounded-full overflow-hidden">
              {/* Required Marker Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 opacity-70"
                style={{ left: `${requiredPercentage}%` }}
                title={`Required level: ${item.requiredLevel}`}
              />
              
              {/* Current Level Fill with Motion */}
              <motion.div 
                className="absolute top-0 bottom-0 bg-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentPercentage}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
