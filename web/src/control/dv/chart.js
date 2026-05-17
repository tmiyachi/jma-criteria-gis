/**
 * 土砂災害基準グラフ
 */
import * as d3 from 'd3';

const CHART_CONFIG = [
  { level: 'lv2', color: '#f2e700' },
  { level: 'lv4', color: '#a0a' },
  { level: 'lv5', color: 'black' },
];

export class SoilCriteriaLineChart {
  constructor(selector) {
    this.selector = selector;
    this.width = 250;
    this.height = 200;
    this.margin = { top: 10, right: 20, bottom: 40, left: 40 };

    this.init();
  }

  init() {
    this.svg = d3
      .select(this.selector)
      .attr('width', this.width)
      .attr('height', this.height);

    // 初期化時はデータがないので隠す
    this.svg.style('display', 'none');

    // スケール
    this.xScale = d3
      .scaleLinear()
      .range([this.margin.left, this.width - this.margin.right]);
    this.yScale = d3
      .scaleLinear()
      .domain([0, 155]) // 1時間雨量0~150ミリ
      .range([this.height - this.margin.bottom, this.margin.top]);
    // 軸
    this.svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.height - this.margin.bottom})`)
      .append('text')
      .attr('x', (this.width + this.margin.left - this.margin.right) / 2)
      .attr('y', 30)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text('土壌雨量指数');
    this.svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${this.margin.left}, 0)`)
      .call(d3.axisLeft(this.yScale).tickValues([0, 50, 100, 150]))
      .append('text')
      .attr('transform', 'rotate(-90)') // 反時計回りに90度回転
      .attr(
        'x',
        -(this.height - this.margin.top - this.margin.bottom) / 2 -
          this.margin.top,
      )
      .attr('y', -30)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .text('1時間雨量');
    // パス生成器
    this.lineGenerator = d3
      .line()
      // 最初に土壌雨量指数が0になる雨量（インデックス）以降は軸に重なるので描画しない
      .defined((d, i, data) => d > 0 || (i > 0 && data[i - 1] > 0))
      .x((d) => this.xScale(d))
      .y((_, i) => this.yScale(i))
      .curve(d3.curveMonotoneY);
    // パスを空データで初期化
    CHART_CONFIG.forEach((c) => {
      this.svg
        .append('path')
        .attr('class', `line-${c.level}`)
        .attr('fill', 'none')
        .attr('stroke', c.color)
        .attr('stroke-width', 2);
    });
  }

  async update(criteria) {
    if (!criteria) {
      this.svg.style('display', 'none'); // 空データの場合は隠す
      return;
    }

    // 基準値取得
    const decodedCriteria = Object.entries(criteria).reduce((acc, [k, v]) => {
      acc[k] = typeof v === 'string' ? decodeFromRLE(v) : v;
      return acc;
    }, {});

    if (!decodedCriteria) {
      this.svg.style('display', 'none');
      return;
    }

    this.svg.style('display', null);

    // 横軸スケールの調整 (土壌雨量指数300を最小とする)
    const allValues = CHART_CONFIG.flatMap(
      (c) => decodedCriteria[c.level] || [],
    ).filter((v) => v != null);
    const dataMax = allValues.length > 0 ? d3.max(allValues) : 0;
    this.xScale.domain([0, Math.max(300, dataMax)]).nice();
    // 軸の更新
    this.svg
      .select('.x-axis')
      .transition()
      .duration(100)
      .call(d3.axisBottom(this.xScale).ticks(5));

    // データ更新
    CHART_CONFIG.forEach((config) => {
      const data = decodedCriteria[config.level] || [];
      // パスの更新
      const line = this.svg.select(`.line-${config.level}`);
      const isNew = !line.attr('d');
      line
        .datum(data)
        .transition()
        .duration(100)
        .delay(isNew ? 100 : 0)
        .attr('d', this.lineGenerator);
    });
  }
}

const decodeFromRLE = (rleString) => {
  if (!rleString) {
    return [];
  }
  return rleString.split(',').flatMap((pair) => {
    const [val, count] = pair.split(':').map(Number);
    return Array(count).fill(val);
  });
};
