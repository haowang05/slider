
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModelType, SimulationParams, SimulationState, DataPoint } from './types';
import { DEFAULT_PARAMS } from './constants';
import { initializeState, stepSimulation } from './services/physicsEngine';
import Controls from './components/Controls';
import Visualizer from './components/Visualizer';
import Charts from './components/Charts';
import { Box, Layers, ArrowRightLeft } from 'lucide-react';

function App() {
  const [modelType, setModelType] = useState<ModelType>('single');
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS['single']);
  const [state, setState] = useState<SimulationState>(initializeState('single', DEFAULT_PARAMS['single']));
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const requestRef = useRef<number>(0);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setState(initializeState(modelType, params));
    setHistory([]);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, [modelType, params]);

  const changeModel = (type: ModelType) => {
    setModelType(type);
    setParams(DEFAULT_PARAMS[type]);
    setIsPlaying(false);
    setHistory([]);
    setState(initializeState(type, DEFAULT_PARAMS[type]));
  };

  const updateLoop = useCallback(() => {
    if (!isPlaying) return;
    setState(prev => stepSimulation(modelType, prev, params));
    requestRef.current = requestAnimationFrame(updateLoop);
  }, [isPlaying, modelType, params]);

  useEffect(() => {
    if (state.t === 0 && history.length > 0) return;
    setHistory(prev => {
       if (prev.length > 0 && prev[prev.length-1].time === state.t) return prev;
       const newData: DataPoint = {
         time: state.t,
         x1: state.x1,
         x2: modelType === 'plank' ? state.x2 : undefined,
         s1: state.s1,
         s2: modelType === 'plank' ? state.s2 : undefined,
         v1: state.v1,
         v2: modelType === 'belt' ? params.v_belt : state.v2,
         a1: state.a1,
         a2: state.a2,
         v_rel: state.v1 - (modelType === 'belt' ? params.v_belt : (state.v2 || 0)),
         Ek: 0.5 * params.mass * state.v1 * state.v1,
         Q: 0
       };
       return [...prev, newData].slice(-1000); // 保持最近1000个点
    });
  }, [state, params, modelType]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, updateLoop]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Controls 
        modelType={modelType} 
        params={params} 
        setParams={setParams} 
        onReset={handleReset}
        isPlaying={isPlaying}
        togglePlay={() => setIsPlaying(!isPlaying)}
      />

      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">物理滑块动力学可视化</h1>
            <p className="text-slate-400 text-sm">Interactive Mechanics Lab</p>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-lg">
            {[
              { id: 'single', icon: Box, label: '单体/斜面' },
              { id: 'belt', icon: ArrowRightLeft, label: '传送带' },
              { id: 'plank', icon: Layers, label: '板块/叠块' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => changeModel(tab.id as ModelType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${modelType === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1">
          <Visualizer type={modelType} params={params} state={state} />
          <Charts data={history} modelType={modelType} />
        </main>
      </div>
    </div>
  );
}

export default App;
