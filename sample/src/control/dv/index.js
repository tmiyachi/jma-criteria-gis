/**
 * 基準値データ可視化カスタムコントロール
 */
import { debounce } from 'lodash-es';

import { getCityInfoByCityCode, fetchRainRiMs3 } from '@/service';
import { SoilCriteriaLineChart } from './chart';
import { COLORS, LEVELS, OPTIONS } from '@/constant';

export class DataViewerControl {
  constructor() {
    // マウスホバーしているレイヤー情報
    this.hoveredState = null; // { source, sourceLayer, id }
    // マウスクリックで固定しているレイヤー情報
    this.selectedState = null;
    // 現在選択中の要素・レベル
    this.state = { elem: null, level: null };
    // マウスの状態
    this.isDragging = false;

    this.debouncedRenderDetails = debounce((props) => {
      this.renderDetails(props);
    }, 50);
  }

  onAdd(map) {
    this.map = map;
    this.container = this._createUI();

    // マップに登録されている基準値レイヤー（elemで始まる）リストの取得
    const allLayers = this.map.getStyle().layers;
    this.managedLayers = allLayers
      .map((layer) => layer.id)
      .filter((id) => id.startsWith('elem-'));

    // onRemoveで削除できるようにイベントハンドラをプロパティに保持
    this._onZoom = () => this.onZoom();
    this._onLayerChange = () => this.onLayerChange();
    this._onMouseMove = (e) => this.onMouseMove(e);
    this._onMouseLeave = () => this.onMouseLeave();
    this._onDragStart = () => this.onDragStart();
    this._onDragEnd = (e) => this.onDragEnd(e);
    this._onClick = (e) => this.onClick(e);

    // イベント登録
    this.map.on('zoom', this._onZoom);
    this.layerSelect.addEventListener('change', this._onLayerChange);
    this.managedLayers.forEach((layerId) => {
      this.map.on('mousemove', layerId, this._onMouseMove);
      this.map.on('mouseleave', layerId, this._onMouseLeave);
      this.map.on('click', layerId, this._onClick);
    });
    this.map.on('dragstart', this._onDragStart);
    this.map.on('dragend', this._onDragEnd);

    // 初期状態の反映
    this.onLayerChange();
    this.onZoom();

    return this.container;
  }

