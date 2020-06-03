/**
 * @overview CTAT component for working with two dimensional charts.
 *
 * <point> := '{"x":number,"y":number}'
 * <equation> := "[<point>+]"
 * Actions:
 *  ChangeUpperHorizontalBoundary (:number)
 *  ChangeUpperVerticalBoundary (:number)
 *  ChangeLowerHorizontalBoundary (:number)
 *  ChangeLowerVerticalBoundary (:number)
 *  ChangeHorizontalInterval (:number)
 *  ChangeVerticalInterval (:number)
 *  AddPoint (<point>)
 *  grapherError ('PointOutOfBounds'|'curveNeedsMorePoints')
 *     - When changing boundary results in point out of bounds.
 *     - When less than 2 correct points are available.
 *  AddLine (<equation>)
 *  EnableLineDrawing(:boolean)
 * TODO:
 * <equation> := "y = 3x"
 * - Action: ChangeHorizontalLabel (:string) <- Not going to do
 * - Action: ChangeVerticalLabel (:string) <- Not going to do
 * - Action: ChangeHorizontalUnit (:string) <- Not going to do
 * - Action: ChangeVerticalUnit (:string) <- Not going to do
 * - Action: IndicateLineAddIntent (-1) <- Not going to do
 * - Action: IndicatePointAddIntent (-1) <- Not going to do
 * - Action: StopPointAddIntent (-1) <- Not going to do
 *
 * Note: a bit on terminology in the comments, "value" coordinates refers to
 * to values within the chart's coordinate system as opposed to
 * "pixel" coordinates which is the components coordinates systems which
 * is used for drawing.
 */
/** @module CTATChart */
/** @requires module: cdn.ctat.cmu.edu/latest/ctat.min.js */
/*global CTAT CTATGlobalFunctions CTATSAI CTATConfiguration:true*/
import * as d3 from 'd3';
import $ from 'jquery';
import './CTATChart.css';

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
 * Returns the value if within the bounds of the given axis; otherwise, the
 * value of the closest endpoint of the axis.
 * @param value: number
 * @param axis: d3.scale
 * @returns :number
 */
function bounded(value, axis) {
  const c = axis.clamp();
  axis.clamp(true);
  const v = axis(value);
  axis.clamp(c);
  return v;
}

function direction(point, x, y) {
  if (point.x < x[0]) {
    if (point.y < y[0]) {
      return -135; // cos(point, lower-left-corner?
    } else if (point.y > y[1]) {
      return -45; // cos(point, upper-left-corner?
    }
    return -90;
  } else if (point.x > x[1]) {
    if (point.y < y[0]) {
      return 135;
    } else if (point.y > y[1]) {
      return 45;
    }
    return 90;
  } else if (point.y < y[0]) {
    return 180;
  } // greater than max y or default
  return 0;
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
  if (comp) {
    return comp.setCorrect(rerouted_sai(comp, sai));
  }
  console.error(`Unable to locate CTAT component: ${component}`);
}

/**
 * Calls setIncorrect on the component with the id of 'component' with the 'sai'
 * @argument comonent: string
 * @argument sai: CTATSAI
 */
function set_incorrect(component, sai) {
  const comp = $(`#${component}`).data('CTATComponent');
  if (comp) {
    return comp.setIncorrect(rerouted_sai(comp, sai));
  }
  console.error(`Unable to locate CTAT component: ${component}`);
}

/*function halo(text) {
  text.select(function() {
    return this.parentNode.insertBefore(this.cloneNode(true), this);
  })
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-width', 4)
    .attr('stroke-linejoin', 'round');
}*/

