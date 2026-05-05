/**
 * 情報パネル
 */
import { getCityInfoByCityCode } from './service/jmaCodeService';
import { fetchRainRiMs3 } from './service/rainriMs3Service';
import { OPTIONS } from './constant';

/**
 * セレクトボックスを初期化
 */
export const setupElementSelector = () => {
  const selectElement = document.getElementById('element-selector');
  OPTIONS.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.text = item.text;
    selectElement.appendChild(option);
  });
  selectElement.selectedIndex = 0;
};

/**
 * ズームレベルを表示
 */
export const updateZoomInfo = (map) => {
  const zoomInfo = document.getElementById('zoomlevel');
  zoomInfo.innerHTML = `ズームレベル:${Math.round(map.getZoom() * 100) / 100}`;
};

const formatValue = (elem, level, v) => {
  if (!Number.isFinite(v)) {
    return v;
  } else {
    if (v < 0) {
      return '-';
    } else if (elem == 'rainri' && !level.endsWith('sri')) {
      return parseFloat(v) / 10;
    } else {
      return v;
    }
  }
};

/**
 * 情報パネルを更新
 */
export const updateInfoPanel = async (props) => {
  const contentInfo = document.getElementById('contentInfo');
  if (props) {
    const selected = document.getElementById('element-selector').value ?? [
      undefined,
      undefined,
    ];
    const [elem, level] = selected.split(',');

    const mesh = props.ms3 || props.msjma5k || props.ms2;
    const meshType = props.ms3
      ? '3次メッシュ'
      : props.msjma5k
        ? 'JMA5kmメッシュ'
        : '2次メッシュ';
    const code = props.code;
    const cityInfo = getCityInfoByCityCode(code);
    // 格子情報と選択中の要素のグリッド値
    let html = `
<table>
  <tr>
    <td class="px-2">${meshType}</td>
    <td class="px-2">${mesh}</td>
  </tr>`;
    // 地域コードがあれば地域情報を表示
    if (code) {
      html += `
  <tr>
    <td class="px-2">${cityInfo?.prefname}</td>
    <td class="px-2">（${cityInfo?.prefname_kn}）</td>
  </tr>
  <tr>
    <td class="px-2">${cityInfo?.firstareaname}</td>
    <td class="px-2">（${cityInfo?.firstareaname_kn}）</td>
  </tr>
  <tr>
    <td class="px-2">${cityInfo?.matomeareaname}</td>
    <td class="px-2">（${cityInfo?.matomeareaname_kn}）</td>
  </tr>
  <tr>
    <td class="px-2">${cityInfo?.cityname}</td>
    <td class="px-2">（${cityInfo?.cityname_kn}）</td>
  </tr>`;
    }
    html += `
  <tr>
    <td class="px-2">グリッドの値</td>
    <td class="px-2 text-lg font-bold">${props[level] >= 0 ? formatValue(elem, level, props[level]) : 'なし'}</td>
  </tr>
</table>`;
    // 当該格子の基準値も表示
    if (elem == 'rainri' && props.ms3) {
      const ms3 = props.ms3;
      const criteria = await fetchRainRiMs3(ms3);
      criteria
        .map((c) => Object.entries(c))
        .forEach((entries) => {
          html += '<hr>';
          html += createTable(elem, entries);
        });
    } else {
      const entries = Object.entries(props).filter(
        ([k, _]) => !['ms2', 'msjma5k', 'ms3', 'code'].includes(k),
      );
      html += '<hr>';
      html += createTable(elem, entries);
    }
    contentInfo.innerHTML = html;
  } else {
    contentInfo.innerHTML = 'Hover over on a grid';
  }
};

const createTable = (elem, entries) => {
  let html = '<table>';
  for (let i = 0; i < entries.length; i += 2) {
    html += '<tr>';
    const [k1, v1] = entries[i];
    html += `
          <td class="px-2">${k1}</td>
          <td class="px-2">${formatValue(elem, k1, v1)}</td>`;
    if (entries[i + 1]) {
      const [k2, v2] = entries[i + 1];
      html += `
          <td class="px-2">${k2}</td>
          <td class="px-2">${formatValue(elem, k2, v2)}</td>`;
    } else {
      html += '<td></td><td></td>';
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
};
