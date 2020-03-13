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
            { x: 0, y: 0 },
            { x: 5, y: 5 }
          ]
        }]
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
