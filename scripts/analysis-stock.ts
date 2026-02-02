#!/usr/bin/env node
import { getStockCodeByName, getStockHistory } from "../src/api/stock-api";
import { formatStockData, formatStockReport, printStockTrend } from "../src/formatters/stock-formatter";
import { saveStockData, saveStockReport } from "../src/utils/file-utils";

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
  console.log("正在获取最近100个交易日数据...");

  const historyData = await getStockHistory(stockCode);
  
  console.log("正在生成数据文件...");
  const dataContent = formatStockData(historyData);
  const dataFilePath = saveStockData(stockName, dataContent);
  console.log(`数据文件已保存到: ${dataFilePath}`);
  
  console.log("正在生成分析报告...");
  const reportContent = formatStockReport(historyData);
  const reportFilePath = saveStockReport(stockName, reportContent);
  console.log(`报告文件已保存到: ${reportFilePath}`);
  
  console.log("\n========== 分析报告 ==========");
  printStockTrend(historyData);
}

main();
