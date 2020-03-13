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
    var graph_area = this.getDivWrap();
    this.setComponent(graph_area);
    this.addComponentReference(this, graph_area);
    this._chart = new Chart(graph_area);
  }
}

window.CTAT.ComponentRegistry.addComponentType('CTATChart', CTATChart);
