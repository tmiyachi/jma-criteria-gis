/**
 * 3次メッシュコード検索カスタムコントロール
 */

export class SearchMeshControl {
  constructor(zoom = 10) {
    this.zoom = zoom;
  }

  onAdd(map) {
    this.map = map;

    this.container = document.createElement('div');
    this.container.className = 'maplibregl-ctrl meshcode-ctrl';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = '3次メッシュコード';
    this.input.maxLength = 8;

    this.button = document.createElement('button');
    this.button.textContent = '移動';
    this.button.style.cursor = 'pointer';
    this.button.disabled = true;

    this.onInput = () => {
      const value = this.input.value.trim();
      this.button.disabled = !/^\d{7,8}$/.test(value);
    };

    this.onClick = () => {
      try {
        // メッシュコードの中心へ移動
        const center = ms3ToCenter(this.input.value);
        this.map.easeTo({
          center,
          zoom: Math.max(this.map.getZoom(), this.zoom),
          duration: 800,
        });
        // その地点をクリック
        this.map.once('moveend', () => {
          const point = this.map.project(center);

          this.map.fire('click', {
            lngLat: { lng: center[0], lat: center[1] },
            point,
          });
        });
      } catch (e) {
        alert(e.message);
      }
    };

    this.input.addEventListener('input', this.onInput);
    this.button.addEventListener('click', this.onClick);

    this.container.appendChild(this.input);
    this.container.appendChild(this.button);

    return this.container;
  }

  onRemove() {
    if (this.input && this.onInput) {
      this.input.removeEventListener('input', this.onInput);
    }

    if (this.button && this.onClick) {
      this.button.removeEventListener('click', this.onClick);
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.map = undefined;
    this.container = undefined;
    this.input = undefined;
    this.button = undefined;
    this.onInput = undefined;
    this.onClick = undefined;
  }
}

/**
 * @param {String|Number} ms3 3次メッシュコード
 * @returns メッシュの中心経度、緯度
 */
const ms3ToCenter = (ms3) => {
  const code = String(ms3).padEnd(8, '0');
  if (!/^\d{8}$/.test(code)) {
    throw new Error('3次メッシュコードは8桁で入力してください');
  }

  const dx = 45.0 / 3600;
  const dy = 30.0 / 3600;

  const iy1 = parseInt(code.slice(0, 2), 10);
  const ix1 = parseInt(code.slice(2, 4), 10);
  const iy2 = parseInt(code[4], 10);
  const ix2 = parseInt(code[5], 10);
  const iy3 = parseInt(code[6], 10);
  const ix3 = parseInt(code[7], 10);

  // 南西端から格子の半分を補正
  const lon = (ix1 * 80 + ix2 * 10 + ix3) * dx + 100 + dx / 2;
  const lat = (iy1 * 80 + iy2 * 10 + iy3) * dy + dy / 2;

  return [lon, lat];
};
