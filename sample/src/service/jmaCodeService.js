/**
 * 気象庁地域コードAPI
 */
import { GIS_HOST } from '@/constant';

let jmaCodeMap = new Map();
let isLoaded = false;

/**
 * 気象庁コードテーブルの読み込み
 */
export const loadJmaCode = async () => {
  if (isLoaded) return;

  try {
    const url = `${GIS_HOST}/jmacode/jmacode.csv`;
    const csvText = await (await fetch(url)).text();
    const [headerLine, ...dataLines] = csvText.trim().split(/\r?\n/);
    const headers = headerLine.split(',').map((h) => h.trim());
    const cityCodeIdx = headers.indexOf('citycode');

    dataLines
      .map((line) => line.split(','))
      .forEach((cols) => {
        const key = cols[cityCodeIdx];
        const val = Object.fromEntries(headers.map((k, i) => [k, cols[i]]));
        jmaCodeMap.set(key, val);
      });

    isLoaded = true;
  } catch (error) {
    console.error('JMAコードデータの読み込みに失敗しました:', error);
  }
};

/**
 * 二次細分区コードから二次細分区情報を取得
 */
export const getCityInfoByCityCode = (code) => {
  if (!code) return code;
  return jmaCodeMap.get(code);
};
