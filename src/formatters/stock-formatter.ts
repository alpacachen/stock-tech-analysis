// 股票数据格式化展示模块
import {
  isWorkday,
  isTradingHours,
  detectCrossSignal,
  detectMACDSignal,
  detectKDJSignal,
  getToday,
} from "../utils";
import {
  calculateAllMAs,
  calculateAllRSIs,
  calculateMACD,
  calculateKDJ,
  calculateChange,
} from "../calculators/stock-calculator";
import type {
  StockDataPoint,
  StockCompleteDataRow,
  MACDData,
  KDJData,
} from "../types";

const PRICE_DECIMAL_PLACES = 2;
const MACD_DECIMAL_PLACES = 3;

/**
 * 格式化股票走势数据
 */
export function formatStockTrend(data: StockDataPoint[]): string {
  try {
    if (data.length === 0) {
      return "没有获取到数据";
    }

    const today = getToday();
    const isTradingToday = isWorkday() && isTradingHours();

    const todayData: StockDataPoint | null =
      isTradingToday && data.length > 0 && data[data.length - 1].day === today
        ? data[data.length - 1]
        : null;
    const historicalData = todayData ? data.slice(0, -1) : data;

    let output = "";

    output += formatCompleteDataTable(data, historicalData, todayData);
    output += formatStatistics(historicalData, todayData);

    return output;
  } catch (error) {
    return `格式化股票数据时发生错误: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * 格式化股票数据（用于 data.md）
 */
export function formatStockData(data: StockDataPoint[]): string {
  try {
    if (data.length === 0) {
      return "没有获取到数据";
    }

    const today = getToday();
    const isTradingToday = isWorkday() && isTradingHours();

    const todayData: StockDataPoint | null =
      isTradingToday && data.length > 0 && data[data.length - 1].day === today
        ? data[data.length - 1]
        : null;
    const historicalData = todayData ? data.slice(0, -1) : data;

    return formatCompleteDataTable(data, historicalData, todayData);
  } catch (error) {
    return `格式化股票数据时发生错误: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * 格式化股票分析报告（用于 report.md）
 */
export function formatStockReport(data: StockDataPoint[]): string {
  try {
    if (data.length === 0) {
      return "没有获取到数据";
    }

    const today = getToday();
    const isTradingToday = isWorkday() && isTradingHours();

    const todayData: StockDataPoint | null =
      isTradingToday && data.length > 0 && data[data.length - 1].day === today
        ? data[data.length - 1]
        : null;
    const historicalData = todayData ? data.slice(0, -1) : data;

    return formatStatistics(historicalData, todayData);
  } catch (error) {
    return `格式化股票分析报告时发生错误: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export function printStockTrend(data: StockDataPoint[]): void {
  console.log(formatStockTrend(data));
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
  rsi14Arr: (number | null)[],
  macdData: MACDData[],
  kdjData: KDJData[]
): StockCompleteDataRow {
  try {
    const ma5 = ma5Arr[index];
    const ma10 = ma10Arr[index];
    const ma20 = ma20Arr[index];
    const prevMa5 = index > 0 ? ma5Arr[index - 1] : null;
    const prevMa10 = index > 0 ? ma10Arr[index - 1] : null;

    const macdItem = macdData[index];
    const prevMacdItem = index > 0 ? macdData[index - 1] : null;

    const kdjItem = kdjData[index];
    const prevKdjItem = index > 0 ? kdjData[index - 1] : null;

    if (!macdItem) {
      throw new Error(`MACD data not found at index ${index}`);
    }

    if (!kdjItem) {
      throw new Error(`KDJ data not found at index ${index}`);
    }

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
      DIF: macdItem.dif.toFixed(MACD_DECIMAL_PLACES),
      DEA: macdItem.dea.toFixed(MACD_DECIMAL_PLACES),
      BAR: macdItem.bar.toFixed(MACD_DECIMAL_PLACES),
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
      RSI14: formatValue(rsi14Arr[index]),
    };
  } catch (error) {
    throw new Error(`构建表格行数据时发生错误 (index: ${index}): ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 格式化完整的合并表格（价格数据 + 技术指标）
 */
function formatCompleteDataTable(
  data: StockDataPoint[],
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): string {
  try {
    let output = "";

    output += "\n========== 股票走势与技术指标数据 ==========\n";
    output += `共 ${historicalData.length} 个交易日历史数据\n\n`;

    const { ma5Arr, ma10Arr, ma20Arr } = calculateAllMAs(data);
    const { rsi14Arr } = calculateAllRSIs(data);
    const macdData = calculateMACD(data);
    const kdjData = calculateKDJ(data);

    const completeTable: StockCompleteDataRow[] = historicalData.map((item, index) =>
      buildTableRow(item, index, ma5Arr, ma10Arr, ma20Arr, rsi14Arr, macdData, kdjData)
    );

    output += formatTable(completeTable);

    if (todayData) {
      const todayIndex = data.length - 1;
      const todayRow = buildTableRow(
        todayData,
        todayIndex,
        ma5Arr,
        ma10Arr,
        ma20Arr,
        rsi14Arr,
        macdData,
        kdjData
      );

      output += "\n---------- 今日数据（交易中） ----------\n";
      output += formatTable([todayRow]);
    }

    return output;
  } catch (error) {
    return `\n========== 股票走势与技术指标数据 ==========\n格式化数据表格时发生错误: ${error instanceof Error ? error.message : String(error)}\n`;
  }
}

function formatTable(data: StockCompleteDataRow[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const colWidths = headers.map(header => {
    const maxWidth = Math.max(
      header.length,
      ...data.map(row => String(row[header as keyof StockCompleteDataRow]).length)
    );
    return maxWidth + 2;
  });

  let output = "";

  output += "|" + headers.map((h, i) => h.padEnd(colWidths[i])).join("|") + "|\n";
  output += "|" + colWidths.map(w => "-".repeat(w - 1) + ":").join("|") + "|\n";

  data.forEach(row => {
    output += "|" + headers.map((h, i) => 
      String(row[h as keyof StockCompleteDataRow]).padEnd(colWidths[i])
    ).join("|") + "|\n";
  });

  return output;
}

/**
 * 格式化数值
 */
function formatValue(value: number | null): string {
  return value !== null ? value.toFixed(PRICE_DECIMAL_PLACES) : "-";
}

/**
 * 格式化统计信息
 */
function formatStatistics(
  historicalData: StockDataPoint[],
  todayData: StockDataPoint | null
): string {
  try {
    if (historicalData.length === 0) {
      return "\n========== 统计信息 ==========\n无历史数据\n";
    }

    const firstPrice = parseFloat(historicalData[0].close);
    const lastPrice = parseFloat(historicalData[historicalData.length - 1].close);
    const { change, changePercent } = calculateChange(firstPrice, lastPrice);

    let output = "";

    output += "\n========== 统计信息 ==========\n";
    output += `起始日期: ${historicalData[0].day}\n`;

    if (todayData) {
      output += `历史数据截止: ${historicalData[historicalData.length - 1].day}\n`;
      output += `最新交易日(今日): ${todayData.day}\n`;
    } else {
      output += `结束日期: ${historicalData[historicalData.length - 1].day}\n`;
    }

    output += `期初收盘价: ${firstPrice.toFixed(PRICE_DECIMAL_PLACES)}\n`;
    output += `最新收盘价: ${lastPrice.toFixed(PRICE_DECIMAL_PLACES)}\n`;
    output += `涨跌幅: ${formatChange(change)} (${formatChangePercent(changePercent)})\n`;

    if (todayData) {
      const todayClose = parseFloat(todayData.close);
      const todayChange = todayClose - lastPrice;
      const todayChangePercent = (todayChange / lastPrice) * 100;
      output += `\n今日实时: ${todayClose.toFixed(PRICE_DECIMAL_PLACES)} (${formatChange(
        todayChange
      )}, ${formatChangePercent(todayChangePercent)})\n`;
    }

    return output;
  } catch (error) {
    return `\n========== 统计信息 ==========\n格式化统计信息时发生错误: ${error instanceof Error ? error.message : String(error)}\n`;
  }
}

/**
 * 格式化带符号的数值
 */
function formatSignedValue(value: number, decimalPlaces: number, suffix: string = ""): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimalPlaces)}${suffix}`;
}

/**
 * 格式化涨跌幅数值
 */
function formatChange(value: number): string {
  return formatSignedValue(value, PRICE_DECIMAL_PLACES);
}

/**
 * 格式化涨跌幅百分比
 */
function formatChangePercent(value: number): string {
  return formatSignedValue(value, PRICE_DECIMAL_PLACES, "%");
}
