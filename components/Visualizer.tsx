
import React from 'react';
import { ModelType, SimulationParams, SimulationState } from '../types';

interface VisualizerProps {
  type: ModelType;
  params: SimulationParams;
  state: SimulationState;
}

const SCALE = 50; 

const Arrow = ({ x, y, angle, length, color, label }: any) => {
  if (Math.abs(length) < 0.2) return null;
  const rad = (angle * Math.PI) / 180;
  const lenPx = Math.min(Math.abs(length) * 4, 60); 
  const x2 = x + lenPx * Math.cos(rad);
  const y2 = y - lenPx * Math.sin(rad); 
  
  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" markerEnd={`url(#arrowhead-${color})`} />
      <text x={x2} y={y2} fill={color} fontSize="11" fontWeight="bold" dy="-4" textAnchor="middle">{label}</text>
    </g>
  );
};

const Visualizer: React.FC<VisualizerProps> = ({ type, params, state }) => {
  const width = 800;
  const height = 360;
  const groundY = 280;
  const startX = 100;

  const slopeAngle = type === 'single' ? params.theta : (type === 'belt' ? params.theta : 0);
  const xToPx = (val: number) => val * SCALE;
  
  const blockW = 50;
  const blockH = 35;
  const plankW = xToPx(params.L_plank || 4);
  const plankH = 20;

  const blockPx = xToPx(state.x1);
  const plankPx = xToPx(state.x2);

  // 相对位移百分比
  const relPos = state.x1 - state.x2;
  const relPercent = (relPos / (params.L_plank / 2)) * 100;

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative shadow-2xl">
      <div className="absolute top-4 left-6 z-10 space-y-1">
         <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
           {type === 'plank' ? '板块模型' : type === 'belt' ? '传送带模型' : '单体模型'}
         </span>
         <div className={`text-xl font-black italic ${state.status.includes('脱离') ? 'text-red-500' : 'text-green-400'}`}>
           {state.status}
         </div>
      </div>

      <div className="absolute top-4 right-6 text-slate-300 text-right z-10 font-mono text-xs space-y-0.5 bg-black/40 p-2 rounded backdrop-blur-sm">
        <div>时间: <span className="text-white">{state.t.toFixed(2)}s</span></div>
        <div>滑块 v1: <span className="text-blue-400">{state.v1.toFixed(2)}m/s</span></div>
        {type === 'plank' && <div>木板 v2: <span className="text-orange-400">{state.v2.toFixed(2)}m/s</span></div>}
        {type === 'plank' && <div>相对位移: <span className={Math.abs(relPercent) > 80 ? 'text-red-400' : 'text-slate-400'}>{relPos.toFixed(2)}m</span></div>}
      </div>

      {type === 'plank' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-1.5 bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
           <div 
             className={`h-full transition-all duration-300 ${Math.abs(relPercent) > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
             style={{ width: `${Math.abs(relPercent)}%`, marginLeft: relPercent > 0 ? '0' : 'auto' }}
           />
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white/30" />
        </div>
      )}
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <marker id="arrowhead-#10b981" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#10b981" /></marker>
          <marker id="arrowhead-#ef4444" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker>
          <marker id="arrowhead-#6366f1" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" /></marker>
          <marker id="arrowhead-#f59e0b" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" /></marker>
        </defs>

        <g transform={`translate(${startX}, ${groundY}) rotate(${-slopeAngle})`}>
          <line x1="-100" y1="0" x2="2000" y2="0" stroke="#475569" strokeWidth="4" />
          
          {type === 'belt' && (
             <g>
                {[...Array(20)].map((_, i) => (
                    <circle key={i} cx={((i * 100 + state.t * params.v_belt * SCALE) % 1200) - 200} cy="6" r="3" fill="#334155" />
                ))}
             </g>
          )}

          {type === 'plank' && (
             <g transform={`translate(${plankPx - plankW/2}, ${-plankH})`}>
                <rect width={plankW} height={plankH} fill="#5d4037" stroke="#3e2723" strokeWidth="2" rx="2"/>
                <text x={plankW/2} y={plankH/2} fill="#d7ccc8" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold">M</text>
                
                <g transform={`translate(${plankW/2}, ${plankH/2})`}>
                  <Arrow angle={90} length={state.forces.gravity2} color="#10b981" label="Mg" />
                  <Arrow angle={-90} length={state.forces.normal2} color="#6366f1" label="N2" />
                  <Arrow angle={state.forces.friction2 > 0 ? 0 : 180} length={Math.abs(state.forces.friction2)} color="#ef4444" label="f2" />
                  <Arrow angle={0} length={state.forces.external2} color="#f59e0b" label="F2" />
                  {/* 反作用力 */}
                  <Arrow angle={90} length={state.forces.normal1} color="#6366f1" label="N1'" />
                  <Arrow angle={-state.forces.friction1 > 0 ? 0 : 180} length={Math.abs(state.forces.friction1)} color="#ef4444" label="f1'" />
                </g>
             </g>
          )}

          <g transform={`translate(${blockPx - blockW/2}, ${-blockH - (type === 'plank' ? plankH : 0)})`}>
            <rect width={blockW} height={blockH} fill="#1e88e5" stroke="#0d47a1" strokeWidth="2" rx="4" />
            <text x={blockW/2} y={blockH/2} fill="white" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold">m</text>
            
            <g transform={`translate(${blockW/2}, ${blockH/2})`}>
              <Arrow angle={90 + slopeAngle} length={state.forces.gravity1} color="#10b981" label="mg" />
              <Arrow angle={-90} length={state.forces.normal1} color="#6366f1" label="N1" />
              <Arrow angle={state.forces.friction1 > 0 ? 0 : 180} length={Math.abs(state.forces.friction1)} color="#ef4444" label="f1" />
              <Arrow angle={-params.F_angle} length={state.forces.external1 || params.F_mag} color="#f59e0b" label="F1" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Visualizer;
