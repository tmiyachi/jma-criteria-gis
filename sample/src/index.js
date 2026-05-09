import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/main.css';

import { initMap, setupLayers } from '@/map';
import { LayerControl, DataViewerControl } from '@/control';
import { loadJmaCode } from '@/service/jmaCodeService';
import '@/control/dv/style.css';
import '@/control/layer/style.css';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const startApp = async () => {
  // 地域情報取得
  await loadJmaCode();

  // 地図の初期化
  const map = initMap('map');

  map.on('load', async () => {
    // レイヤー登録
    setupLayers(map);

    // コントロールの追加
    map.addControl(
      new maplibregl.AttributionControl({ compact: false }),
      'bottom-right',
    );
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    const layerControl = new LayerControl([
      { id: 'jmagis', label: '気象庁細分区' },
      { id: 'gsi-blank-layer', label: '地理院地図（白地図）' },
      { id: 'gsi-std-layer', label: '地理院地図（標準）' },
      { id: 'gsi-pale-layer', label: '地理院地図（淡色）' },
      { id: 'gsi-slopemap-layer', label: '地理院地図（地形）' },
    ]);
    map.addControl(layerControl, 'top-left');
    map.addControl(new DataViewerControl(), 'top-right');
  });
};

startApp();
