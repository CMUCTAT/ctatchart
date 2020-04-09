/**
 * @overview CTAT component for working with two dimensional charts.
 *
 * Actions:
 *  ChangeUpperHorizontalBoundary (:number)
 *  ChangeUpperVerticalBoundary (:number)
 *  ChangeLowerHorizontalBoundary (:number)
 *  ChangeLowerVerticalBoundary (:number)
 *  ChangeHorizontalInterval (:number)
 *  ChangeVerticalInterval (:number)
 * TODO:
 * <point> := "(:number,:number)"
 * <equation> := "y = 3x"
 * - Action: ChangeHorizontalLabel (:string)
 * - Action: ChangeVerticalLabel (:string)
 * - Action: ChangeHorizontalUnit (:string)
 * - Action: ChangeVerticalUnit (:string)
 * - Action: grapherError
 *   Input: PointOutOfBounds (When changing boundary results in point out of bounds)
 *   Input: curveNeedsMorePoints
 * - Action: IndicateLineAddIntent (-1)
 * - Action: IndicatePointAddIntent (-1)
 * - Action: grapherPointAdded (<point>)
 * - Action: grapherCurveAdded (<equation>)
 * - Action: StopPointAddIntent (-1)
 */
/** @module CTATChart */
/** @requires module: cdn.ctat.cmu.edu/latest/ctat.min.js */
/*global CTAT CTATGlobalFunctions CTATSAI CTATConfiguration:true*/
import * as d3 from 'd3';
import $ from 'jquery';

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

/**
 * Get the name of the controller component depending on the type of aComponent.
 * @argument aComponent: any
 * @returns :string
 */
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

/**
 * Returns a new SAI with the Selection and Action based on the given component.
 * @argument component: CTATComponent
 * @argument sai: CTATSAI
 * @returns :CTATSAI
 */
function rerouted_sai(component, sai) {
  if (sai.getClassName() == "CTATMessage") {
    sai = sai.getSAI();
  }
  const clone = sai.clone();
  clone.setSelection(component.getName());
  clone.setAction(component.getSAI().getAction());
  return clone;
}

/**
 * Calls setCorrect on the component with the id of 'component' with the 'sai'
 * @argument comonent: string
 * @argument sai: CTATSAI
 */
function set_correct(component, sai) {
  const comp = $(`#${component}`).data('CTATComponent');
  return comp.setCorrect(rerouted_sai(comp, sai));
}
/**
 * Calls setCorrect on the component with the id of 'component' with the 'sai'
 * @argument comonent: string
 * @argument sai: CTATSAI
 */
