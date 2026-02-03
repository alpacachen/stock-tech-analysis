// 股票计算模块
import type { StockDataPoint, MACDData, KDJData } from "../types";

/**
 * 计算移动平均线
 */
export function calculateMA(
  prices: number[],
  index: number,
  period: number
): number | null {
  if (index < period - 1) {
    return null;
  }
  let sum = 0;
  for (let i = index - period + 1; i <= index; i++) {
    sum += prices[i];
  }
  return sum / period;
}

/**
 * 计算所有MA数据
 */
export function calculateAllMAs(
  data: StockDataPoint[]
): {
  ma5Arr: (number | null)[];
  ma10Arr: (number | null)[];
  ma20Arr: (number | null)[];
} {
  const prices = data.map((item) => parseFloat(item.close));

  return {
    ma5Arr: prices.map((_, i) => calculateMA(prices, i, 5)),
    ma10Arr: prices.map((_, i) => calculateMA(prices, i, 10)),
    ma20Arr: prices.map((_, i) => calculateMA(prices, i, 20)),
  };
}

/**
 * 计算 RSI 指标 (Wilder RSI)
 * RSI = 100 - 100 / (1 + RS), RS = AvgGain / AvgLoss
 *
 * 返回与 prices 等长的数组，前 period 个（含不足期）返回 null
 */
export function calculateRSI(
  prices: number[],
  period: number = 14
): (number | null)[] {
  if (prices.length === 0) return [];

  const rsiArr: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length <= period) return rsiArr;

  let gainSum = 0;
  let lossSum = 0;

  // 初始 period 根变化（从 1 到 period）
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gainSum += change;
    else lossSum += -change;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  // 第 period 根开始有 RSI 值
  rsiArr[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsiArr[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsiArr;
}

export function calculateAllRSIs(
  data: StockDataPoint[]
): {
  rsi14Arr: (number | null)[];
} {
  const prices = data.map((item) => parseFloat(item.close));
  return {
    rsi14Arr: calculateRSI(prices, 14),
  };
}

/**
 * 计算指数移动平均线 EMA
 * @param prices 价格数组
 * @param period 周期
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      ema.push(prices[0]);
    } else {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
  }

  return ema;
}

/**
 * 计算 MACD 指标
 * DIF = EMA(12) - EMA(26)
 * DEA = EMA(9) of DIF
 * BAR = 2 * (DIF - DEA)
 */
export function calculateMACD(data: StockDataPoint[]): MACDData[] {
  const prices = data.map((item) => parseFloat(item.close));

  // 计算 EMA12 和 EMA26
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  // 计算 DIF
  const dif: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    dif.push(ema12[i] - ema26[i]);
  }

  // 计算 DEA (DIF 的 EMA9)
  const dea = calculateEMA(dif, 9);

  // 计算 BAR
  const macdData: MACDData[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdData.push({
      dif: dif[i],
      dea: dea[i],
      bar: 2 * (dif[i] - dea[i]),
    });
  }

  return macdData;
}

/**
 * 计算 KDJ 指标
 * RSV = (当日收盘价 - n日内最低价) / (n日内最高价 - n日内最低价) × 100
 * K = (2/3 × 前一日K值) + (1/3 × 当日RSV)
 * D = (2/3 × 前一日D值) + (1/3 × 当日K值)
 * J = 3K - 2D
 * 
 * 注意：前 (period-1) 天数据不足，返回 null
 * 第 period 天开始，K 和 D 初始值为 50
 */
export function calculateKDJ(
  data: StockDataPoint[],
  period: number = 9
): { k: number | null; d: number | null; j: number | null }[] {
  const kdjData: { k: number | null; d: number | null; j: number | null }[] = [];
  let prevK: number | null = null;
  let prevD: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      // 数据不足，无法计算
      kdjData.push({ k: null, d: null, j: null });
      continue;
    }

    // 计算 n 日内的最高价和最低价（包含当天）
    let highN = parseFloat(data[i - period + 1].high);
    let lowN = parseFloat(data[i - period + 1].low);
    for (let j = i - period + 2; j <= i; j++) {
      const h = parseFloat(data[j].high);
      const l = parseFloat(data[j].low);
      if (h > highN) highN = h;
      if (l < lowN) lowN = l;
    }

    // 计算 RSV
    const close = parseFloat(data[i].close);
    let rsv = 50; // 如果最高价等于最低价，RSV设为50（中间值）
    if (highN !== lowN) {
      rsv = ((close - lowN) / (highN - lowN)) * 100;
    }

    // 计算 K、D、J
    // 使用 SMA(X, N, M) = (M * X + (N - M) * 前一日SMA) / N
    // K = SMA(RSV, 3, 1), D = SMA(K, 3, 1)
    // 初始值为 50，但第一天也要用公式计算
    const prevKValue: number = prevK ?? 50;
    const prevDValue: number = prevD ?? 50;
    const k: number = (1 * rsv + 2 * prevKValue) / 3;
    const d: number = (1 * k + 2 * prevDValue) / 3;
    const j: number = 3 * k - 2 * d;

    prevK = k;
    prevD = d;
    kdjData.push({ k, d, j });
  }

  return kdjData;
}

/**
 * 计算涨跌幅
 */
export function calculateChange(
  firstPrice: number,
  lastPrice: number
): { change: number; changePercent: number } {
  const change = lastPrice - firstPrice;
  const changePercent = (change / firstPrice) * 100;
  return { change, changePercent };
}