/** Enum of possible point states. */
const STATE = {
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
  SELECTED: 'select',
  HINT: 'hint',
  UNGRADED: 'ungraded'
}
/** Set of states that are "valid" */
const VALID_STATES = new Set([STATE.CORRECT, STATE.UNGRADED]);
/** Represents a point in the graph */
class Point {
  /**
   * @param x: number (default=0) - x coordinate value
   * @param y: number (default=0) - y coordinate value
   * @param state: STATE (default=STATE.UNGRADED) - current tutor state
   */
  constructor(x, y, state) {
    this.x = x || 0;
    this.y = y || 0;
    this.state = state || STATE.UNGRADED;
    this.r = 4; // radius of the point.
  }
  /**
   * If the point has a state that allows it to be used in line drawing.
   * @returns : boolean
   */
  get isValid() {
    return VALID_STATES.has(this.state);
  }
  /**
   * If the point has been flagged as correct by the tutor.
   */
  get isCorrect() {
    return this.state == STATE.CORRECT;
  }
  /**
   * If the point has been flagged as incorrect by the tutor.
   */
  get isIncorrect() {
    return this.state == STATE.INCORRECT;
  }
  /**
   * If the point has been flagged for feedback by the tutor.
   */
  get isHint() {
    return this.state == STATE.HINT;
  }
  /**
   * Test if this point is at the given coordinate values.
   * @param x: number - x coordinate value.
   * @param y: number - y coordinate value.
   * @returns :boolean
   */
  at(x, y) {
    // TODO: use radius to for closeness?
    return this.x == x && this.y == y;
  }
  /**
   * Produce the string representation of the point.
   * @returns :string - "(<number>,<number>)"
   */
  toString() {
    return `(${this.x},${this.y})`;
  }
  /**
   * Produce the JSON string representation of the point.
   * @returns :string - {"x":<number>, "y":<number}
   */
  toJSON() {
    return {'x': this.x, 'y': this.y};
  }

  /**
   * Generate a point given the string representation.
   * @param str: string - of the form produced by Point.toString()
   */
  static fromString(str) {
    const parse = str.match(/^\s*\(\s*(\d+[.]?\d*)\s*,\s*(\d+[.]?\d*)\s*\)\s*$/);
    if (parse) {
      return new Point(Number(parse[1]), Number(parse[2]));
    }
  }
  /**
   * Generate a point from the JSON representation.
   * @param str: string - of the form produced by Point.toJSON()
   */
  static fromJSON(str) {
    const parse = JSON.parse(str);
    return new Point(parse.x, parse.y);
  }
}

/** A CTAT tutorable component for interacting with a two dimensional chart. */
export default class CTATChart extends CTAT.Component.Base.Tutorable {
  constructor () {
    super("CTATChart", "TwoDimensionChart");
    this.margin = {top: 10, right: 10, bottom: 30, left: 30};

    // data
    this.points = [];
    this.line_points = [];
    this.equation = d3.scaleLinear();
    this._x = d3.scaleLinear();
    this._y = d3.scaleLinear();
    this._xAxisCall = d3.axisBottom();
    this._xAxisGridCall = d3.axisBottom();
    this._yAxisCall = d3.axisLeft();
    this._yAxisGridCall = d3.axisLeft();

    // graphics
    this._xAxis = null;
    this._xAxisGrid = null;
    this._yAxis = null;
    this._yAxisGrid = null;
    this._line = null;
    this._chart = null;

    // need to clobber parent methods here.
    this.init = this._init;
    this.showCorrect = this._showCorrect;
    this.showInCorrect = this._showInCorrect;
    this.updateSAI = this._updateSAI;
  }

  /** Get the chart instance */
  get chart() { return this._chart; }