  _createUI() {
    const container = document.createElement('div');
    // container.className = 'maplibregl-ctrl';
    container.innerHTML = `
      <div class="maplibregl-ctrl dv-container">
        <span id="dv-zoom-display" class="pr-2"></span>
        <select id="dv-layer-select"></select>
      </div>
      <div class="maplibregl-ctrl dv-container">
        <div id="dv-feature-detail"></div>
        <svg id="dv-soil-chart"></svg>
      </div>
    `;

    this.zoomDisplay = container.querySelector('#dv-zoom-display');
    this.layerSelect = container.querySelector('#dv-layer-select');
    this.featureDetails = container.querySelector('#dv-feature-detail');
    this.chart = new SoilCriteriaLineChart(
      container.querySelector('#dv-soil-chart'),
    );

    OPTIONS.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.text = item.text;
      this.layerSelect.appendChild(option);
    });
    this.layerSelect.selectedIndex = 0;

    return container;
  }

  onRemove() {
    // debounceのキャンセル
    this.debouncedRenderDetails.cancel();

    // イベントの削除
    this.map.off('zoom', this._onZoom);
    this.layerSelect.removeEventListener('change', this._onLayerChange);

    this.managedLayers.forEach((layerId) => {
      this.map.off('mousemove', layerId, this._onMouseMove);
      this.map.off('mouseleave', layerId, this._onMouseLeave);
      this.map.off('click', layerId, this._onClick);
    });
    this.map.off('dragstart', this._onDragStart);
    this.map.off('dragend', this._onDragEnd);

    // DOMの削除
    this.container.parentNode?.removeChild(this.container);
    this.map = undefined;
  }

  onZoom() {
    const zoom = this.map.getZoom();

    // ズームレベル表示の更新
    this.zoomDisplay.textContent = `ズームレベル: ${zoom.toFixed(2)}`;

    // 固定モードの場合のリセット処理
    if (this.selectedState) {
      const { elem } = this.state;
      // 現在表示されているレイヤー
      const activeLayer = this.managedLayers.find((layerId) => {
        if (!layerId.startsWith(`elem-${elem}`)) return false;

        const layer = this.map.getLayer(layerId);
        if (!layer) return false;

        const isVisible =
          (layer.minzoom === undefined || zoom >= layer.minzoom) &&
          (layer.maxzoom === undefined || zoom < layer.maxzoom);

        const isLayoutVisible =
          this.map.getLayoutProperty(layerId, 'visibility') !== 'none';

        return isVisible && isLayoutVisible;
      });

      if (activeLayer) {
        const activeSourceLayer = this.map.getLayer(activeLayer).sourceLayer;

        if (this.selectedState.sourceLayer !== activeSourceLayer) {
          // メッシュの解像度が切り替わったので解除
          this.clearSelectedState();
          this.renderDetails(null);
        }
      } else {
        this.clearSelectedState();
        this.renderDetails(null);
      }
    }
  }

  onLayerChange() {
    const [elem, level] = this.layerSelect.value.split(',');
    this.state = { elem, level };

    this.updateLayers();

    this.clearSelectedState(); // 固定状態を解除
    this.debouncedRenderDetails.cancel(); // 詳細情報の更新待ちをキャンセル
    this.renderDetails(null); // 選択変更時はリセット
  }

  // レイヤーの状態を更新
  updateLayers() {
    const { elem, level } = this.state;
    const color = colorExpression(elem, level);

    this.managedLayers.forEach((layerId) => {
      if (!this.map.getLayer(layerId)) return;
      const isTarget = layerId.startsWith(`elem-${elem}`);

      this.map.setLayoutProperty(
        layerId,
        'visibility',
        isTarget ? 'visible' : 'none',
      );
      if (isTarget) {
        this.map.setPaintProperty(layerId, 'fill-color', color);
      }
    });
  }

  onMouseMove(e) {
    if (e.features.length > 0) {
      const feature = e.features[0];
      if (feature.id === this.hoveredState?.id) return;

      this.clearHoverState();
      this.hoveredState = {
        source: feature.source,
        sourceLayer: feature.sourceLayer,
        id: feature.id,
      };

      this.map.setFeatureState(this.hoveredState, { hover: true });
      if (!this.isDragging) {
        this.map.getCanvas().style.cursor = 'pointer';
      }

      this.currentHoverProps = feature.properties; // プロパティを保持
      if (!this.selectedState) {
        this.debouncedRenderDetails(this.currentHoverProps);
      }
    }
  }

  onMouseLeave() {
    // マウスホバー状態の解除
    this.clearHoverState();
    if (!this.isDragging) {
      this.map.getCanvas().style.cursor = '';
    }
    this.currentHoverProps = null;

    // 固定表示モードのときは解除しない
    if (!this.selectedState) {
      this.renderDetails(null); // マウスが離れた際はdebounce不要
    }
  }

  onClick(e) {
    if (e.features.length > 0) {
      const feature = e.features[0];
      const newState = {
        source: feature.source,
        sourceLayer: feature.sourceLayer,
        id: feature.id,
      };

      // すでに同じものが選択されていたら解除（トグル）
      if (this.selectedState?.id === feature.id) {
        this.clearSelectedState();
        this.renderDetails(this.currentHoverProps); // ホバー中の情報に戻す
      } else {
        this.clearSelectedState();
        this.selectedState = newState;
        this.map.setFeatureState(this.selectedState, { fix: true });
        this.renderDetails(feature.properties); // 固定情報を表示
      }
    }
  }

  onDragStart() {
    this.isDragging = true;
    this.map.getCanvas().style.cursor = 'grabbing';

    this.clearHoverState();
  }

  onDragEnd(e) {
    this.isDragging = false;
    const features = this.map.queryRenderedFeatures(e.point, {
      layers: this.managedLayers,
    });
    if (features.length > 0) {
      this.map.getCanvas().style.cursor = 'pointer';
    } else {
      this.map.getCanvas().style.cursor = '';
    }
  }

  clearHoverState() {
    if (this.hoveredState) {
      this.map.setFeatureState(this.hoveredState, { hover: false });
      this.hoveredState = null;
    }
  }

  clearSelectedState() {
    if (this.selectedState) {
      this.map.setFeatureState(this.selectedState, { fix: false });
      this.selectedState = null;
    }
  }

  // 詳細情報パネルの更新
  async renderDetails(props) {
    if (!props) {
      this.featureDetails.textContent = 'Hover over on a grid';
      this.chart.update(null);
      return;
    }

    const targetMesh = props.ms3 || props.msjma5k || props.ms2; // 対象の格子
    const { elem, level } = this.state;

    let html = createBasicTable(props, elem, level);
    if (elem === 'rainri' && props.ms3) {
      // 流域雨量指数基準の場合は1格子に複数基準があるのでタイルに格納できない。分離した格子単位のデータを取得して全河川分表示。
      const criteria = await fetchRainRiMs3(props.ms3);
      // データ取得中に表示対象の格子が変わっていたら中止
      if (targetMesh !== this.getCurrentHoverMesh()) return;
      html += '<hr>';
      html += criteria
        .map((c) => Object.entries(c))
        .map((entries) => createDetailTable(elem, entries))
        .join('<hr>');
    } else {
      // その他の場合はタイルの格子に紐づいたプロパティから地理情報以外を表示
      const entries = Object.entries(props).filter(
        ([k, _]) => !['ms2', 'msjma5k', 'ms3', 'code'].includes(k),
      );
      html += '<hr>';
      html += createDetailTable(elem, entries);

      // 土砂の場合はグラフ更新
      if (elem == 'soil') {
        this.chart.update(props.ms3);
        // 土砂のデータ取得中に表示対象の格子が変わっていたら中止
        if (targetMesh !== this.getCurrentHoverMesh()) return;
      }
    }
    this.featureDetails.innerHTML = html;
  }

  getCurrentHoverMesh() {
    return (
      this.currentHoverProps?.ms3 ||
      this.currentHoverProps?.msjma5k ||
      this.currentHoverProps?.ms2
    );
  }
}

