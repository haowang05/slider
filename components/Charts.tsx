
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataPoint, ModelType } from '../types';
import { COLORS } from '../constants';

interface ChartsProps {
  data: DataPoint[];
  modelType: ModelType;
}

const Charts: React.FC<ChartsProps> = ({ data, modelType }) => {
  const displayData = data.length > 300 ? data.filter((_, i) => i % Math.ceil(data.length / 300) === 0) : data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      
      {/* v-t Chart */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 h-64">
        <h3 className="text-white text-xs mb-2 font-bold uppercase tracking-wider text-slate-400">速度-时间图 (v-t)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="v1" stroke={COLORS.block} dot={false} name="滑块速度 v1" strokeWidth={2} />
            {(modelType === 'plank' || modelType === 'belt') && (
               <Line type="monotone" dataKey="v2" stroke={COLORS.plank} dot={false} name={modelType === 'belt' ? "带速" : "木板速度 v2"} strokeWidth={2} strokeDasharray="5 5" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* s-t Chart (Distance) */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 h-64">
        <h3 className="text-white text-xs mb-2 font-bold uppercase tracking-wider text-slate-400">路程-时间图 (s-t)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="s1" stroke={COLORS.block} dot={false} name="滑块路程 s1" strokeWidth={2} />
            {modelType === 'plank' && (
               <Line type="monotone" dataKey="s2" stroke={COLORS.plank} dot={false} name="木板路程 s2" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* a-t Chart */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 h-64">
        <h3 className="text-white text-xs mb-2 font-bold uppercase tracking-wider text-slate-400">加速度-时间图 (a-t)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="stepAfter" dataKey="a1" stroke={COLORS.block} dot={false} name="滑块加速度 a1" strokeWidth={2} />
            {modelType === 'plank' && (
               <Line type="stepAfter" dataKey="a2" stroke={COLORS.plank} dot={false} name="木板加速度 a2" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* x-t Chart (Displacement) */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 h-64">
        <h3 className="text-white text-xs mb-2 font-bold uppercase tracking-wider text-slate-400">位移-时间图 (x-t)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="x1" stroke={COLORS.block} dot={false} name="滑块坐标 x1" strokeWidth={2} />
            {modelType === 'plank' && (
               <Line type="monotone" dataKey="x2" stroke={COLORS.plank} dot={false} name="木板坐标 x2" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