  /**
   * Generate the point that is at the given pixel coordinates.
   * This method is aware of the snapping settings and will modify the
   * x and y values to comply with them.
   * @param x: number - pixel x coordinate
   * @param y: number - pixel y coordinate
   * @returns : Point
   */
  getValueForPixel(x, y) {
    let vx = this._x.invert(x),
        vy = this._y.invert(y);
    if (this.dataIsSnapping) {
      // if snapping, get closest tick value
      vx = this.closestXtick(vx);
      vy = this.closestYtick(vy);
    }
    if (this.dataLineSnapping && this.line_points.length > 1) {
      // if line snapping, get closest projected value.
      vy = this.equation(vx);
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
   * Accessor for querying if snapping to the drawn line is enabled
   * @returns :boolean
   */
  get dataLineSnapping() {
    const snap = this.getDivWrap().getAttribute('data-ctat-line-snapping');
    return snap ? CTATGlobalFunctions.stringToBoolean(snap) : true;
  }
  set dataLineSnapping(val) {
    this.getDivWrap().setAttribute('data-ctat-line-snapping', `${val}`);
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

  /** TPA
   * Change the lower x axis boundary value.
   * @param value: number
   */
  ChangeLowerHorizontalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMinumumX(value);
    this.setEnabled(enabled);
  }
  /**
   * Set the minimum x value and redraw points and lines.
   * @param value: number - the new minimum x axis value.
   */
  setMinimumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum x value: ${value}`);
    } else {
      this.dataMinimumX = value;
      this.drawAxisX();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }
  /**
   * Changes the minimum x axis value by the given amount.
   * @param value: number - the delta value
   */
  adjustMinimumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust x value: ${value}`);
    } else {
      this.dataMinimumX += value;
      this.drawAxisX();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }

