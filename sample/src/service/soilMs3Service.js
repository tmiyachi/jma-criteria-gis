/**
 * 土壌雨量指数基準API
 */
const MAX_CACHE_COUNT = 20;
const meshCache = new Map();
const pendingRequests = new Map();

/**
 * 3次メッシュ格子の流域雨量指数基準を取得
 */
export const fetchSoilMs3 = async (ms3) => {
  if (!ms3) return null;
  const ms1 = ms3.slice(0, 4); // 一次メッシュ単位で分割

  if (meshCache.has(ms1)) {
    // 最新のリクエストは一番後ろにキャッシュ
    const data = meshCache.get(ms1);
    meshCache.delete(ms1);
    meshCache.set(ms1, data);
    return data.get(ms3);
  }

  // リクエスト中
  if (pendingRequests.has(ms1)) {
    return pendingRequests.get(ms1);
  }

  const url = `./data/soil/${ms1}.json`;
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
      return data.get(ms3);
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      pendingRequests.delete(ms1); // 完了
    }
  })();

  pendingRequests.set(ms1, requestPromise);
  return requestPromise;
};
