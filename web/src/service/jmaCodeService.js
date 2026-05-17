/**
 * 気象庁地域コードAPI
 */
import { GIS_HOST } from '@/constant';

let jmaCodeMap = new Map();
let isLoaded = false;
let loadPromise = null;

/**
 * 気象庁コードテーブルの読み込み
 */
export const loadJmaCode = async () => {
  if (isLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const url = `${GIS_HOST}jmacode/jmacode.csv`;
      const csvText = await (await fetch(url)).text();
      const [headerLine, ...dataLines] = csvText.trim().split(/\r?\n/);
      const headers = headerLine.split(',').map((h) => h.trim());
      const cityCodeIdx = headers.indexOf('citycode');
      if (cityCodeIdx === -1) {
        throw new Error('citycode列が見つかりません');
      }

      dataLines.forEach((line) => {
        const cols = line.split(',').map((v) => v.trim());
        const key = cols[cityCodeIdx];
        if (!key) return;

        const val = Object.fromEntries(headers.map((k, i) => [k, cols[i]]));
        jmaCodeMap.set(key, val);
      });

      isLoaded = true;
    } catch (error) {
      console.error('JMAコードデータの読み込みに失敗しました:', error);
      throw error;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
};

/**
 * 二次細分区コードから二次細分区情報を取得
 */
export const getCityInfoByCityCode = (code) => {
  if (!code) return code;
  return jmaCodeMap.get(code);
};
