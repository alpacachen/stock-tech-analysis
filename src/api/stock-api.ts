// 股票数据获取 API
import { convertToTencentSymbol } from "../utils";
import type { StockDataPoint, HotStock, HotStocksResponse } from "../types";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const DEFAULT_TIMEOUT = 10000; // 10秒超时

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`请求超时 (${timeout}ms)`);
    }
    throw error;
  }
}

/**
 * 通过股票中文名称搜索股票代码
 */
export async function getStockCodeByName(
  name: string
): Promise<string | null> {
  try {
    const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(name)}&type=14&count=5`;

    const response = await fetchWithTimeout(url, {
      headers: {
        ...DEFAULT_HEADERS,
        Referer: "https://quote.eastmoney.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as any;

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

    const response = await fetchWithTimeout(url, {
      headers: {
        ...DEFAULT_HEADERS,
        Referer: "https://finance.qq.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as any;
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

export async function getHotStocks(
  limit: number = 100
): Promise<HotStocksResponse> {
  try {
    const url = "https://emappdata.eastmoney.com/stockrank/getAllCurrentList";

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        ...DEFAULT_HEADERS,
        "Content-Type": "application/json",
        Referer: "https://vipmoney.eastmoney.com/",
      },
      body: JSON.stringify({
        appId: "appId01",
        globalId: "786e4c21-70dc-435a-93bb-38",
        marketType: "",
        pageNo: 1,
        pageSize: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as any;

    if (result.status === -1) {
      console.warn("热门股票API返回异常:", result.message);
      return { data: [], total: 0 };
    }

    if (result.data && Array.isArray(result.data)) {
      const hotStocks: HotStock[] = result.data.map((item: any) => {
        const sc = item.sc || "";
        const code = sc.replace(/^(SH|SZ|BJ)/, "");
        const market = sc.startsWith("SH") ? "1" : sc.startsWith("SZ") ? "0" : sc.startsWith("BJ") ? "2" : "";
        return {
          code,
          name: "",
          rank: item.rk || 0,
          market,
        };
      });

      return {
        data: hotStocks,
        total: result.total || hotStocks.length,
      };
    }

    return { data: [], total: 0 };
  } catch (error) {
    console.error("获取热门股票失败:", error);
    return { data: [], total: 0 };
  }
}
