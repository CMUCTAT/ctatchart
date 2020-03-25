/**
 * @overview CTAT component for working with two dimentional charts.
 */
/** @module CTATChart */
/** @requires module: cdn.ctat.cmu.edu/latest/ctat.min.js */
/*global CTAT CTATGlobalFunctions:true*/
import Chart from 'chart.js';

function closest(arr, value) {
  return arr.reduce(
    (prev, cur) =>
      (Math.abs(cur - value) < Math.abs(prev - value) ? cur : prev));
}

export default class CTATChart extends CTAT.Component.Base.Tutorable {
  constructor () {
    super("CTATChart", "TwoDimensionChart");
    this._chart = null;

    this.init = this._init;
  }

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
    
  get dataMinimumX() {
    return this.getDataValue('data-ctat-minimum-x', 0);
  }
  set dataMinX(val) {
    this.getDivWrap().setAttribute('data-ctat-minimum-x', `${val}`);
  }
  get dataMinimumY() {
    return this.getDataValue('data-ctat-minimum-y', 0);
  }
  set dataMinY(val) {
    this.getDivWrap().setAttribute('data-ctat-minimum-y', `${val}`);
  }
  get dataMaximumX() {
    return this.getDataValue('data-ctat-maximum-x', 10);
  }
  set dataMaxX(val) {
    this.getDivWrap().setAttribute('data-ctat-maximum-x', `${val}`);
  }
  get dataMaximumY() {
    return this.getDataValue('data-ctat-maximum-y', 10);
  }
  set dataMaxY(val) {
    this.getDivWrap().setAttribute('data-ctat-maximum-y', `${val}`);
  }
  get dataStepX() {
    return this.getDataValue('data-ctat-step-x', 1);
  }
  set dataStepX(val) {
    this.getDivWrap().setAttribute('data-ctat-step-x', `${val}`);
  }
  get dataStepY() {
    return this.getDataValue('data-ctat-step-y', 1);
  }
  set dataStepY(val) {
    this.getDivWrap().setAttribute('data-ctat-step-y', `${val}`);
  }

  setMinimumX(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad minimum x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.min = vn);
      this.chart.update();
    }
  }
  adjustMinimumX(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.min += vn);
      this.chart.update();
    }
  }
      
  setMinimumY(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad minimum y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.min = vn);
      this.chart.update();
    }
  }
  adjustMinimumY(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.min += vn);
      this.chart.update();
    }
  }
  
  setMaximumX(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad maximum x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.max = vn);
      this.chart.update();
    }
  }
  adjustMaximumX(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.max += vn);
      this.chart.update();
    }
  }

  setMaximumY(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad maximum y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.max = vn);
      this.chart.update();
    }
  }
  adjustMaximumY(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust y value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.max += vn);
      this.chart.update();
    }
  }

  setStepX(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.stepSize = vn);
      this.chart.update();
    }
  }
  adjustStepX(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad step delta x value: ${value}`);
    } else {
      this.chart.options.scales.xAxes.forEach(axis => axis.ticks.stepSize += vn);
      this.chart.update();
    }
  }
      
  setStepY(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.chart.options.scales.yAxes.forEach(axis => axis.ticks.stepSize = vn);
      this.chart.update();
    }
  }
  adjustStepY(value) {
    const vn = Number(value);
    if (!value || isNaN(vn)) {
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
          //if (elements.length > 0) {
          //  elements.forEach(ele => this.chart.data.datasets[ele._datasetIndex].data.splice(ele._index,1)); }
          if (this.isPoint(point.x, point.y)) {
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

}

window.CTAT.ComponentRegistry.addComponentType('CTATChart', CTATChart);

// Needed if charts are to be printed.
// https://www.chartjs.org/docs/latest/general/responsive.html#important-note
window.addEventListener("beforeprint", () => {
  for (let id in Chart.instances) {
    Chart.instances[id].resize();
  }
});
