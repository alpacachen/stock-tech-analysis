#!/usr/bin/env node
import { getHotStocks } from "../src/api/stock-api";
import { saveReport } from "../src/utils/file-utils";

async function main() {
  console.log("正在获取东方财富热门股票前100名...");

  const result = await getHotStocks(100);

  if (result.data.length === 0) {
    console.error("未获取到热门股票数据");
    process.exit(1);
  }

  console.log(`获取到 ${result.total} 只热门股票`);
  console.log("正在生成热门股票列表...");

  let content = "# 东方财富热门股票排行榜\n\n";
  content += `更新时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  content += `共 ${result.total} 只股票\n\n`;
  content += "## 股票代码列表\n\n";

  result.data.forEach((stock) => {
    content += `${stock.code}\n`;
  });

  const filePath = saveReport("hot100.md", content);
  console.log(`热门股票列表已保存到: ${filePath}`);
}

main();