  /** TPA
   * Set the mimimum y axis value.
   * @param value: number - the new lowest y axis value.
   */
  ChangeLowerVerticalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMinumumY(value);
    this.setEnabled(enabled);
  }
  /**
   * Set the minimum y value and redraw points and lines.
   * @param value: number - the new minimum y axis value.
   */
  setMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum y value: ${value}`);
    } else {
      this.dataMinimumY = value;
      this.drawAxisY();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }
  /**
   * Changes the minimum y axis value by the given amount.
   * @param value: number - the delta value
   */
  adjustMinimumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad minimum adjust y value: ${value}`);
    } else {
      this.dataMinimumY += value;
      this.drawAxisY();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }

  /** TPA
   * Change the upper x axis boundary value.
   * @param value: number
   */
  ChangeUpperHorizontalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  /**
   * Set the maximum x value and redraw points and lines.
   * @param value: number - the new maximum x axis value.
   */
  setMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum x value: ${value}`);
    } else {
      this.dataMaximumX = value;
      this.drawAxisX();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }
  /**
   * Changes the maximum x axis value by the given amount.
   * @param value: number - the delta value
   */
  adjustMaximumX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust x value: ${value}`);
    } else {
      this.dataMaximumX += value;
      this.drawAxisX();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }

  /** TPA
   * Change the upper y axis boundary value.
   * @param value: number
   */
  ChangeUpperVerticalBoundary(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  /**
   * Set the maximum y value and redraw points and lines.
   * @param value: number - the new maximum y axis value.
   */
  setMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum y value: ${value}`);
    } else {
      this.dataMaximumY = value;
      this.drawAxisY();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }
  /**
   * Changes the maximum y axis value by the given amount.
   * @param value: number - the delta value
   */
  adjustMaximumY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad maximum adjust y value: ${value}`);
    } else {
      this.dataMaximumY += value;
      this.drawAxisY();
      this.drawPoints();
      this.drawLine();
      this.checkAllPointsVisible(); // not sure if this is appropriate
    }
  }

  /** TPA
   * Set the interval of tick marks on the x axis.
   * @param value: number - the new interval value.
   */
  ChangeHorizontalInterval(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  /**
   * Sets the step interval of the tick marks of the x axis.
   * @param value: number - the new step value
   */
  setStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.dataStepX = value;
      this.drawAxisX();
    }
  }
  /**
   * Changes the step interval of the tick marks of the x axis.
   * @param value: number - the delta value
   */
  adjustStepX(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta x value: ${value}`);
    } else {
      this.dataStepX += value;
      this.drawAxisX();
    }
  }

  /** TPA
   * Set the interval of tick marks on the y axis.
   * @param value: number - the new interval value.
   */
  ChangeVerticalInterval(value) {
    const enabled = this.getEnabled();
    this.setEnabled(false);
    this.setMaximumX(value);
    this.setEnabled(enabled);
  }
  /**
   * Sets the step interval of tick marks of the y axis.
   * @param value: number - the new step value
   */
  setStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step x value: ${value}`);
    } else {
      this.dataStepY = value;
      this.drawAxisY();
    }
  }
  /**
   * Changes the step interval of the tick marks of the x axis.
   * @param value: number - the delta value
   */
  adjustStepY(value) {
    const vn = Number(value);
    if (value === null || value === '' || isNaN(vn)) {
      console.error(`CTATChart: bad step delta y value: ${value}`);
    } else {
      this.dataStepY += value;
      this.drawAxisY();
    }
  }

  /** Render the x axis. */
  drawAxisX() {
    if (!this._xAxisGrid || !this._xAxis) { return; }
    const rect = this.getDivWrap().getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    const tran = d3.transition().duration(500);
    this._x.domain([this.dataMinimumX, this.dataMaximumX]).nice()
      .range([this.margin.left, width - this.margin.right]);
    // TODO: tick values will need a different end value for fractional steps
    const ticks = d3.range(this.dataMinimumX,
                           this.dataMaximumX + 1,
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
  /** Render the y axis. */
  drawAxisY() {
    if (!this._yAxisGrid || !this._yAxis) { return; }
    const rect = this.getDivWrap().getBoundingClientRect(),
          width = rect.width,
          height = rect.height;
    const tran = d3.transition().duration(500);
    this._y.domain([this.dataMinimumY, this.dataMaximumY]).nice()
      .range([height - this.margin.bottom, this.margin.top]);
    const ticks = d3.range(this.dataMinimumY,
                           this.dataMaximumY + 1,
                           this.dataStepY);
    this._yAxisGrid.transition(tran)
      .call(this._yAxisGridCall.scale(this._y).tickValues(ticks)
            .tickSize(-width+(this.margin.right+this.margin.left))
            .tickFormat(''))
      .call(g => g.selectAll('.tick').attr('opacity', 0.1))
      .call(g => g.selectAll('.domain').attr('opacity', 0))
      .call(g => g.selectAll('.domain').remove());
    this._yAxis.transition(tran)
      .call(this._yAxisCall.scale(this._y).tickValues(ticks));
  }

  get dataLineDrawingEnabled() {
    const enabled = this.getDivWrap().getAttribute('data-ctat-line-drawing-enabled');
    return enabled ? CTATGlobalFunctions.stringToBoolean(enabled): true;
  }
  set dataLineDrawingEnabled(val) {
    this.getDivWrap().setAttribute('data-ctat-line-drawing-enabled', `${val}`);
  }
  
  EnableLineDrawing(bool) {
    this.dataLineDrawingEnabled(bool);
  }

  /** Initializes component (clobbers super.init()) */
  _init() {
    this.setInitialized(true);
    this.updateSAI();
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
    /*const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3.5')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');*/
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
    const cursor = svg.append('g').classed('CTATChart--cursor', true)
          .append('circle').attr('r', 3);
    const mousemove = (x,y) => {
      if (this.getEnabled()) {
        const point = this.getValueForPixel(x,y);
        //const x0 = this._x(point.x), y0 = this._y(point.y);
        cursor.attr('cx', this._x(point.x)).attr('cy', this._y(point.y));
        if (this.line_points.length === 1) {
          const line = this.line_points.slice();
          line.push(point);
          this._line.selectAll('line')
            .data([this.boundedLine(line)])
            .join(
              enter => enter.append('line')
                .attr('x1', d => this._x(d[0].x))
                .attr('y1', d => this._y(d[0].y))
                .attr('x2', d => this._x(d[1].x))
                .attr('y2', d => this._y(d[1].y))
                .attr('stroke-width', 2)
                .attr('stroke', 'grey'),
              update => update.call(
                update => update
                  .attr('x1', d => this._x(d[0].x))
                  .attr('y1', d => this._y(d[0].y))
                  .attr('x2', d => this._x(d[1].x))
                  .attr('y2', d => this._y(d[1].y))),
              exit => exit.remove());
        }
      }
    }
    svg.on('mousemove', function() {
      const coords = d3.mouse(this);
      mousemove(coords[0], coords[1]);
    });
    svg.on('mouseover',
           () => this.getEnabled() && cursor.style('opacity', 0.2));
    svg.on('mouseleave', () => cursor.style('opacity', 0));

    this._line = svg.append('g').classed('CTATChart--line', true);
    this._chart = svg.append('g').classed('CTATChart--points', true);
    this.drawPoints();
    this.drawLine();
    const add_point = (x,y) => {
      if (this.getEnabled()) {
        const point = this.getValueForPixel(x,y);
        if (this.isPoint(point.x, point.y)) {
          const epoint = this.points.find(p => p.at(point.x, point.y));
          if (epoint.isValid) {
            if (this.dataLineDrawingEnabled) {
              const correctPoints = this.points.filter(p => p.isValid);
              if (correctPoints.length >= 2) {
                const inline = this.line_points.some(
                  point => point.at(epoint.x,epoint.y));
                if (inline) {
                  this.line_points = this.line_points.filter(
                    p => !p.at(epoint.x,epoint.y));
                  this.drawLine();
                } else {
                  this.line_points.push(epoint);
                  if (this.line_points.length >= 2) {
                    this.setAction('AddLine');
                    this.setInput(JSON.stringify(this.getEquation()));
                    this.processAction();
                    this.drawLine();
                  }
                }
              } else {
                // "throw" error
                this.setAction('grapherError');
                this.setInput('curveNeedsMorePoints');
                this.processAction(false, true);
              }
            }
          } else {
            this.removePoint(point.x, point.y);
          }
        } else {
          //console.log('Adding new point:', point);
          this.addPoint(point.x, point.y);
          this.setAction('AddPoint');
          this.setInput(JSON.stringify(point.toJSON()));
          this.processAction();
        }
      }
    };
    svg.on('click', function() {
      const coords = d3.mouse(this);
      add_point(coords[0], coords[1]);
    });

    // Add listener for controller events.
    if (!CTATConfiguration.get('previewMode')) {
      document.addEventListener(CTAT.Component.Base.Tutorable.EventType.action,
                                this.handleAction.bind(this), false);
    }
  }

  /**
   * Generate the representation of the line.
   * @returns :string[] - list of Points.toJSON() strings
   */
  getEquation() {
    return this.line_points;
  }

  /** Update the current SAI. (clobbers super.updateSAI()) */
  _updateSAI() {
    // This builds the representation of the entire chart
    this.setAction('Graph');
    const equation = this.getEquation();
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
        equation: equation
      }));
  }

  /** Render the points in the chart. */
  drawPoints() {
    if (this.chart === null) { return; }
    const tooltip = this._tooltip;
    // TODO: maybe parameterize size of points.
    const diamond = d3.symbol().type(d3.symbolTriangle).size(40);
    const circle = d3.symbol().type(d3.symbolCircle).size(40);
    const dir = p => direction(p,
                               [this.dataMinimumX, this.dataMaximumX],
                               [this.dataMinimumY, this.dataMaximumY]);
    const bx = p => bounded(p.x, this._x);
    const by = p => bounded(p.y, this._y);
    const transform = d => `rotate(${dir(d)}, ${bx(d)}, ${by(d)}) translate(${bx(d)}, ${by(d)})`;
    this.chart.selectAll('.CTATChartPoint')
      .data(this.points)
      .join(
        enter => enter.append('path')
          .classed('CTATChartPoint', true)
          .classed('CTATChart--point', d=>this.pPointVisible(d))
          .classed('CTATChart--out-of-bounds', d=>!this.pPointVisible(d))
          .classed('CTAT--correct', d => d.isCorrect)
          .classed('CTAT--incorrect', d => d.isIncorrect)
          .classed('CTAT--hint', d => d.isHint)
          .attr('d', d => this.pPointVisible(d)?circle:diamond)
          .attr('transform', transform)
          .on('mouseover', () =>
              tooltip.transition().duration(200).style('opacity', 1))
          .on('mousemove', d => tooltip.html(d.toString())
              .style('left', `${d3.event.pageX+d.r+3}px`)
              .style('top', `${d3.event.pageY-d.r-12}px`)
             )
          .on('mouseleave', () =>
              tooltip.transition().duration(200).style('opacity', 0)),
        update => update
          .classed('CTATChart--point', d=>this.pPointVisible(d))
          .classed('CTATChart--out-of-bounds', d=>!this.pPointVisible(d))
          .classed('CTAT--correct', d => d.isCorrect)
          .classed('CTAT--incorrect', d => d.isIncorrect)
          .classed('CTAT--hint', d => d.isHint)
          .attr('d', d => this.pPointVisible(d)?circle():diamond())
          .transition().duration(500)
          .attr('transform', transform),
        exit => exit.remove());
  }

  /** TPA
   * Add the point to the chart.
   * @param json: string - the Point.toJSON() representation of a point.
   */
  /*AddPoint(json) {
    const point = Point.fromJSON(json);
    this.points.push(point);
    this.drawPoints();
  }*/

  /**
   * Add a point at the given value coordinates.
   * @param x: number - x value
   * @param y: number - y value
   */
  addPoint(x, y) {
    this.points.push(new Point(x, y));
    this.drawPoints();
  }
  /**
   * Remove the point a the given value coordinates.
   * @param x: number - x value
   * @param y: number - y value
   */
  removePoint(x, y) {
    this.points = this.points.filter(p => !p.at(x, y));
    this.drawPoints();
  }
  /**
   * Test if there is a point at the given value coordinates.
   * @param x: number - x value
   * @param y: number - y value
   */
  isPoint(x, y) {
    return this.points.some(point => point.at(x,y));
  }

  /**
   * Calculate the endpoints of the line defined by the given points given
   * the current axis bounds.
   * @param points: [Point,Point]
   * @returns {x:number,y:number}[]
   */
  boundedLine(points) {
    if (points[0].x == points[1].x) {
      return [{x: points[0].x, y: this.dataMinimumY},
              {x: points[1].x, y: this.dataMaximumY}];
    }
    this.equation.domain([points[0].x, points[1].x])
      .range([points[0].y, points[1].y]);
    let x1 = this.dataMinimumX,
        y1 = this.equation(this.dataMinimumX),
        x2 = this.dataMaximumX,
        y2 = this.equation(this.dataMaximumX);
    if (y1 < this.dataMinimumY) {
      x1 = this.equation.invert(this.dataMinimumY);
      y1 = this.dataMinimumY;
    }
    if (y1 > this.dataMaximumY) {
      x1 = this.equation.invert(this.dataMaximumY);
      y1 = this.dataMaximumY;
    }
    if (y2 < this.dataMinimumY) {
      x2 = this.equation.invert(this.dataMinimumY);
      y2 = this.dataMinimumY;
    }
    if (y2 > this.dataMaximumY) {
      x2 = this.equation.invert(this.dataMaximumY);
      y2 = this.dataMaximumY;
    }
    this.equation.domain([x1, x2]).range([y1, y2]).clamp();
    return [{x: x1, y: y1}, {x: x2, y: y2}]
  }
  /** Render the line if defined. */
  drawLine() {
    if (this._line === null) { return; }
    //const correctPoints = this.points.filter(p => p.isCorrect);
    const lines = [];
    //console.log(this.line_points);
    if (this.line_points.length > 1) {
      //const correctPoints = [...this.line_points];
      lines.push(this.boundedLine(this.line_points));
    }
    this._line.selectAll('line')
      .data(lines)
      .join(
        enter => enter.append('line')
          .attr('x1', d => this._x(d[0].x))
          .attr('y1', d => this._y(d[0].y))
          .attr('x2', d => this._x(d[1].x))
          .attr('y2', d => this._y(d[1].y))
          .attr('stroke-width', 2)
          .attr('stroke', 'black'),
        update => update.call(
          update => update
            .transition().duration(500)
            .attr('x1', d => this._x(d[0].x))
            .attr('y1', d => this._y(d[0].y))
            .attr('x2', d => this._x(d[1].x))
            .attr('y2', d => this._y(d[1].y))),
        exit => exit.remove());
  }

  /** Render the axes, points, and line */
  draw() {
    this.drawAxisX();
    this.drawAxisY();
    this.drawPoints();
    this.drawLine();
  }

  /** TPA
   * Add the line defined by a set of two points.
   * @param equation: string[] - strings are of the form Point.toJSON()
   */
  /*AddLine(equation) {
    this.line_points =
      new Set(JSON.parse(equation).map(p => new Point(p.x,p.y)));
    this.drawLine();
  }*/

  /**
   * Test if the given point is within the chart's bounds.
   * @param p: Point
   * @returns :boolean
   */
  pPointVisible(p) {
    return p.x >= this.dataMinimumX
      && p.x <= this.dataMaximumX
      && p.y >= this.dataMinimumY
      && p.y <= this.dataMaximumY;
  }

  /**
   * Test if all points are within the chart's bounds.
   * @returns :boolean
   */
  pAllPointsVisible() {
    return this.points.every(
      p => this.pPointVisible(p));
  }

  /**
   * Test if all points are within the chart's bounds and reports to tutor if
   * not all points are visible.
   */
  checkAllPointsVisible() {
    if (!this.pAllPointsVisible()) {
      // "throw" error
      this.setAction('grapherError');
      this.setInput('PointOutOfBounds');
      this.processAction(false, true);
    }
  }

  /** TPA
   * Triggers grapher error event to be handled by content author.
   */
  grapherError(error_type) {
    // highlight axes bounds on PointOutOfBounds?
    this.getDivWrap().dispatchEvent(
      new CustomEvent('grapher',
                      {bubbles: true,
                       detail: { text: () => error_type }}));
    return;
  }

  /**
   * Handler for controller components.
   * @param evt: Event
   */
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

  /**
   * Handler for correct tutor events.
   * @param aSAI: CTATSAI
   */
  _showCorrect(aSAI) {
    const action = aSAI.getAction();
    switch (action) {
    case "AddPoint": {
      //console.log(aSAI.getInput());
      const point = Point.fromJSON(aSAI.getInput());
      const last_point = this.points[this.points.length-1];
      last_point.state = STATE.CORRECT;
      last_point.x = point.x;
      last_point.y = point.y;
      this.points = this.points.filter(p => !p.isIncorrect);
      this.drawPoints();
      this.drawLine();
      break;
    }
    case "AddLine":
      this.line_points =
        JSON.parse(aSAI.getInput()).map(p => new Point(p.x,p.y));
      this.drawLine();
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

  /**
   * Handler for incorrect tutor events.
   * @param aSAI: CTATSAI
   */
  _showInCorrect(aSAI) {
    const action = aSAI.getAction();
    switch (action) {
    case "AddPoint": {
      const point = Point.fromJSON(aSAI.getInput());
      const last_point = this.points[this.points.length-1];
      last_point.state = STATE.UNGRADED;
      last_point.x = point.x;
      last_point.y = point.y;
      this.points = this.points.filter(p => !p.isIncorrect);
      last_point.state = STATE.INCORRECT;
      this.drawPoints();
      break;
    }
    case "AddLine":
      this.line_points =
        JSON.parse(aSAI.getInput()).map(p => new Point(p.x,p.y));
      this.drawLine();
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
