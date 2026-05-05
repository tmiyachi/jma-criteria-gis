/**
 * 地図、レイヤーの初期化
 */
import maplibregl from 'maplibre-gl';
import LayerControl from './control/layer';
import './control/layer/style.css';

import { updateZoomInfo, updateInfoPanel } from './ui';

import {
  GIS_HOST,
  CRITERIA_HOST,
  COLORS,
  LEVELS,
  ELEMENTS,
  MESHES,
  ZOOM_RANGE,
  GRID_FILL_OPACITY_VALUE,
  HOVERED_GRID_FILL_OPACITY_VALUE,
  MESH_LAYER_IDS,
  ATTRIBUTION_JMAGIS,
  ATTRIBUTION_GIS,
} from './constant';

/**
 * マウスホバーしているレイヤー
 */
let hoveredState = null; // { source, sourceLayer, id }

/**
 * Mapオブジェクトの初期化
 */
export const initMap = (containerId) => {
  const map = new maplibregl.Map({
    container: containerId,
    center: [135, 35],
    zoom: 7,
    maxZoom: 12,
    minZoom: 4,
    style: {
      version: 8,
      sources: {},
      layers: [],
    },
  });

  // コントロールの追加
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

  return map;
};

/**
 * レイヤーの初期化
 */
export const setupLayers = (map) => {
  setupGsiLayers(map);
  setupJmaGisLayers(map);
  setupElementLayers(map);
};

export const setupJmaGisLayers = (map) => {
  map.addSource('jmagis', {
    type: 'vector',
    tiles: [`${GIS_HOST}/tiles/zxy/{z}/{x}/{y}.pbf`],
    attribution: ATTRIBUTION_JMAGIS,
  });
  map.addLayer({
    id: 'city-lines',
    type: 'line',
    source: 'jmagis',
    'source-layer': 'city',
    layout: {},
    paint: {
      'line-color': '#627BC1',
      'line-opacity': 0.5,
    },
  });
  map.addLayer({
    id: 'matomearea-lines',
    type: 'line',
    source: 'jmagis',
    'source-layer': 'matomearea',
    layout: {},
    paint: {
      'line-color': '#627BC1',
      'line-opacity': 0.8,
    },
  });
  map.addLayer({
    id: 'firstarea-lines',
    type: 'line',
    source: 'jmagis',
    'source-layer': 'firstarea',
    layout: {},
    paint: {
      'line-color': '#757575',
      'line-width': 0.8,
    },
    minzoom: 5,
  });
  map.addLayer({
    id: 'pref-lines',
    type: 'line',
    source: 'jmagis',
    'source-layer': 'pref',
    layout: {},
    paint: {
      'line-color': '#212121',
      'line-width': 0.8,
    },
  });
};

export const setupGsiLayers = (map) => {
  map.addSource('gsi-blank-tiles', {
    type: 'raster',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: ATTRIBUTION_GIS,
  });
  map.addSource('gsi-std-tiles', {
    type: 'raster',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: ATTRIBUTION_GIS,
  });
  map.addSource('gsi-pale-tiles', {
    type: 'raster',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: ATTRIBUTION_GIS,
  });
  map.addSource('gsi-slopemap-tiles', {
    type: 'raster',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: ATTRIBUTION_GIS,
  });
  map.addLayer({
    id: 'gsi-blank-layer',
    type: 'raster',
    source: 'gsi-blank-tiles',
    minzoom: 0,
    maxzoom: 18,
    layout: { visibility: 'none' },
  });
  map.addLayer({
    id: 'gsi-std-layer',
    type: 'raster',
    source: 'gsi-std-tiles',
    minzoom: 0,
    maxzoom: 18,
    layout: { visibility: 'none' },
  });
  map.addLayer({
    id: 'gsi-pale-layer',
    type: 'raster',
    source: 'gsi-pale-tiles',
    minzoom: 0,
    maxzoom: 18,
    layout: { visibility: 'none' },
  });
  map.addLayer({
    id: 'gsi-slopemap-layer',
    type: 'raster',
    source: 'gsi-slopemap-tiles',
    minzoom: 3,
    maxzoom: 15,
    layout: { visibility: 'none' },
  });
};

export const setupElementLayers = (map) => {
  ELEMENTS.forEach((elem) => {
    MESHES.forEach((mesh) => {
      const sourceLayerId = `${elem}-${mesh}`;
      const id = `elem-${elem}-${mesh}`;

      map.addSource(id, {
        type: 'vector',
        url: `pmtiles://${CRITERIA_HOST}/tiles/${elem}.${mesh}.pmtiles`,
      });

      const [minzoon, maxzoom] = ZOOM_RANGE[mesh];

      map.addLayer({
        id: id,
        type: 'fill',
        source: id,
        'source-layer': sourceLayerId,
        minzoom: minzoon,
        maxzoom: maxzoom,
        layout: {},
        paint: {
          'fill-color': 'rgb(0,0,0,0)',
          'fill-outline-color': 'rgb(0,0,0,0)',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HOVERED_GRID_FILL_OPACITY_VALUE,
            GRID_FILL_OPACITY_VALUE,
          ],
        },
      });
    });
  });
};

/**
 * レイヤーのカラーマップを作成
 * @param {string} elem 要素
 * @param {string} level レベル
 * @returns カラーマップ
 */
const colorExpression = (elem, level) => {
  return [
    'step',
    ['to-number', ['get', level]],
    '#a9a9a9', // 未定義
    0,
    'rgba(0,0,0,0)', // 0
    ...LEVELS[elem].map((v, i) => [v, COLORS[i]]).flat(),
  ];
};

/**
 * セレクトボックスの選択状態でレイヤーのプロパティを変更
 */
const changeLayerProperty = (map) => {
  const selected = document.getElementById('element-selector').value;
  if (!selected) return;

  const [selectedElem, selectedLevel] = selected.split(',');
  ELEMENTS.forEach((elem) => {
    MESHES.forEach((mesh) => {
      const id = `elem-${elem}-${mesh}`;
      const color = colorExpression(elem, selectedLevel);
      const visibility = elem == selectedElem ? 'visible' : 'none';
      if (map.getLayer(id)) {
        map.setPaintProperty(id, 'fill-color', color);
        map.setLayoutProperty(id, 'visibility', visibility);
        // map.setPaintProperty(id, 'fill-outline-color', color);
      }
    });
  });
};

/**
 * イベントの設定
 */
export const setupMapEvents = (map) => {
  // マウスイベント
  MESH_LAYER_IDS.forEach((layerId) => {
    map.on('mousemove', layerId, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];

        if (hoveredState) {
          map.setFeatureState(hoveredState, { hover: false });
          updateInfoPanel(null);
        }

        hoveredState = {
          source: feature.source,
          sourceLayer: feature.sourceLayer,
          id: feature.id,
        };
        map.setFeatureState(hoveredState, { hover: true });
        map.getCanvas().style.cursor = 'pointer';

        // 情報パネル更新
        const props = e.features[0].properties;
        updateInfoPanel(props);
      }
    });

    map.on('mouseleave', layerId, () => {
      if (hoveredState) {
        map.setFeatureState(hoveredState, { hover: false });
        hoveredState = null;
      }
      map.getCanvas().style.cursor = '';
      updateInfoPanel(null);
    });
  });

  // zoomイベント
  map.on('zoom', () => {
    updateZoomInfo(map);
  });

  // セレクトボックス
  document.getElementById('element-selector').addEventListener('change', () => {
    changeLayerProperty(map);
  });

  // 初期化
  updateZoomInfo(map);
  changeLayerProperty(map);
};
