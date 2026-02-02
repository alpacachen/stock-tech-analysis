// 股票数据格式化展示模块
import {
  isWorkday,
  isTradingHours,
  detectCrossSignal,
  detectMACDSignal,
  detectKDJSignal,
  getToday,
} from "./utils";
import { calculateAllMAs, calculateMACD, calculateKDJ, calculateChange } from "./stock-calculator";
import type {
  StockDataPoint,
  StockCompleteDataRow,
  MACDData,
  KDJData,
} from "./types";

/**
 * 格式化打印股票走势数据
 */
export function printStockTrend(data: StockDataPoint[]): void {
  if (data.length === 0) {
    console.log("没有获取到数据");
    return;
  }

  const today = getToday();
  const isTradingToday = isWorkday() && isTradingHours();

  // 分离今天和之前的数据
  const todayData: StockDataPoint | null =
    isTradingToday && data.length > 0 && data[data.length - 1].day === today
      ? data[data.length - 1]
      : null;
  const historicalData = todayData ? data.slice(0, -1) : data;

  // 打印完整的合并表格（价格数据 + 技术指标）
  printCompleteDataTable(data, historicalData, todayData);

  // 打印统计信息
  printStatistics(historicalData, todayData);
}

/**
 * 构建表格行数据
 */
function buildTableRow(
  item: StockDataPoint,
  index: number,
  ma5Arr: (number | null)[],
  ma10Arr: (number | null)[],
  ma20Arr: (number | null)[],
  macdData: MACDData[],
  kdjData: KDJData[]
): StockCompleteDataRow {
  const ma5 = ma5Arr[index];
  const ma10 = ma10Arr[index];
  const ma20 = ma20Arr[index];
  const prevMa5 = index > 0 ? ma5Arr[index - 1] : null;
  const prevMa10 = index > 0 ? ma10Arr[index - 1] : null;

  const macdItem = macdData[index];
  const prevMacdItem = index > 0 ? macdData[index - 1] : null;

  const kdjItem = kdjData[index];
  const prevKdjItem = index > 0 ? kdjData[index - 1] : null;

  return {
    日期: item.day,
    开盘价: item.open,
    收盘价: item.close,
    最低价: item.low,
    最高价: item.high,
    成交量: item.volume,
    MA5: formatValue(ma5),
    MA10: formatValue(ma10),
    MA20: formatValue(ma20),
    MA信号: detectCrossSignal(ma5, ma10, prevMa5, prevMa10) ?? "",
    DIF: macdItem.dif.toFixed(3),
    DEA: macdItem.dea.toFixed(3),
    BAR: macdItem.bar.toFixed(3),
    MACD信号: prevMacdItem
      ? detectMACDSignal(
          macdItem.dif,
          macdItem.dea,
          prevMacdItem.dif,
          prevMacdItem.dea
        )
      : "",
    K: formatValue(kdjItem.k),
    D: formatValue(kdjItem.d),
    J: formatValue(kdjItem.j),
    KDJ信号: prevKdjItem && kdjItem.k !== null && kdjItem.d !== null && prevKdjItem.k !== null && prevKdjItem.d !== null
      ? detectKDJSignal(kdjItem.k, kdjItem.d, prevKdjItem.k, prevKdjItem.d)
      : "",
  };
}

/**
 * 打印完整的合并表格（价格数据 + 技术指标）
 */
function printCompleteDataTable(
  data: StockDataPoint[],
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): void {
  console.log("\n========== 股票走势与技术指标数据 ==========");
  console.log(`共 ${historicalData.length} 个交易日历史数据\n`);

  const { ma5Arr, ma10Arr, ma20Arr } = calculateAllMAs(data);
  const macdData = calculateMACD(data);
  const kdjData = calculateKDJ(data);

  // 构建历史数据完整合并表格
  const completeTable: StockCompleteDataRow[] = historicalData.map((item, index) =>
    buildTableRow(item, index, ma5Arr, ma10Arr, ma20Arr, macdData, kdjData)
  );

  console.table(completeTable);

  // 如果有今天数据，单独显示今日数据
  if (todayData) {
    const todayIndex = data.length - 1;
    const todayRow = buildTableRow(
      todayData,
      todayIndex,
      ma5Arr,
      ma10Arr,
      ma20Arr,
      macdData,
      kdjData
    );

    console.log("\n---------- 今日数据（交易中） ----------");
    console.table([todayRow]);
  }
}

/**
 * 格式化数值
 */
function formatValue(value: number | null): string {
  return value !== null ? value.toFixed(2) : "-";
}

/**
 * 打印统计信息
 */
function printStatistics(
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): void {
  const firstPrice = parseFloat(historicalData[0].close);
  const lastPrice = parseFloat(historicalData[historicalData.length - 1].close);
  const { change, changePercent } = calculateChange(firstPrice, lastPrice);

  console.log("\n========== 统计信息 ==========");
  console.log(`起始日期: ${historicalData[0].day}`);

  if (todayData) {
    console.log(
      `历史数据截止: ${historicalData[historicalData.length - 1].day}`
    );
    console.log(`最新交易日(今日): ${todayData.day}`);
  } else {
    console.log(`结束日期: ${historicalData[historicalData.length - 1].day}`);
  }

  console.log(`期初收盘价: ${firstPrice.toFixed(2)}`);
  console.log(`最新收盘价: ${lastPrice.toFixed(2)}`);
  console.log(
    `涨跌幅: ${formatChange(change)} (${formatChangePercent(changePercent)})`
  );

  if (todayData) {
    const todayClose = parseFloat(todayData.close);
    const todayChange = todayClose - lastPrice;
    const todayChangePercent = (todayChange / lastPrice) * 100;
    console.log(
      `\n今日实时: ${todayClose.toFixed(2)} (${formatChange(
        todayChange
      )}, ${formatChangePercent(todayChangePercent)})`
    );
  }
}

/**
 * 格式化涨跌幅数值
 */
function formatChange(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

/**
 * 格式化涨跌幅百分比
 */
function formatChangePercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
