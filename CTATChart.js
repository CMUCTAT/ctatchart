/**
 * @overview CTAT component for working with two dimensional charts.
 */
/** @module CTATChart */
/** @requires module: cdn.ctat.cmu.edu/latest/ctat.min.js */
/*global CTAT CTATGlobalFunctions CTATSAI CTATConfiguration:true*/
//import Chart from 'chart.js';
import * as d3 from 'd3';

/**
 * Find the item in the array with the closest value to the one given.
 * @param arr: []number
 * @param value: number
 * @returns :number
 */
function closest(arr, value) {
  return arr.reduce(
    (prev, cur) =>
      (Math.abs(cur - value) < Math.abs(prev - value) ? cur : prev));
}

function controller_name(aComponent) {
  if (aComponent instanceof CTAT.Component.Base.Tutorable) {
    return aComponent.getName();
  } else if (aComponent instanceof CTATSAI) {
    return aComponent.getSelection();
  } else if (aComponent instanceof String) {
    return aComponent;
  } else if (aComponent instanceof Element) {
    return aComponent.id;
  }
  return null;
}

function halo(text) {
  text.select(function() {
    return this.parentNode.insertBefore(this.cloneNode(true), this);
  })
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-width', 4)
    .attr('stroke-linejoin', 'round');
}

export default class CTATChart extends CTAT.Component.Base.Tutorable {
  constructor () {
    super("CTATChart", "TwoDimensionChart");
    this._chart = null;

    this.init = this._init;
  }

  /** Get the chart instance */
  get chart() { return this._chart; }
  get _xScale() {
    return this.chart.data.datasets.length
      ? this.chart.scales[this.chart.getDatasetMeta(0).xAxisID]
      : null;
  }
  get _yScale() {
    return this.chart.scales[this.chart.getDatasetMeta(0).yAxisID];
  }
  /**
   * @returns {x: number, y: number}
   */
  getValueForPixel(x, y) {
    if (this.dataIsSnapping) {
      return {
        x: this.closestXtick(this._xScale.getValueForPixel(x)),
        y: this.closestYtick(this._yScale.getValueForPixel(y))
      };
    } else {
      return {
        x: this._xScale.getValueForPixel(x),
        y: this._yScale.getValueForPixel(y)
      }
    }
  }
  /**
   * @param value: number - an x axis value
   * @returns : number - the value of the closest x tickmark to value.
   */
  closestXtick(value) { return closest(this._xScale.ticks, value); }
  /**
   * @param value: number - an y axis value
   * @returns : number - the value of the closest y tickmark to value.
   */
  closestYtick(value) { return closest(this._yScale.ticks, value); }

  get dataIsSnapping() {
    const snap = this.getDivWrap().getAttribute('data-ctat-snapping');
    return snap ? CTATGlobalFunctions.stringToBoolean(snap) : true;
  }
  set dataIsSnapping(val) {
    this.getDivWrap().setAttribute('data-ctat-snapping', `${val}`);
  }

  getDataValue(key, def) {
    if (this.getDivWrap()) {
      const value = this.getDivWrap().getAttribute(key);
      const val = Number(value);
      return !value || isNaN(val) ? def : val;
    }
    return def;
  }
  getDataController(key) {
    const ctrls = this.getDivWrap().getAttribute(key);
    if (ctrls) { return ctrls.split(/\s*[;,]\s*/).map(c=>c.trim()); }
    return [];
  }

  get dataCtrlMinimumX() {
    return this.getDataController('data-ctat-ctrl-minimum-x');
  }
  get dataMinimumX() {
    return this.getDataValue('data-ctat-minimum-x', 0);
  }
  set dataMinimumX(val) {
    this.getDivWrap().setAttribute('data-ctat-minimum-x', `${val}`);
  }

  get dataCtrlMinimumY() {
    return this.getDataController('data-ctat-ctrl-minimum-y');
  }
  get dataMinimumY() {
    return this.getDataValue('data-ctat-minimum-y', 0);
  }
  set dataMinimumY(val) {
    this.getDivWrap().setAttribute('data-ctat-minimum-y', `${val}`);
  }

  get dataCtrlMaximumX() {
    return this.getDataController('data-ctat-ctrl-maximum-x');
  }
  get dataMaximumX() {
    return this.getDataValue('data-ctat-maximum-x', 10);
  }
  set dataMaximumX(val) {
    this.getDivWrap().setAttribute('data-ctat-maximum-x', `${val}`);
  }

  get dataCtrlMaximumY() {
    return this.getDataController('data-ctat-ctrl-maximum-y');
  }
  get dataMaximumY() {
    return this.getDataValue('data-ctat-maximum-y', 10);
  }
  set dataMaximumY(val) {
    this.getDivWrap().setAttribute('data-ctat-maximum-y', `${val}`);
  }

  get dataCtrlStepX() {
    return this.getDataController('data-ctat-ctrl-step-x');
  }
  get dataStepX() {
    return this.getDataValue('data-ctat-step-x', 1);
  }
  set dataStepX(val) {
    this.getDivWrap().setAttribute('data-ctat-step-x', `${val}`);
  }

  get dataCtrlStepY() {
    return this.getDataController('data-ctat-ctrl-step-y');
  }
  get dataStepY() {
    return this.getDataValue('data-ctat-step-y', 1);
  }
  set dataStepY(val) {
    this.getDivWrap().setAttribute('data-ctat-step-y', `${val}`);
  }

  setMinimumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum x value: ${value}`);
    } else {
      this.dataMinimumX = value;
      this._updateBottomAxis();
    }
  }
  adjustMinimumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust x value: ${value}`);
    } else {
      this.dataMinimumX += value;
      this._updateBottomAxis();
    }
  }

  setMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum y value: ${value}`);
    } else {
      this.dataMinimumY = value;
      this._updateLeftAxis();
    }
  }
  adjustMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust y value: ${value}`);
    } else {
      this.dataMinimumY += value;
      this._updateLeftAxis();
    }
  }

  setMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum x value: ${value}`);
    } else {
      this.dataMaximumX = value;
      this._updateBottomAxis();
    }
  }
  adjustMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust x value: ${value}`);
    } else {
      this.dataMaximumX += value;
      this._updateBottomAxis();
    }
  }

  setMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum y value: ${value}`);
    } else {
      this.dataMaximumY = value;
      this._updateLeftAxis();
    }
  }
  adjustMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust y value: ${value}`);
    } else {
      this.dataMaximumY += value;
      this._updateLeftAxis();
    }
  }

  setStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.dataStepX = value;
      this._updateBottomAxis();
    }
  }
  adjustStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta x value: ${value}`);
    } else {
      this.dataStepX += value;
      this._updateBottomAxis();
    }
  }

  setStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.dataStepY = value;
      this._updateLeftAxis();
    }
  }
  adjustStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta y value: ${value}`);
    } else {
      this.dataStepY += value;
      this._updateLeftAxis();
    }
  }

  _updateBottomAxis() {
    const rect = this.getDivWrap().getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    this._x = d3.scaleLinear()
      .domain([this.dataMinimumX, this.dataMaximumX]).nice()
      .range([this.margin.left, width - this.margin.right]);
    this._xAxis.selectAll("*").remove();
    this._xAxis.call(
      g => g.attr('transform', `translate(0,${height - this.margin.bottom})`)
        .call(d3.axisBottom(this._x).tickValues(d3.range(this.dataMinimumX,this.dataMaximumX+1,this.dataStepX)))
        .call(g => g.selectAll('.tick line').clone()
              .attr('y2', -height+this.margin.top+this.margin.bottom)
              .attr('stroke-opacity', 0.1))
    );
  }
  _updateLeftAxis() {
    const rect = this.getDivWrap().getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    this._y = d3.scaleLinear()
      .domain([this.dataMinimumY, this.dataMaximumY]).nice()
      .range([height - this.margin.bottom, this.margin.top]);
    this._yAxis.selectAll("*").remove();
    this._yAxis.call( // yAxis
      g => g.attr('transform', `translate(${this.margin.left},0)`)
        .call(d3.axisLeft(this._y).tickValues(d3.range(this.dataMinimumY,this.dataMaximumY+1, this.dataStepY)))
        .call(g => g.selectAll('.tick line').clone()
              .attr('x2', width-(this.margin.right+this.margin.left))
              .attr('stroke-opacity', 0.1))
    );
  }
  _init() {
    this.setInitialized(true);
    const graph_area = this.getDivWrap();
    this.setComponent(graph_area);
    this.addComponentReference(this, graph_area);
    const dga = d3.select(graph_area);
    this.margin = {top: 10, right: 10, bottom: 30, left: 30};
    const margin = {top: 10, right: 10, bottom: 30, left: 30};
    const rect = graph_area.getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    const svg = dga.append('svg').attr("viewBox", [0, 0, width, height]);
    let data = [];
    this._xAxis = svg.append('g');
    this._updateBottomAxis();
    this._yAxis = svg.append('g');
    this._updateLeftAxis();

    // Add listener for controller events.
    if (!CTATConfiguration.get('previewMode')) {
      document.addEventListener(CTAT.Component.Base.Tutorable.EventType.action,
                                this.handleAction.bind(this), false);
    }
  }

  addPoint(x, y) {
    this.chart.data.datasets.forEach(
      dataset => dataset.data.push({x: x, y: y}));
    this.chart.update();
  }
  removePoint(x, y) {
    this.chart.data.datasets.forEach(dataset => {
      for (let i = dataset.data.length - 1; i >= 0; i--) {
        if (dataset.data[i].x == x && dataset.data[i].y == y) {
          dataset.data.splice(i, 1);
        }
      }
    });
    this.chart.update();
  }
  isPoint(x, y) {
    return this.chart.data.datasets.some(
      dataset => dataset.data.some(point => point.x == x && point.y == y));
  }

  handleAction(evt) {
    if (!evt.detail.sai) { return; } // abort if no sai
    const ctrl_name = controller_name(evt.detail.component, this);
    // abort if invalid component
    if (!ctrl_name || ctrl_name == this.getName()) { return; }
    const action = evt.detail.sai.getAction(),
          input = evt.detail.sai.getInput();
    // abort if not valid action
    if (!['ButtonPresed',
          'Update',
          'UpdateTextField',
          'UpdateTextArea'].includes(action)) { return; }
    if (this.dataCtrlMinimumX.includes(ctrl_name)) {
      this.setMinimumX(input);
    }
    if (this.dataCtrlMinimumY.includes(ctrl_name)) {
      this.setMinimumY(input);
    }
    if (this.dataCtrlMaximumX.includes(ctrl_name)) {
      this.setMaximumX(input);
    }
    if (this.dataCtrlMaximumY.includes(ctrl_name)) {
      this.setMaximumY(input);
    }
    if (this.dataCtrlStepX.includes(ctrl_name)) {
      this.setStepX(input);
    }
    if (this.dataCtrlStepY.includes(ctrl_name)) {
      this.setStepY(input);
    }
  }
}
window.CTAT.ComponentRegistry.addComponentType('CTATChart', CTATChart);

// Needed if charts are to be printed.
// https://www.chartjs.org/docs/latest/general/responsive.html#important-note
window.addEventListener("beforeprint", () => {
  for (let id in Chart.instances) {
    Chart.instances[id].resize();
  }
});
