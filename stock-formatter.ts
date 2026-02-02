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
  StockPriceTableRow,
  StockMATableRow,
  StockMACDTableRow,
  StockKDJTableRow,
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

  // 打印基础数据表格
  printPriceTable(historicalData, todayData);

  // 打印MA数据表格
  printMATable(data, historicalData, todayData);

  // 打印MACD数据表格
  printMACDTable(data, historicalData, todayData);

  // 打印KDJ数据表格
  printKDJTable(data, historicalData, todayData);

  // 打印统计信息
  printStatistics(historicalData, todayData);
}

/**
 * 打印价格数据表格
 */
function printPriceTable(
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): void {
  console.log("\n========== 股票走势数据 ==========");
  console.log(`共 ${historicalData.length} 个交易日历史数据\n`);

  const priceTable: StockPriceTableRow[] = historicalData.map((item) => ({
    日期: item.day,
    开盘价: item.open,
    收盘价: item.close,
    最低价: item.low,
    最高价: item.high,
    成交量: item.volume,
  }));
  console.table(priceTable);

  if (todayData) {
    console.log("\n---------- 今日数据（交易中） ----------");
    console.table([
      {
        日期: todayData.day,
        开盘价: todayData.open,
        收盘价: todayData.close,
        最低价: todayData.low,
        最高价: todayData.high,
        成交量: todayData.volume,
      },
    ]);
  }
}

/**
 * 打印MA数据表格
 */
function printMATable(
  data: StockDataPoint[],
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): void {
  console.log("\n========== 移动平均线 (MA) ==========");

  const { ma5Arr, ma10Arr, ma20Arr } = calculateAllMAs(data);

  // 构建历史数据MA表格
  const maTable: StockMATableRow[] = [];
  historicalData.forEach((item, index) => {
    const ma5 = ma5Arr[index];
    const ma10 = ma10Arr[index];
    const ma20 = ma20Arr[index];
    const prevMa5 = index > 0 ? ma5Arr[index - 1] : null;
    const prevMa10 = index > 0 ? ma10Arr[index - 1] : null;

    maTable.push({
      日期: item.day,
      MA5: formatValue(ma5),
      MA10: formatValue(ma10),
      MA20: formatValue(ma20),
      信号: detectCrossSignal(ma5, ma10, prevMa5, prevMa10) || "",
    });
  });

  console.table(maTable);

  // 如果有今天数据，单独显示今日MA
  if (todayData) {
    const todayIndex = data.length - 1;
    const ma5 = ma5Arr[todayIndex];
    const ma10 = ma10Arr[todayIndex];
    const ma20 = ma20Arr[todayIndex];
    const prevMa5 = ma5Arr[todayIndex - 1];
    const prevMa10 = ma10Arr[todayIndex - 1];

    console.log("\n---------- 今日MA ----------");
    console.table([
      {
        日期: todayData.day,
        MA5: formatValue(ma5),
        MA10: formatValue(ma10),
        MA20: formatValue(ma20),
        信号: detectCrossSignal(ma5, ma10, prevMa5, prevMa10) || "",
      },
    ]);
  }
}

/**
 * 打印MACD数据表格
 */
function printMACDTable(
  data: StockDataPoint[],
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): void {
  console.log("\n========== MACD 指标 ==========");

  const macdData = calculateMACD(data);

  // 构建历史数据MACD表格
  const macdTable: StockMACDTableRow[] = [];
  historicalData.forEach((item, index) => {
    const current = macdData[index];
    const prev = index > 0 ? macdData[index - 1] : null;

    macdTable.push({
      日期: item.day,
      DIF: current.dif.toFixed(3),
      DEA: current.dea.toFixed(3),
      BAR: current.bar.toFixed(3),
      信号: prev
        ? detectMACDSignal(
            current.dif,
            current.dea,
            prev.dif,
            prev.dea
          )
        : "",
    });
  });

  console.table(macdTable);

  // 如果有今天数据，单独显示今日MACD
  if (todayData) {
    const todayIndex = data.length - 1;
    const current = macdData[todayIndex];
    const prev = macdData[todayIndex - 1];

    console.log("\n---------- 今日MACD ----------");
    console.table([
      {
        日期: todayData.day,
        DIF: current.dif.toFixed(3),
        DEA: current.dea.toFixed(3),
        BAR: current.bar.toFixed(3),
        信号: detectMACDSignal(current.dif, current.dea, prev.dif, prev.dea),
      },
    ]);
  }
}

/**
 * 打印KDJ数据表格
 */
function printKDJTable(
  data: StockDataPoint[],
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): void {
  console.log("\n========== KDJ 指标 ==========");

  const kdjData = calculateKDJ(data);

  // 构建历史数据KDJ表格
  const kdjTable: StockKDJTableRow[] = [];
  historicalData.forEach((item, index) => {
    const current = kdjData[index];
    const prev = index > 0 ? kdjData[index - 1] : null;

    kdjTable.push({
      日期: item.day,
      K: formatValue(current.k),
      D: formatValue(current.d),
      J: formatValue(current.j),
      信号:
        prev && current.k !== null && current.d !== null && prev.k !== null && prev.d !== null
          ? detectKDJSignal(current.k, current.d, prev.k, prev.d)
          : "",
    });
  });

  console.table(kdjTable);

  // 如果有今天数据，单独显示今日KDJ
  if (todayData) {
    const todayIndex = data.length - 1;
    const current = kdjData[todayIndex];
    const prev = kdjData[todayIndex - 1];

    console.log("\n---------- 今日KDJ ----------");
    console.table([
      {
        日期: todayData.day,
        K: formatValue(current.k),
        D: formatValue(current.d),
        J: formatValue(current.j),
        信号:
          current.k !== null && current.d !== null && prev.k !== null && prev.d !== null
            ? detectKDJSignal(current.k, current.d, prev.k, prev.d)
            : "",
      },
    ]);
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