// 要素に応じて値を文字列化
const formatValue = (elem, level, v) => {
  if (!Number.isFinite(v)) {
    return v;
  } else {
    if (v < 0) {
      return '-';
    } else if (elem == 'rainri' && !level.endsWith('sri')) {
      // 流域雨量指数基準は10倍した値がタイルに保存される
      return parseFloat(v) / 10;
    } else {
      return v;
    }
  }
};

// 基本情報テーブルの作成
const createBasicTable = (props, elem, level) => {
  const meshId = props.ms3 || props.msjma5k || props.ms2;
  const meshLabel = props.ms3 ? '3次' : props.msjma5k ? 'JMA5km' : '2次';

  const city = getCityInfoByCityCode(props.code);

  return `
      <table>
        <tr>
          <td class="px-2">${meshLabel}メッシュ</td>
          <td class="px-2">${meshId}</td>
        </tr>
        ${
          city
            ? `
          <tr>
            <td class="px-2">${city?.prefname}</td>
            <td class="px-2">${city?.prefname_kn}</td>
          </tr>
          <tr>
            <td class="px-2">${city?.firstareaname}</td>
            <td class="px-2">${city?.firstareaname_kn}</td>
          </tr>
          <tr>
            <td class="px-2">${city?.matomeareaname}</td>
            <td class="px-2">${city?.matomeareaname_kn}</td>
          </tr>
          <tr>
            <td class="px-2">${city?.cityname}</td>
            <td class="px-2">${city?.cityname_kn}</td>
          </tr>`
            : ''
        }
        <tr>
          <td class="px-2">グリッドの値</td>
          <td class="px-2 py-1 font-bold text-lg">${props[level] >= 0 ? formatValue(elem, level, props[level]) : 'なし'}</td>
        </tr>
      </table>
    `;
};

// 詳細情報テーブルの作成
const createDetailTable = (elem, entries) => {
  let html = '<table>';
  for (let i = 0; i < entries.length; i += 2) {
    html += '<tr>';
    const [k1, v1] = entries[i];
    html += `
      <td class="px-2">${k1}</td>
      <td class="px-2">${formatValue(elem, k1, v1)}</td>
    `;
    if (entries[i + 1]) {
      const [k2, v2] = entries[i + 1];
      html += `
        <td class="px-2">${k2}</td>
        <td class="px-2">${formatValue(elem, k2, v2)}</td>
      `;
    } else {
      html += '<td></td><td></td>';
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
};

// レイヤーのカラー表現の取得
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
