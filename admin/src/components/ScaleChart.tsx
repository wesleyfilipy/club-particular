import React, { useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScalePoint } from '../services/offersService';

interface ScaleChartProps {
  data: ScalePoint[];
  height?: number;
}

const WIDTH = 600;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

const formatDay = (date: string) => {
  const [, m, d] = date.split('-');
  return `${d}/${m}`;
};

/** Gráfico de linha: anúncios ativos por dia na Biblioteca de Anúncios do Meta */
export const ScaleChart: React.FC<ScaleChartProps> = ({ data, height = 200 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#090a0f] border border-[#282c3d] text-center text-xs text-gray-400">
        Ainda não há dados de escala para esta oferta.
      </div>
    );
  }

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const maxAds = Math.max(...data.map((p) => p.ads), 1);
  const niceMax = Math.ceil(maxAds / 5) * 5 || 5;

  const x = (i: number) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;

  const linePath = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.ads)}`).join(' ');
  const areaPath = `${linePath} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const gridValues = [0, niceMax / 2, niceMax];

  // Mostra no máximo ~6 rótulos de data no eixo X
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  const first = data[0].ads;
  const last = data[data.length - 1].ads;
  const delta = last - first;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    data.forEach((_, i) => {
      if (Math.abs(x(i) - svgX) < Math.abs(x(nearest) - svgX)) nearest = i;
    });
    setHover(nearest);
  };

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Anúncios ativos hoje</span>
          <span className="text-2xl font-extrabold text-white">{last}</span>
        </div>
        <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
          <TrendIcon className="w-4 h-4 text-[#d4af37]" />
          {delta > 0 ? `+${delta}` : delta} anúncios em {data.length} dia{data.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label={`Anúncios ativos por dia: de ${first} para ${last}`}
        >
          {gridValues.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(v)} y2={y(v)} stroke="#282c3d" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#9ca3af">
                {Math.round(v)}
              </text>
            </g>
          ))}

          {data.map((p, i) =>
            i % labelStep === 0 || i === data.length - 1 ? (
              <text key={p.date} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="#9ca3af">
                {formatDay(p.date)}
              </text>
            ) : null
          )}

          <path d={areaPath} fill="#d4af37" fillOpacity={0.08} />
          <path d={linePath} fill="none" stroke="#d4af37" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {data.map((p, i) => (
            <circle
              key={p.date}
              cx={x(i)}
              cy={y(p.ads)}
              r={hover === i ? 5 : 4}
              fill="#d4af37"
              stroke="#12141d"
              strokeWidth={2}
            />
          ))}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>

        {hovered && hover !== null && (
          <div
            className="absolute pointer-events-none px-3 py-2 rounded-xl bg-[#090a0f] border border-[#282c3d] shadow-xl text-xs whitespace-nowrap"
            style={{
              left: `${(x(hover) / WIDTH) * 100}%`,
              top: 0,
              transform: `translateX(${hover > data.length / 2 ? '-110%' : '10%'})`,
            }}
          >
            <span className="block text-gray-400">{formatDay(hovered.date)}</span>
            <span className="block font-extrabold text-white">{hovered.ads} anúncios ativos</span>
          </div>
        )}
      </div>
    </div>
  );
};