function set_incorrect(component, sai) {
  const comp = $(`#${component}`).data('CTATComponent');
  return comp.setIncorrect(rerouted_sai(comp, sai));
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

class Point {
  constructor(x, y, state) {
    this.x = x || 0;
    this.y = y || 0;
    this.state = state || "ungraded";
    this.r = 4;
  }
  get isCorrect() {
    return this.state == 'correct';
  }
  get isIncorrect() {
    return this.state == 'incorrect';
  }
  get isHint() {
    return this.state == 'hint';
  }
  at(x, y) {
    // TODO: use radius to for closeness?
    return this.x == x && this.y == y;
  }
  toString() {
    return `(${this.x},${this.y})`;
  }
  toJSON() {
    return {'x': this.x, 'y': this.y};
  }

  static fromString(str) {
    const parse = str.match(/^\s*\(\s*(\d+[.]?\d*)\s*,\s*(\d+[.]?\d*)\s*\)\s*$/);
    if (parse) {
      return new Point(Number(parse[1]), Number(parse[2]));
    }
  }
}

export default class CTATChart extends CTAT.Component.Base.Tutorable {
  constructor () {
    super("CTATChart", "TwoDimensionChart");
    this._chart = null;
    this.margin = {top: 10, right: 10, bottom: 30, left: 30};

    this.points = [];
    this._x = d3.scaleLinear();
    this._y = d3.scaleLinear();
    this._xAxisCall = d3.axisBottom();
    this._xAxisGridCall = d3.axisBottom();
    this._yAxisCall = d3.axisLeft();
    this._yAxisGridCall = d3.axisLeft();

    // need to clobber parent methods here.
    this.init = this._init;
    this.showCorrect = this._showCorrect;
    this.showInCorrect = this._showInCorrect;
    this.updateSAI = this._updateSAI;
  }

  /** Get the chart instance */
  get chart() { return this._chart; }

  /**
   * @returns {x: number, y: number}
   */
  getValueForPixel(x, y) {
    let vx = this._x.invert(x),
        vy = this._y.invert(y);
    if (this.dataIsSnapping) {
      vx = this.closestXtick(vx);
      vy = this.closestYtick(vy);
    }
    return new Point(vx, vy);
  }
  /**
   * @param value: number - an x axis value
   * @returns : number - the value of the closest x tickmark to value.
   */
  closestXtick(value) { return closest(this._xAxisCall.tickValues(), value); }
  /**
   * @param value: number - an y axis value
   * @returns : number - the value of the closest y tickmark to value.
   */
  closestYtick(value) { return closest(this._yAxisCall.tickValues(), value); }

  /**
   * Accessor for querying if snapping is enabled.
   * @returns :boolean
   */
  get dataIsSnapping() {
    const snap = this.getDivWrap().getAttribute('data-ctat-snapping');
    return snap ? CTATGlobalFunctions.stringToBoolean(snap) : true;
  }
  set dataIsSnapping(val) {
    this.getDivWrap().setAttribute('data-ctat-snapping', `${val}`);
  }

  /**
   * Get the numeric value of the given data-ctat-* attribute.
   * @param key: string - the data-ctat-* attribute to query.
   * @param def: number - the default value for the key.
   * @returns :number
   */
  getDataValue(key, def) {
    if (this.getDivWrap()) {
      const value = this.getDivWrap().getAttribute(key);
      const val = Number(value);
      return !value || isNaN(val) ? def : val;
    }
    return def;
  }
  /**
   * Get the list of strings specified in the given data-ctat-* attribute.
   * @param key: string - the data-ctat-* key.
   * @returns :string[]
   */
  getDataController(key) {
    const ctrls = this.getDivWrap().getAttribute(key);
    if (ctrls) { return ctrls.split(/\s*[;,]\s*/).map(c=>c.trim()); }
    return [];
  }

  /**
   * Convenience accessor for 'data-ctat-ctrl-minimum-x' attribute.
   * @returns :string[]
   */
  get dataCtrlMinimumX() {
    return this.getDataController('data-ctat-ctrl-minimum-x');
  }
  /**
   * Convenience accessor for 'data-ctat-minimum-x' attribute.
   * @returns :number
   */
  get dataMinimumX() {
    return this.getDataValue('data-ctat-minimum-x', 0);
  }
  set dataMinimumX(val) {
    this.getDivWrap().setAttribute('data-ctat-minimum-x', `${val}`);
  }

  /**
   * Convenience accessor for 'data-ctat-ctrl-minimum-y' attribute.
   * @returns :string[]
   */
  get dataCtrlMinimumY() {
    return this.getDataController('data-ctat-ctrl-minimum-y');
  }
  /**
   * Convenience accessor for 'data-ctat-minimum-y' attribute.
   * @returns :number
   */
  get dataMinimumY() {
    return this.getDataValue('data-ctat-minimum-y', 0);
  }
  set dataMinimumY(val) {
    this.getDivWrap().setAttribute('data-ctat-minimum-y', `${val}`);
  }

  /**
   * Convenience accessor for 'data-ctat-ctrl-maximum-x' attribute.
   * @returns :string[]
   */
  get dataCtrlMaximumX() {
    return this.getDataController('data-ctat-ctrl-maximum-x');
  }
  /**
   * Convenience accessor for 'data-ctat-maximum-x' attribute.
   * @returns :number
   */
  get dataMaximumX() {
    return this.getDataValue('data-ctat-maximum-x', 10);
  }
  set dataMaximumX(val) {
    this.getDivWrap().setAttribute('data-ctat-maximum-x', `${val}`);
  }

  /**
   * Convenience accessor for 'data-ctat-ctrl-maximum-y' attribute.
   * @returns :string[]
   */
  get dataCtrlMaximumY() {
    return this.getDataController('data-ctat-ctrl-maximum-y');
  }
  /**
   * Convenience accessor for 'data-ctat-maximum-y' attribute.
   * @returns :string[]
   */
  get dataMaximumY() {
    return this.getDataValue('data-ctat-maximum-y', 10);
  }
  set dataMaximumY(val) {
    this.getDivWrap().setAttribute('data-ctat-maximum-y', `${val}`);
  }

  /**
   * Convenience accessor for 'data-ctat-ctrl-step-x' attribute.
   * @returns :string[]
   */
  get dataCtrlStepX() {
    return this.getDataController('data-ctat-ctrl-step-x');
  }
  /**
   * Convenience accessor for 'data-ctat-step-x' attribute.
   * @returns :number
   */
  get dataStepX() {
    return this.getDataValue('data-ctat-step-x', 1);
  }
  set dataStepX(val) {
    this.getDivWrap().setAttribute('data-ctat-step-x', `${val}`);
  }

  /**
   * Convenience accessor for 'data-ctat-ctrl-step-y' attribute.
   * @returns :string[]
   */
  get dataCtrlStepY() {
    return this.getDataController('data-ctat-ctrl-step-y');
  }
  /**
   * Convenience accessor for 'data-ctat-step-y' attribute.
   * @returns :number
   */
  get dataStepY() {
    return this.getDataValue('data-ctat-step-y', 1);
  }
  set dataStepY(val) {
    this.getDivWrap().setAttribute('data-ctat-step-y', `${val}`);
  }

  ChangeLowerHorizontalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMinumumX(value);
    this.setEnabled(enabled);
  }
  setMinimumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum x value: ${value}`);
    } else {
      this.dataMinimumX = value;
      this.drawAxisX();
      this.drawPoints();
    }
  }
  adjustMinimumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust x value: ${value}`);
    } else {
      this.dataMinimumX += value;
      this.drawAxisX();
      this.drawPoints();
    }
  }

  ChangeLowerVerticalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMinumumY(value);
    this.setEnabled(enabled);
  }
  setMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum y value: ${value}`);
    } else {
      this.dataMinimumY = value;
      this.drawAxisY();
      this.drawPoints();
    }
  }
  adjustMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust y value: ${value}`);
    } else {
      this.dataMinimumY += value;
      this.drawAxisY();
      this.drawPoints();
    }
  }

  ChangeUpperHorizontalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  setMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum x value: ${value}`);
    } else {
      this.dataMaximumX = value;
      this.drawAxisX();
      this.drawPoints();
    }
  }
  adjustMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust x value: ${value}`);
    } else {
      this.dataMaximumX += value;
      this.drawAxisX();
      this.drawPoints();
    }
  }

  ChangeUpperVerticalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  setMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum y value: ${value}`);
    } else {
      this.dataMaximumY = value;
      this.drawAxisY();
      this.drawPoints();
    }
  }
  adjustMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust y value: ${value}`);
    } else {
      this.dataMaximumY += value;
      this.drawAxisY();
      this.drawPoints();
    }
  }

  ChangeHorizontalInterval(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  setStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.dataStepX = value;
      this.drawAxisX();
    }
  }
  adjustStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta x value: ${value}`);
    } else {
      this.dataStepX += value;
      this.drawAxisX();
    }
  }

  ChangeVerticalInterval(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  setStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.dataStepY = value;
      this.drawAxisY();
    }
  }
  adjustStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta y value: ${value}`);
    } else {
      this.dataStepY += value;
      this.drawAxisY();
    }
  }

  drawAxisX() {
    const rect = this.getDivWrap().getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    const tran = d3.transition().duration(500);
    this._x.domain([this.dataMinimumX, this.dataMaximumX]).nice()
      .range([this.margin.left, width - this.margin.right]);
    // TODO: tick values will need a different end value for fractional steps
    const ticks = d3.range(this.dataMinimumX,
                           this.dataMaximumX+1,
                           this.dataStepX);
    this._xAxisGrid
      .transition(tran)
      .call(this._xAxisGridCall.scale(this._x).tickValues(ticks)
            .tickSize(-height+this.margin.top+this.margin.bottom)
            .tickFormat(""))
      .call(g => g.selectAll('.tick').attr('opacity', 0.1))
      .call(g => g.selectAll('.domain').attr('opacity', 0))
      .call(g => g.selectAll('.domain').remove());
    this._xAxis.transition(tran)
      .call(this._xAxisCall.scale(this._x).tickValues(ticks));
  }
  drawAxisY() {
    const rect = this.getDivWrap().getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    const tran = d3.transition().duration(500);
    this._y.domain([this.dataMinimumY, this.dataMaximumY]).nice()
      .range([height - this.margin.bottom, this.margin.top]);
    const ticks = d3.range(this.dataMinimumY,
                           this.dataMaximumY+1,
                           this.dataStepY);
    this._yAxisGrid.transition(tran)
      .call(this._yAxisGridCall.scale(this._y).tickValues(ticks)
            .tickSize(-width+(this.margin.right+this.margin.left))
            .tickFormat(''))
      .call(g => g.selectAll('.tick').attr('opacity', 0.1))
      .call(g => g.selectAll('.domain').attr('opacity', 0))
      .call(g => g.selectAll('.domain').remove());
    this._yAxis.transition(tran).call(this._yAxisCall.scale(this._y).tickValues(ticks));
  }

  _init() {
    this.setInitialized(true);
    const graph_area = this.getDivWrap();
    this.setComponent(graph_area);
    this.addComponentReference(this, graph_area);
    const dga = d3.select(graph_area);
    this._tooltip = dga.append('div')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('font-size', 'small')
      .style('font-family', 'Arial, Helvetica, sans-serif') 
      .classed('tooltip', true)
      .style('position', 'absolute');
    const rect = graph_area.getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    const svg = dga.append('svg').attr("viewBox", [0, 0, width, height]);
    this._xAxisGrid = svg.append('g')
      .classed('CTATChart--grid', true)
      .attr('transform', `translate(0,${height - this.margin.bottom})`);
    this._yAxisGrid = svg.append('g')
      .classed('CTATChart--grid', true)
      .attr('transform', `translate(${this.margin.left},0)`);
    this._xAxis = svg.append('g')
      .classed('CTATChart--axis', true)
      .attr('transform', `translate(0,${height - this.margin.bottom})`);
    this._yAxis = svg.append('g')
      .classed('CTATChart--axis', true)
      .attr('transform', `translate(${this.margin.left},0)`);
    this.drawAxisX();
    this.drawAxisY();
    this._chart = svg.append('g');
    this.drawPoints();
    const add_point = (x,y) => {
      if (this.getEnabled()) {
        const point = this.getValueForPixel(x,y);
        if (this.isPoint(point.x, point.y)) {
          this.removePoint(point.x, point.y);
        } else {
          this.addPoint(point.x, point.y);
          this.setAction('grapherPointAdded');
          this.setInput(point.toString());
          this.processAction();
        }
      }
    };
    svg.on('click', function() {
      const coords = d3.mouse(this);
      add_point(coords[0], coords[1]);
    });

    const cursor = svg.append('g').append('circle')
          .style('fill', 'black').attr('r', 3).style('opacity', 0);
    const mousemove = (x,y) => {
      const point = this.getValueForPoint(x,y);
      const x0 = this._x(point.x), y0 = this._y(point.y);
      cursor.attr('cx', x0).attr('cy', y0);
    }

    // Add listener for controller events.
    if (!CTATConfiguration.get('previewMode')) {
      document.addEventListener(CTAT.Component.Base.Tutorable.EventType.action,
                                this.handleAction.bind(this), false);
    }
  }

  _updateSAI() {
    this.setAction('Graph');
    //this.setInput(`[${this.points.map(p=>p.toString()).join(', ')}]`);
    this.setInput(JSON.stringify(
      {
        points: this.points.map(p=>p.toJSON()),
        xAxis: {
          minimum: this.dataMinimumX,
          maximum: this.dataMaximumX,
          step: this.dataStepX
        },
        yAxis: {
          minimum: this.dataMinimumY,
          maximum: this.dataMaximumY,
          step: this.dataStepY
        },
        equations: []
      }));
  }

  drawPoints() {
    // TODO: indicate points that are not visible e.g. with
    // .filter(d=>this.pPointVisible(d))
    const tooltip = this._tooltip;
    this.chart.selectAll('.CTATChart--point')
      .data(this.points, d=>d)
      .join(
        enter => enter.append('circle')
          .classed('CTATChart--point', true)
          .classed('CTAT--correct', d => d.isCorrect)
          .classed('CTAT--incorrect', d => d.isIncorrect)
          .attr("cx", d => this._x(d.x))
          .attr("cy", d => this._y(d.y))
          .attr('r', d => d.r)
          .on('mouseover', () =>
              tooltip.transition().duration(200).style('opacity', 1))
          .on('mousemove', d => tooltip.html(d.toString())
              .style('left', `${d3.event.pageX+d.r+3}px`)
              .style('top', `${d3.event.pageY-d.r-12}px`)
             )
          .on('mouseleave', () =>
              tooltip.transition().duration(200).style('opacity', 0)),
        update => update.call(
          update => update
            .classed('CTAT--incorrect', d => d.isIncorrect)
            .classed('CTAT--correct', d => d.isCorrect)
            .transition().duration(500)
            .attr('cx', d => this._x(d.x))
            .attr("cy", d => this._y(d.y))),
        exit => exit.remove())
  }

  addPoint(x, y) {
    this.points.push(new Point(x, y));
    this.drawPoints();
  }
  removePoint(x, y) {
    this.points = this.points.filter(p => !p.at(x, y));
    this.drawPoints();
  }
  isPoint(x, y) {
    return this.points.some(point => point.at(x,y));
  }

  drawLine() {
  }
  
  draw() {
    this.drawAxisX();
    this.drawAxisY();
    this.drawPoints();
    this.drawLine();
  }

  pPointVisible(p) {
    return p.x >= this.dataMinimumX
      && p.x <= this.dataMaximumX
      && p.y >= this.dataMinimumY
      && p.y <= this.dataMaximumY;
  }
  pAllPointsVisible() {
    return this.points.every(
      p => this.pPointVisible(p));
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
    this.setInput(input);
    if (this.dataCtrlMinimumX.includes(ctrl_name)) {
      this.setMinimumX(input);
      this.setAction('ChangeLowerHorizontalBoundary');
      this.processAction(false, true);
    }
    if (this.dataCtrlMinimumY.includes(ctrl_name)) {
      this.setMinimumY(input);
      this.setAction('ChangeLowerVerticalBoundary');
      this.processAction(false, true);
    }
    if (this.dataCtrlMaximumX.includes(ctrl_name)) {
      this.setMaximumX(input);
      this.setAction('ChangeUpperHorizontalBoundary');
      this.processAction(false, true);
    }
    if (this.dataCtrlMaximumY.includes(ctrl_name)) {
      this.setMaximumY(input);
      this.setAction('ChangeUpperVerticalBoundary');
      this.processAction(false, true);
    }
    if (this.dataCtrlStepX.includes(ctrl_name)) {
      this.setStepX(input);
      this.setAction('ChangeHorizontalInterval');
      this.processAction(false, true);
    }
    if (this.dataCtrlStepY.includes(ctrl_name)) {
      this.setStepY(input);
      this.setAction('ChangeVerticalInterval');
      this.processAction(false, true);
    }
  }

  _showCorrect(aSAI) {
    const action = aSAI.getAction();
    switch (action) {
    case "grapherPointAdded":
      const point = Point.fromString(aSAI.getInput());
      const last_point = this.points[this.points.length-1];
      last_point.state='correct';
      last_point.x = point.x;
      last_point.y = point.y;
      this.points = this.points.filter(p => !p.isIncorrect);
      this.drawPoints();
      break;
    case "ChangeUpperHorizontalBoundary":
      this.dataCtrlMaximumX.forEach(c => set_correct(c, aSAI));
      break;

    case "ChangeUpperVerticalBoundary":
      this.dataCtrlMaximumY.forEach(c => set_correct(c, aSAI));
      break;

    case "ChangeLowerHorizontalBoundary":
      this.dataCtrlMinimumX.forEach(c => set_correct(c, aSAI));
      break;

    case "ChangeLowerVerticalBoundary":
      this.dataCtrlMinimumY.forEach(c => set_correct(c, aSAI));
      break;

    case "ChangeHorizontalInterval":
      this.dataCtrlStepX.forEach(c => set_correct(c, aSAI));
      break;

    case "ChangeVerticalInterval":
      this.dataCtrlStepY.forEach(c => set_correct(c, aSAI));
      break;

    default:
      console.error(`Unhandled correct Action "${action}" for ${this.getName()}`);
    }
  }
  _showInCorrect(aSAI) {
    const action = aSAI.getAction();
    switch (action) {
    case "grapherPointAdded":
      const point = Point.fromString(aSAI.getInput());
      const last_point = this.points[this.points.length-1];
      last_point.state='ungraded';
      last_point.x = point.x;
      last_point.y = point.y;
      this.points = this.points.filter(p => !p.isIncorrect);
      last_point.state='incorrect';
      this.drawPoints();
      break;
    case "ChangeUpperHorizontalBoundary":
      this.dataCtrlMaximumX.forEach(c => set_incorrect(c, aSAI));
      break;

    case "ChangeUpperVerticalBoundary":
      this.dataCtrlMaximumY.forEach(c => set_incorrect(c, aSAI));
      break;

    case "ChangeLowerHorizontalBoundary":
      this.dataCtrlMinimumX.forEach(c => set_incorrect(c, aSAI));
      break;

    case "ChangeLowerVerticalBoundary":
      this.dataCtrlMinimumY.forEach(c => set_incorrect(c, aSAI));
      break;

    case "ChangeHorizontalInterval":
      this.dataCtrlStepX.forEach(c => set_incorrect(c, aSAI));
      break;

    case "ChangeVerticalInterval":
      this.dataCtrlStepY.forEach(c => set_incorrect(c, aSAI));
      break;

    default:
      console.error(`Unhandled incorrect Action "${action}" for ${this.getName()}`);
    }
  }
}
window.CTAT.ComponentRegistry.addComponentType('CTATChart', CTATChart);
