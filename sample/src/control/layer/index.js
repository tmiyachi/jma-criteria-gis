/**
 * レイヤー切り替えカスタムコントロール
 */

export default class LayerControl {
  constructor(layers) {
    // layers: { id: "レイヤーID", label: "表示名" } の配列
    this.layers = layers;
    this.container = null;
    this.inputs = [];
  }

  onAdd(map) {
    this.map = map;
    this.container = document.createElement('div');
    this.container.className =
      'maplibregl-ctrl maplibregl-ctrl-group maplibregl-layer-ctrl';

    this.layers.forEach((layer) => {
      const label = document.createElement('label');
      label.className = 'layer-item';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'map-layer-group';
      radio.dataset.id = layer.id;
      this.inputs.push(radio);

      if (layer.id == 'jmagis') {
        radio.checked = true;
      }

      radio.onchange = () => this.updateLayers();

      const text = document.createTextNode(layer.label);

      label.appendChild(radio);
      label.appendChild(text);
      this.container.appendChild(label);
    });

    return this.container;
  }

  updateLayers() {
    this.inputs.forEach((input) => {
      const layerId = input.dataset.id;
      const isVisible = input.checked ? 'visible' : 'none';

      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, 'visibility', isVisible);
      } else {
        const style = this.map.getStyle();
        style.layers.forEach((layer) => {
          if (layer.source === layerId) {
            this.map.setLayoutProperty(layer.id, 'visibility', isVisible);
          }
        });
      }
    });
  }

  onRemove() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.map = undefined;
    this.inputs = [];
  }
}
