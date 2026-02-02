// 类型定义

export interface StockDataPoint {
  day: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface StockMAType {
  ma5: number | null;
  ma10: number | null;
  ma20: number | null;
}

export interface MACDData {
  dif: number;
  dea: number;
  bar: number;
}

export interface KDJData {
  k: number | null;
  d: number | null;
  j: number | null;
}

export interface StockCompleteDataRow {
  日期: string;
  开盘价: string;
  收盘价: string;
  最低价: string;
  最高价: string;
  成交量: string;
  MA5: string;
  MA10: string;
  MA20: string;
  MA信号: string;
  DIF: string;
  DEA: string;
  BAR: string;
  MACD信号: string;
  K: string;
  D: string;
  J: string;
  KDJ信号: string;
}

export interface HotStock {
  code: string;
  name: string;
  rank: number;
  market: string;
}

export interface HotStocksResponse {
  data: HotStock[];
  total: number;
}
