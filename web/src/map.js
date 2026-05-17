/**
 * 地図、レイヤーの初期化
 */
import maplibregl from 'maplibre-gl';

import {
  GIS_HOST,
  CRITERIA_HOST,
  ELEMENTS,
  MESHES,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_RANGE,
  PAINT_CONFIG as PC,
  ATTRIBUTION,
} from '@/constant';

/**
 * Mapオブジェクトの初期化
 */
export const initMap = (containerId) => {
  const map = new maplibregl.Map({
    container: containerId,
    center: [135, 35],
    zoom: 7,
    maxZoom: MAX_ZOOM,
    minZoom: MIN_ZOOM,
    style: {
      version: 8,
      sources: {},
      layers: [],
    },
    attributionControl: false, // データソース初期化後に追加するためfalse
  });

  return map;
};

/**
 * レイヤーの初期化
 */
export const setupLayers = async (map) => {
  setupGsiLayers(map);
  setupJmaGisLayers(map);
  await setupElementLayers(map);
};

export const setupJmaGisLayers = (map) => {
  map.addSource('jmagis', {
    type: 'vector',
    tiles: [`${GIS_HOST}/tiles/zxy/{z}/{x}/{y}.pbf`],
    attribution: ATTRIBUTION.jmagis,
  });
  map.addLayer({
    id: 'city-lines',
    type: 'line',
    source: 'jmagis',
    'source-layer': 'city',
    layout: { visibility: 'visible' },
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
    layout: { visibility: 'visible' },
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
    layout: { visibility: 'visible' },
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
    layout: { visibility: 'visible' },
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
    attribution: ATTRIBUTION.gis,
  });
  map.addSource('gsi-std-tiles', {
    type: 'raster',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: ATTRIBUTION.gis,
  });
  map.addSource('gsi-pale-tiles', {
    type: 'raster',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: ATTRIBUTION.gis,
  });
  map.addSource('gsi-slopemap-tiles', {
    type: 'raster',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: ATTRIBUTION.gis,
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

export const setupElementLayers = async (map) => {
  for (const elem of ELEMENTS) {
    // attributionに追記するためメタデータ取得（ここでawaitしないと反映されない）
    const meta = await fetch(`${CRITERIA_HOST}tiles/${elem}.metadata.json`)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));

    MESHES.forEach((mesh) => {
      const sourceLayerId = `${elem}-${mesh}`;
      const id = `elem-${elem}-${mesh}`;
      map.addSource(id, {
        type: 'vector',
        url: `pmtiles://${CRITERIA_HOST}tiles/${elem}.${mesh}.pmtiles`,
        attribution:
          ATTRIBUTION.jmacriteria +
          (meta.reference_date ? `（基準日: ${meta.reference_date}）` : ''),
      });

      const [minzoon, maxzoom] = ZOOM_RANGE[mesh];

      map.addLayer({
        id: id,
        type: 'fill',
        source: id,
        'source-layer': sourceLayerId,
        minzoom: minzoon,
        maxzoom: maxzoom,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': 'rgb(0,0,0,0)',
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'dragging'], false],
            PC.fill_outline_color,
            ['boolean', ['feature-state', 'fix'], false],
            PC.fill_outline_color_fix,
            ['boolean', ['feature-state', 'hover'], false],
            PC.fill_outline_color_hover,
            PC.fill_outline_color,
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'dragging'], false],
            PC.fill_opacity,
            ['boolean', ['feature-state', 'fix'], false],
            PC.fill_opacity_fix,
            ['boolean', ['feature-state', 'hover'], false],
            PC.fill_opacity_hover,
            PC.fill_opacity,
          ],
        },
      });
    });
  }
};
