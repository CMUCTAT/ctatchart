/**
 * @overview CTAT component for working with two dimentional charts.
 */
/** @module CTATChart */
/** @requires module: cdn.ctat.cmu.edu/latest/ctat.min.js */
/*global CTAT CTATGlobalFunctions:true*/
import Chart from 'chart.js';

export default class CTATChart extends CTAT.Component.Base.Tutorable {
  constructor () {
    super("CTATChart", "TwoDimensionChart");
    this._chart = null;

    this.init = this._init;
  }

  get chart() { return this._chart; }
  get _xScale() {
    return this._chart.data.datasets.length ? this._chart.scales[this._chart.getDatasetMeta(0).xAxisID] : null;
  }
  get _yScale() {
    return this._chart.scales[this._chart.getDatasetMeta(0).yAxisID];
  }
  getValueForPixel(x, y) {
    return {
      x: this._xScale.getValueForPixel(x),
      y: this._yScale.getValueForPixel(y)
    };
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
          data: [
            { x: 5, y: 5 }
          ]
        }]
      },
      options: {
        legend: {
          display: false
        },
        onClick: (evt, elements) => {
          const point = this.getValueForPixel(evt.offsetX, evt.offsetY);
          console.log(point);
          if (elements.length ==0 &&
              point.x > this._xScale.min && point.x < this._xScale.max &&
              point.y > this._yScale.min && point.y < this._yScale.max) {
            console.log('added');
            this.addPoint(point.x, point.y);
          }
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }],
          xAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }

  addPoint(x, y) {
    this.chart.data.datasets.forEach((dataset) => {
      dataset.data.push({x: x, y: y});
    });
    this.chart.update();
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
