/**
 * 定数
 */
/** GIS地図ベクトルタイルのホスト */
export const GIS_HOST = JMA_GIS_HOST ?? 'http://localhost'; // eslint-disable-line no-undef
/** 基準要素 */
export const ELEMENTS = Object.freeze(['rainsri', 'rainri', 'soil']);
/** メッシュ名 */
export const MESHES = Object.freeze(['ms2', 'msjma5k', 'ms3']);
/** レイヤーID */
export const MESH_LAYER_IDS = Object.freeze(
  ELEMENTS.map((elem) => MESHES.map((mesh) => `elem-${elem}-${mesh}`)),
);
export const PAINT_CONFIG = Object.freeze({
  /** 固定選択時の格子の透明度 */
  fill_opacity_fix: 1.0,
  /** マウスホバー時の格子の透明度 */
  fill_opacity_hover: 0.9,
  /** マウス非ホバー時の格子の透明度 */
  fill_opacity: 0.7,
  /** 固定選択時の格子の線色 */
  fill_outline_color_fix: 'black',
  /** マウスホバー時の格子の線色 */
  fill_outline_color_hover: '#627BC1',
  /** マウス非ホバー時の格子の線色 */
  fill_outline_color: 'transparent',
});

export const HOVERED_GRID_FILL_OPACITY_VALUE = 0.9;

export const GRID_FILL_OPACITY_VALUE = 0.7;
/** 各メッシュレイヤーを表示するズームレベル */
export const ZOOM_RANGE = Object.freeze({
  ms2: [4, 6],
  msjma5k: [6, 8],
  ms3: [8, 14],
});
/** 凡例カラーリスト */
export const COLORS = Object.freeze([
  '#1c3f75',
  '#116797',
  '#068fb9',
  '#7bb877',
  '#f1e235',
  '#e39860',
  '#d64e8b',
  '#a42e56',
  '#730e22',
  '#4a0000',
]);
/** 基準要素の凡例閾値 */
export const LEVELS = Object.freeze({
  rainsri: [1, 8, 12, 16, 24, 32, 40, 50, 60, 70],
  rainri: [1, 4, 8, 12, 16, 20, 40, 60, 200, 500],
  soil: [1, 4500, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000],
});
/** ソース情報に表示するリンク */
export const ATTRIBUTION = Object.freeze({
  jmagis:
    '<a href="https://www.data.jma.go.jp/developer/gis.html" target="_blank">気象庁「予報区等GISデータ」を加工</a>',
  gis: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>',
  jmacriteria:
    '<a href="https://www.jma.go.jp/jma/kishou/know/kijun/index.html" target="_blank">気象庁「特別警報の指標及び危険警報・警報・注意報発表基準一覧表」を加工',
});
/** 基準要素セレクトボックス */
export const OPTIONS = Object.freeze([
  { text: 'レベル2大雨注意報の表面雨量指数基準値', value: 'rainsri,lv2' },
  { text: 'レベル3大雨警報の表面雨量指数基準値', value: 'rainsri,lv3' },
  { text: 'レベル4大雨危険警報の表面雨量指数基準値', value: 'rainsri,lv4' },
  {
    text: 'レベル4大雨危険警報の表面雨量指数基準値（危険警報対象）',
    value: 'rainsri,lv4_urgent',
  },
  { text: 'レベル5大雨特別警報の表面雨量指数基準値', value: 'rainsri,lv5' },
  { text: 'レベル2大雨注意報の流域雨量指数基準値', value: 'rainri,lv2' },
  {
    text: 'レベル2大雨警報の流域雨量指数基準値（複合基準）',
    value: 'rainri,lv3ri',
  },
  { text: 'レベル3大雨警報の流域雨量指数基準値', value: 'rainri,lv3' },
  {
    text: 'レベル3大雨警報の流域雨量指数基準値（複合基準）',
    value: 'rainri,lv3ri',
  },
  { text: 'レベル4大雨危険警報の流域雨量指数基準値', value: 'rainri,lv4' },
  {
    text: 'レベル4大雨危険警報の流域雨量指数基準値（危険警報対象）',
    value: 'rainri,lv4_urgent',
  },
  { text: 'レベル5大雨特別警報の流域雨量指数基準値', value: 'rainri,lv5' },
  { text: 'レベル2土砂災害注意報の基準線面積', value: 'soil,lv2' },
  { text: 'レベル4土砂災害危険警報の基準線面積', value: 'soil,lv4' },
  { text: 'レベル5土砂災害特別警報の基準線面積', value: 'soil,lv5' },
]);
/** 基準値詳細に表示する基準値属性 */
export const DISPLAY_PROPS_CONFIG = Object.freeze({
  rainsri: {
    lv5: 'レベル5',
    lv4_urgent: 'レベル4(危険警報)',
    lv4: 'レベル4',
    lv3: 'レベル3',
    lv2: 'レベル2',
  },
  rainri: {
    rcode: '河川コード',
    rname: '河川名',
    lv5: 'レベル5',
    lv4_urgent: 'レベル4(危険警報)',
    lv4: 'レベル4',
    lv3: 'レベル3',
    lv3ri: 'レベル3(複合/流域)',
    lv3sri: 'レベル3(複合/表面)',
    lv2: 'レベル2',
    lv2ri: 'レベル2(複合/流域)',
    lv2sri: 'レベル2(複合/表面)',
  },
  soil: {
    lv5: 'レベル5',
    lv4: 'レベル4',
    lv2: 'レベル2',
  },
});
