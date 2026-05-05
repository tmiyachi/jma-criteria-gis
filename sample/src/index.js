import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/main.css';

import { initMap, setupMapEvents, setupLayers } from './map';
import { loadJmaCode } from './service/jmaCodeService';
import { setupElementSelector } from './ui';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const startApp = async () => {
  // 地域情報取得
  await loadJmaCode();

  // セレクトボックスの初期化
  setupElementSelector();

  // 地図の初期化
  const map = initMap('map');

  map.on('load', async () => {
    // レイヤー登録
    setupLayers(map);

    // イベント登録
    setupMapEvents(map);

    document.getElementById('control').classList.remove('hidden');
  });
};

startApp();
