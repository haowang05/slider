
import { SimulationParams, SimulationState, ModelType } from "../types";
import { DT } from "../constants";

const TOLERANCE = 0.005;

export const calculateCriticalForce = (params: SimulationParams): { F1c: number; F2c: number } => {
  const { mass: m, M_plank: M, mu_block: mu1, mu_ground: mu2, g } = params;
  const f1_max = mu1 * m * g;
  const f2_max = mu2 * (m + M) * g;

  // Case A: 力作用在滑块 m 上，求 F1 使其刚好滑动
  // (F1 - f2_max) * (M / (m+M)) = f1_max -> 简化公式
  const F1c = f1_max * (m + M) / M + f2_max;

  // Case B: 力作用在木板 M 上，求 F2 使其刚好滑动
  const F2c = f1_max * (m + M) / m + f2_max;

  return { F1c, F2c };
};

export const initializeState = (type: ModelType, params: SimulationParams): SimulationState => {
  return {
    t: 0,
    x1: 0,
    v1: params.v0,
    a1: 0,
    x2: 0,
    v2: type === 'plank' ? params.v0_plank : 0,
    a2: 0,
    forces: {
      friction1: 0,
      friction2: 0,
      normal1: 0,
      normal2: 0,
      gravity1: 0,
      gravity2: 0,
      external1: 0,
      external2: 0,
    },
    status: '准备就绪',
  };
};

export const stepSimulation = (
  type: ModelType,
  current: SimulationState,
  params: SimulationParams
): SimulationState => {
  if (current.status.includes("脱离")) return current;

  const next = { ...current, t: current.t + DT };
  const rad = (params.theta * Math.PI) / 180;
  const sinTheta = Math.sin(rad);
  const cosTheta = Math.cos(rad);

  if (type === 'single') {
    const F_ext_x = params.F_mag * Math.cos((params.F_angle * Math.PI) / 180);
    const F_ext_y = params.F_mag * Math.sin((params.F_angle * Math.PI) / 180);
    const N = Math.max(0, params.mass * params.g * cosTheta - F_ext_y);
    const f_max = params.mu * N;
    const F_driving = F_ext_x - params.mass * params.g * sinTheta;

    let friction = 0;
    let a = 0;

    if (Math.abs(current.v1) > TOLERANCE) {
      friction = (current.v1 > 0 ? -1 : 1) * f_max;
      a = (F_driving + friction) / params.mass;
    } else {
      if (Math.abs(F_driving) <= f_max) {
        friction = -F_driving;
        a = 0;
        next.v1 = 0;
      } else {
        friction = (F_driving > 0 ? -1 : 1) * f_max;
        a = (F_driving + friction) / params.mass;
      }
    }
    next.a1 = a;
    next.v1 = current.v1 + a * DT;
    next.x1 = current.x1 + next.v1 * DT;
    next.status = Math.abs(next.v1) < TOLERANCE ? "静止" : "运动中";
    next.forces = { friction1: friction, friction2: 0, normal1: N, normal2: 0, gravity1: params.mass * params.g, gravity2: 0, external1: params.F_mag, external2: 0 };

  } else if (type === 'belt') {
    const N = params.mass * params.g * cosTheta;
    const f_max = params.mu * N;
    const g_para = params.mass * params.g * sinTheta;
    const v_rel = current.v1 - params.v_belt;

    let a = 0;
    let friction = 0;

    if (Math.abs(v_rel) > TOLERANCE) {
      friction = (v_rel > 0 ? -1 : 1) * f_max;
      a = (friction - g_para) / params.mass;
    } else {
      if (Math.abs(g_para) <= f_max) {
        friction = g_para;
        a = 0;
        next.v1 = params.v_belt;
      } else {
        friction = (g_para > 0 ? -1 : 1) * f_max;
        a = (friction - g_para) / params.mass;
      }
    }
    next.a1 = a;
    next.v1 = current.v1 + a * DT;
    next.x1 = current.x1 + next.v1 * DT;
    next.status = Math.abs(v_rel) < 0.05 ? "共速" : "相对滑动";
    next.forces = { friction1: friction, friction2: 0, normal1: N, normal2: 0, gravity1: params.mass * params.g, gravity2: 0, external1: 0, external2: 0 };

  } else if (type === 'plank') {
    const { mass: m, M_plank: M, mu_block: mu1, mu_ground: mu2, g, F_block: F1, F_plank: F2, L_plank: L } = params;
    const N1 = m * g;
    const N2 = (m + M) * g;
    const f1_max = mu1 * N1;
    const f2_max = mu2 * N2;

    let a1 = 0, a2 = 0, f1 = 0, f2 = 0;
    const v_rel = current.v1 - current.v2;

    // 1. 先判断地面对整体的摩擦力 f2
    const total_v = (Math.abs(current.v1) + Math.abs(current.v2)) / 2;
    if (total_v > TOLERANCE) {
      f2 = (current.v2 >= 0 ? -1 : 1) * f2_max;
    } else {
      const F_net_ext = F1 + F2;
      if (Math.abs(F_net_ext) <= f2_max) {
        f2 = -F_net_ext;
      } else {
        f2 = (F_net_ext > 0 ? -1 : 1) * f2_max;
      }
    }

    // 2. 判断两者是否相对滑动
    if (Math.abs(v_rel) > TOLERANCE) {
      // 已在滑动
      f1 = (v_rel > 0 ? -1 : 1) * f1_max;
      a1 = (F1 + f1) / m;
      a2 = (F2 - f1 + f2) / M;
      next.status = "相对滑动";
    } else {
      // 假设不滑动，求共同加速度 a_co
      const a_co = (F1 + F2 + f2) / (m + M);
      // 求该加速度下所需的静摩擦力 f1_req: F1 + f1_req = m * a_co
      const f1_req = m * a_co - F1;

      if (Math.abs(f1_req) <= f1_max + 0.0001) {
        a1 = a2 = a_co;
        f1 = f1_req;
        next.status = (Math.abs(a1) < TOLERANCE && Math.abs(current.v1) < TOLERANCE) ? "静止" : "共速运动";
      } else {
        // 发生破裂，转为动摩擦
        f1 = (f1_req > 0 ? 1 : -1) * f1_max;
        a1 = (F1 + f1) / m;
        a2 = (F2 - f1 + f2) / M;
        next.status = "开始相对滑动";
      }
    }

    next.a1 = a1;
    next.a2 = a2;
    next.v1 = current.v1 + a1 * DT;
    next.v2 = current.v2 + a2 * DT;
    next.x1 = current.x1 + next.v1 * DT;
    next.x2 = current.x2 + next.v2 * DT;

    // 脱离判定：滑块中心相对于木板中心的位移
    if (Math.abs(next.x1 - next.x2) > L / 2) {
      next.status = "滑块已脱离木板";
      next.a1 = 0; next.a2 = 0;
      next.v1 = current.v1; next.v2 = current.v2; // 保持最后速度或根据重力下落（此处简化）
    }

    next.forces = { friction1: f1, friction2: f2, normal1: N1, normal2: N2, gravity1: m * g, gravity2: M * g, external1: F1, external2: F2 };
  }

  return next;
};
