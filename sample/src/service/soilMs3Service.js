/**
 * 土壌雨量指数基準API
 */
import { CRITERIA_HOST } from '@/constant';

const MAX_CACHE_COUNT = 20;
const meshCache = new Map();
const pendingRequests = new Map();

/**
 * 3次メッシュ格子の土壌雨量指数基準を取得
 * @param {string} ms3
 * @returns {Promise<Object[] | undefined>}
 */
export const fetchSoilMs3 = async (ms3) => {
  if (!ms3) return undefined;
  const ms1 = ms3.slice(0, 4); // 一次メッシュ単位で分割

  if (meshCache.has(ms1)) {
    // 最新のリクエストは一番後ろにキャッシュ
    const data = meshCache.get(ms1);
    meshCache.delete(ms1);
    meshCache.set(ms1, data);
    return data.get(ms3);
  }

  // 同じms1がリクエスト中ならその結果を待って取得
  if (pendingRequests.has(ms1)) {
    return pendingRequests.get(ms1).then((data) => data.get(ms3));
  }

  const url = `${CRITERIA_HOST}data/soil/${ms1}.json`;
  const requestPromise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Mesh ${ms1} not found`);
      // ms3をキーにして基準値をマップでキャッシュ
      const data = await response
        .json()
        .then((recs) => new Map(Object.entries(recs)));
      // キャッシュ管理
      meshCache.set(ms1, data);
      if (meshCache.size > MAX_CACHE_COUNT) {
        const oldestKey = meshCache.keys().next().value;
        meshCache.delete(oldestKey);
        console.debug(`Cache cleared: ${oldestKey}`);
      }
      return data;
    } catch (e) {
      console.error(e);
      return new Map();
    } finally {
      pendingRequests.delete(ms1); // 完了
    }
  })();

  pendingRequests.set(ms1, requestPromise);
  return requestPromise.then((data) => data.get(ms3));
};
