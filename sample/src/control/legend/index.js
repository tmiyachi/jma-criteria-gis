/**
 * 凡例カスタムコントロール
 */
import { COLORS, LEVELS, PAINT_CONFIG } from '@/constant';

export class LegendControl {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl legend-container';
    this.managedLayers = [];

    this._onStyleData = () => this.checkLayerVisibility();
  }

  onAdd(map) {
    this.map = map;

    // 基準値レイヤーリストの取得
    const allLayers = this.map.getStyle().layers || [];
    this.managedLayers = allLayers
      .map((layer) => layer.id)
      .filter((id) => id.startsWith('elem-'));

    // イベント登録
    this.map.on('styledata', this._onStyleData);

    // 初回実行
    this.checkLayerVisibility();

    return this.container;
  }

  checkLayerVisibility() {
    if (!this.map) return;

    // 表示されている最初のmanagedLayerを探す
    const activeLayerId = this.managedLayers.find((id) => {
      return this.map.getLayoutProperty(id, 'visibility') !== 'none';
    });

    if (activeLayerId) {
      const elem = activeLayerId.split('-')[1];
      this.update(elem);
    } else {
      // 表示中のレイヤーがなければ隠す
      this.container.style.display = 'none';
    }
  }

  onRemove() {
    // イベントの購読解除（必須）
    this.map.off('styledata', this._onStyleData);

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.map = undefined;
  }

  update(elem) {
    if (!LEVELS[elem]) {
      this.container.style.display = 'none';
      return;
    }
    this.container.style.display = 'block';

    const items = LEVELS[elem]
      .map((v, i) => {
        // COLORSのインデックス整合性は要確認（i+1かiか）
        const c = COLORS[i + 1] || '#ccc';
        const label = `${v}+`;

        return `
          <div class="legend-item">
            <svg width="18" height="18" style="margin-right: 8px; vertical-align: middle;">
              <rect width="18" height="18" fill="${c}" rx="2" fill-opacity="${PAINT_CONFIG.fill_opacity}"/>
            </svg>
            <span style="font-size: 12px; color: #333;">${label}</span>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = items;
  }
}
