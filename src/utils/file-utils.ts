import * as fs from "fs";
import * as path from "path";

export function getReportDir(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const reportDir = path.join(process.cwd(), "reports", dateStr);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  return reportDir;
}

export function getStockDir(stockName: string): string {
  const reportDir = getReportDir();
  const stockDir = path.join(reportDir, stockName);

  if (!fs.existsSync(stockDir)) {
    fs.mkdirSync(stockDir, { recursive: true });
  }

  return stockDir;
}

export function saveReport(filename: string, content: string): string {
  const reportDir = getReportDir();
  const filePath = path.join(reportDir, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

export function saveStockData(stockName: string, dataContent: string): string {
  const stockDir = getStockDir(stockName);
  const filePath = path.join(stockDir, "data.md");
  fs.writeFileSync(filePath, dataContent, "utf-8");
  return filePath;
}

export function saveStockReport(stockName: string, reportContent: string): string {
  const stockDir = getStockDir(stockName);
  const filePath = path.join(stockDir, "report.md");
  fs.writeFileSync(filePath, reportContent, "utf-8");
  return filePath;
}
