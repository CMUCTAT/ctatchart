/**
 * @overview CTAT component for working with two dimensional charts.
 */
/** @module CTATChart */
/** @requires module: cdn.ctat.cmu.edu/latest/ctat.min.js */
/*global CTAT CTATGlobalFunctions:true*/
import Chart from 'chart.js';

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
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.min = vn);
      this.chart.update();
    }
  }
  adjustMinimumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.min += vn);
      this.chart.update();
    }
  }
      
  setMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.min = vn);
      this.chart.update();
    }
  }
  adjustMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.min += vn);
      this.chart.update();
    }
  }
  
  setMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.max = vn);
      this.chart.update();
    }
  }
  adjustMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.max += vn);
      this.chart.update();
    }
  }

  setMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.max = vn);
      this.chart.update();
    }
  }
  adjustMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.max += vn);
      this.chart.update();
    }
  }

  setStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.stepSize = vn);
      this.chart.update();
    }
  }
  adjustStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.stepSize += vn);
      this.chart.update();
    }
  }
      
  setStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.stepSize = vn);
      this.chart.update();
    }
  }
  adjustStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.stepSize += vn);
      this.chart.update();
    }
  }
      
  _init() {
    this.setInitialized(true);
    const graph_area = this.getDivWrap();
    this.setComponent(graph_area);
    this.addComponentReference(this, graph_area);
    this._chart = new Chart(graph_area, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Dataset',
          data: []
        }]
      },
      options: {
        legend: {
          display: false
        },
        onClick: (evt, elements) => {
          const point = this.getValueForPixel(evt.offsetX, evt.offsetY);
          //console.log(point, elements);
          if (elements.length > 0) {
            elements.filter(el => el._type == 'point')
              .map(ele => ele._chart.data.datasets[ele._datasetIndex].data[ele._index])
              .forEach(point => this.removePoint(point.x, point.y));
            
            this.chart.update();
          } else if (this.isPoint(point.x, point.y)) {
            this.removePoint(point.x, point.y);
          } else if (point.x >= this._xScale.min
                     && point.x <= this._xScale.max
                     && point.y >= this._yScale.min
                     && point.y <= this._yScale.max) {
            this.addPoint(point.x, point.y);
          }
        },
        scales: {
          xAxes: [{
            ticks: {
              min: this.dataMinimumX,
              max: this.dataMaximumX,
              stepSize: this.dataStepX,
            }
          }],
          yAxes: [{
            ticks: {
              max: this.dataMaximumY,
              min: this.dataMinimumY,
              stepSize: this.dataStepY,
            }
          }]
        }
      }
    });

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
