// 工具函数

/**
 * 判断今天是否是工作日（周一到周五）
 * 注意：此函数不考虑法定节假日，仅判断星期
 */
export function isWorkday(): boolean {
  const day = getChinaTime().getDay();
  return day >= 1 && day <= 5;
}

/**
 * 获取中国时区的当前时间
 */
function getChinaTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
}

/**
 * 判断当前是否处于A股交易日内（9:30-15:00）
 * 包括中午休市的11:30-13:00时段
 * 使用中国时区（Asia/Shanghai）
 */
export function isTradingHours(): boolean {
  const chinaTime = getChinaTime();
  const hours = chinaTime.getHours();
  const minutes = chinaTime.getMinutes();
  const time = hours * 60 + minutes;

  const tradingStart = 9 * 60 + 30;
  const tradingEnd = 15 * 60;

  return time >= tradingStart && time <= tradingEnd;
}

/**
 * 判断金叉死叉信号
 * 金叉: MA5上穿MA10 (当天MA5>MA10且前一天MA5<=MA10)
 * 死叉: MA5下穿MA10 (当天MA5<MA10且前一天MA5>=MA10)
 */
export function detectCrossSignal(
  ma5: number | null,
  ma10: number | null,
  prevMa5: number | null,
  prevMa10: number | null
): string {
  if (ma5 === null || ma10 === null || prevMa5 === null || prevMa10 === null) {
    return "";
  }

  if (ma5 > ma10 && prevMa5 <= prevMa10) {
    return "🌟金叉";
  } else if (ma5 < ma10 && prevMa5 >= prevMa10) {
    return "💀死叉";
  }
  return "";
}

/**
 * 判断 MACD 金叉死叉信号及高低位
 * 金叉: DIF上穿DEA (当天DIF>DEA且前一天DIF<=DEA)
 * 死叉: DIF下穿DEA (当天DIF<DEA且前一天DIF>=DEA)
 * 低位: DIF < 0 且 DEA < 0
 * 高位: DIF > 0 且 DEA > 0
 */
export function detectMACDSignal(
  dif: number,
  dea: number,
  prevDif: number,
  prevDea: number
): string {
  const isGoldenCross = dif > dea && prevDif <= prevDea;
  const isDeathCross = dif < dea && prevDif >= prevDea;

  if (!isGoldenCross && !isDeathCross) {
    return "";
  }

  const isLowLevel = dif < 0 && dea < 0;
  const isHighLevel = dif > 0 && dea > 0;

  if (isGoldenCross) {
    if (isLowLevel) {
      return "🌟低位金叉";
    } else if (isHighLevel) {
      return "🌟高位金叉";
    }
    return "🌟金叉";
  } else {
    // isDeathCross
    if (isLowLevel) {
      return "💀低位死叉";
    } else if (isHighLevel) {
      return "💀高位死叉";
    }
    return "💀死叉";
  }
}

/**
 * 将股票代码转换为腾讯财经格式
 */
export function convertToTencentSymbol(code: string): string {
  if (/^(sh|sz|bj|hk)/i.test(code)) {
    return code.toLowerCase();
  }

  const pureCode = code.replace(/^(sh|sz|bj|hk)/i, "");

  let prefix = "sz";
  if (
    pureCode.startsWith("6") ||
    pureCode.startsWith("5") ||
    pureCode.startsWith("9")
  ) {
    prefix = "sh";
  } else if (pureCode.startsWith("4") || pureCode.startsWith("8")) {
    prefix = "bj";
  } else if (/^\d{5}$/.test(pureCode)) {
    prefix = "hk";
  }

  return prefix + pureCode;
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * 判断 KDJ 金叉死叉信号及超买超卖状态
 * 金叉: K上穿D (当天K>D且前一天K<=D)
 * 死叉: K下穿D (当天K<D且前一天K>=D)
 * 超买: K>80 且 D>80
 * 超卖: K<20 且 D<20
 */
export function detectKDJSignal(
  k: number,
  d: number,
  prevK: number,
  prevD: number
): string {
  const isGoldenCross = k > d && prevK <= prevD;
  const isDeathCross = k < d && prevK >= prevD;

  if (!isGoldenCross && !isDeathCross) {
    return "";
  }

  const isOverbought = k > 80 && d > 80;
  const isOversold = k < 20 && d < 20;

  if (isGoldenCross) {
    if (isOversold) {
      return "🌟超卖金叉";
    } else if (isOverbought) {
      return "🌟超买金叉";
    }
    return "🌟金叉";
  } else {
    // isDeathCross
    if (isOversold) {
      return "💀超卖死叉";
    } else if (isOverbought) {
      return "💀超买死叉";
    }
    return "💀死叉";
  }
}
