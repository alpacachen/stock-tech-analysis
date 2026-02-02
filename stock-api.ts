// 股票数据获取 API
import { convertToTencentSymbol } from "./utils";
import type { StockDataPoint } from "./types";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * 通过股票中文名称搜索股票代码
 */
export async function getStockCodeByName(
  name: string
): Promise<string | null> {
  try {
    const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(name)}&type=14&count=5`;

    const response = await fetch(url, {
      headers: {
        ...DEFAULT_HEADERS,
        Referer: "https://quote.eastmoney.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (
      data.QuotationCodeTable &&
      data.QuotationCodeTable.Data &&
      data.QuotationCodeTable.Data.length > 0
    ) {
      return data.QuotationCodeTable.Data[0].Code;
    }

    return null;
  } catch (error) {
    console.error("获取股票代码失败:", error);
    return null;
  }
}

/**
 * 通过股票代码获取最近100个交易日的K线数据
 */
export async function getStockHistory(
  code: string
): Promise<StockDataPoint[]> {
  try {
    const tencentSymbol = convertToTencentSymbol(code);
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tencentSymbol},day,,,200,qfq`;

    const response = await fetch(url, {
      headers: {
        ...DEFAULT_HEADERS,
        Referer: "https://finance.qq.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const stockData = data.data[tencentSymbol];

    if (stockData && stockData.qfqday && Array.isArray(stockData.qfqday)) {
      return stockData.qfqday.map((item: any[]) => ({
        day: item[0],
        open: item[1],
        close: item[2],
        high: item[3],
        low: item[4],
        volume: item[5],
      }));
    }

    return [];
  } catch (error) {
    console.error("获取股票历史数据失败:", error);
    return [];
  }
}
