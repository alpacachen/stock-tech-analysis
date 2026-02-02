#!/usr/bin/env node
import { getStockCodeByName, getStockHistory } from "./stock-api";
import { printStockTrend } from "./stock-formatter";

async function main() {
  const stockName = process.argv[2];

  if (!stockName) {
    console.error("请提供股票中文名作为参数");
    process.exit(1);
  }

  console.log(`正在查询股票: ${stockName}`);

  const stockCode = await getStockCodeByName(stockName);

  if (!stockCode) {
    console.error(`未找到股票 "${stockName}" 的代码`);
    process.exit(1);
  }

  console.log(`股票代码: ${stockCode}`);
  console.log("正在获取最近100个交易日数据...\n");

  const historyData = await getStockHistory(stockCode);
  printStockTrend(historyData);
}

main();
