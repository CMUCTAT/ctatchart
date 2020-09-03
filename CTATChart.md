# CTATChart

CTAT component for interacting with a two dimensional chart.

User interactions include:

- Adding points by clicking on an empty point in the chart.
- Removing not correct points by clicking on them.
- Starting line drawing by clicking on a correct point.
- Finish line drawing by clicking on a second correct point.
- Stop line drawing by clicking on the first point again.
- Stop line drawing if the to be added line already exists.

Additional components can be added to change axis bounds and tick mark spacing.

## Code

User can add multiple points to the chart with x and y bounds of 0 and 10:

```html
<div
  id="chart"
  class="CTATChart"
  aria-label="Tutorable interactive two dimension data chart"
  role="img"
  data-ctat-disable-on-correct="false"
  data-ctat-minimum-x="0"
  data-ctat-maximum-x="10"
  data-ctat-minimum-y="0"
  data-ctat-maximum-y="10"></div>
```

## Running Example

[CTATChart Examples](https://ringenbergctat.gitlab.io/ctatchart/)

## Attributes and Settings

- `id`: _Required._ The name of the component, must be a valid html id name.
- `class`: _Required._ The class list, must include `CTATChart` and no other CTAT\<component\> classes.
- `data-ctat-enabled`: `true` or `false`. Default is `true`. Controls if the component will accept student interaction.
- `data-ctat-tutor`: `true` or `false`. Default is `true`. Controls if direct actions on the component trigger grading.
- `data-ctat-show-feedback`: `true` or `false`. Default is `true` unless `data-ctat-tutor="false"`. Determines if grading feedback is shown on the component.
- `data-ctat-show-hint-highlight`: `true` or `false`. Default is `true`. Determines if hint highlighting is shown on the component.
- `data-ctat-disable-on-correct`: `true` or `false`. Default is `true`. Determines if the component becomes locked when it is graded as correct. It is recomended to set this to `false` so that multiple points can be entered which is required for line drawing.
- `data-ctat-maximum-x`: The maximum value available on the X axis. Default is "10".
- `data-ctat-minimum-x`: The minimum value available on the X axis. Default is "0".
- `data-ctat-maximum-y`: The maximum value available on the Y axis. Default is "10".
- `data-ctat-minimum-y`: The minimum value available on the Y axis. Default is "0".
- `data-ctat-step-x`: The scale of the X axis starting at 0. Default is "1".
- `data-ctat-step-y`: The scale of the Y axis starting at 0. Default is "1".
- `data-ctat-snap`: If this is "true", then the user can only add points at gridline intersections and the point cursor will move to the closest intersection to the mouse pointer. Default is "true".
- `data-ctat-line-drawing-enabled`: If this is "true", then users can draw lines. Default is "true".
- `data-ctat-line-snap`: If "true", then once a line is drawn, then all future points must be on the line. The point cursor will appear at the closest point on the line to the mouse cursor. Default is "true".
- `data-ctat-ctrl-maximum-x`: A list of ';' deliminated ids of CTAT controller components that the user can interact with to change the maximum X axis value. Default is "".
- `data-ctat-ctrl-minimum-x`: A list of ';' deliminated ids of CTAT controller components that the user can interact with to change the minimum X axis value. Default is "".
- `data-ctat-ctrl-maximum-y`: A list of ';' deliminated ids of CTAT controller components that the user can interact with to change the maximum Y axis value. Default is "".
- `data-ctat-ctrl-minimum-y`: A list of ';' deliminated ids of CTAT controller components that the user can interact with to change the minimum Y axis value. Default is "".
- `data-ctat-ctrl-step-x`: A list of ';' deliminated ids of CTAT controller components that the user can interact with to change the X axis scale. Default is "".
- `data-ctat-ctrl-step-y`: A list of ';' deliminated ids of CTAT controller components that the user can interact with to change the Y axis scale. Default is "".

Valid CTAT controller components include [CTATButton](https://github.com/CMUCTAT/CTAT/wiki/CTATButton), [CTATImageButton](https://github.com/CMUCTAT/CTAT/wiki/CTATImageButton), [CTATTextInput](https://github.com/CMUCTAT/CTAT/wiki/CTATTextInput), and [CTATNumericStepper](https://github.com/CMUCTAT/CTAT/wiki/CTATNumericStepper). [CTATSubmitButton](https://github.com/CMUCTAT/CTAT/wiki/CTATSubmitButton) can also be used as a controller component to do grading on demand for the associated part of the number line; for example, it can be configured to submit just the minimum X axis value for grading.

## Action-Input

In addition to the common Actions listed in [Often Used TPAs](https://github.com/CMUCTAT/CTAT/wiki/Dynamic-interfaces#often-used-tpas) this component supports the following actions:

| Action                        | Input   | Notes |
| :--:                          | :--:    | :-- |
| AddPoint                      | point   | point := `{"x": number, "y": number}` |
| AddLine                       | line    | line := `[point, point]` |
| ChangeLowerHorizontalBoundary | number  | Changes `ctat-data-minimum-x` |
| ChangeLowerVerticalBoundary   | number  | Changes `ctat-data-minimum-y` |
| ChangeUpperHorizontalBoundary | number  | Changes `ctat-data-maximum-x` |
| ChangeUpperVerticalBoundary   | number  | Changes `ctat-data-maximum-y` |
| EnableLineDrawing             | boolean | Changes `ctat-data-enable-line-drawing` for tutor enabling of line drawing. |
| grapherError                  | string  | Only emitted by CTATChart (should not be used in TPA) with a value of either 'PointOutOfBounds' if the bounds were changed such that at least one point is outside the chart or 'curveNeedsMorePoints' if line drawing is attempted when there are not enough points in the graph. |

## Styling

Here is a list of the default styles included with CTATChart which govern various aspects of the look of the chart.

```css
.CTATChart {
  width: 400px;
  height: 300px;
}
.CTATChart .CTAT--cursor {
  fill: black;
  opacity: 0;
  pointer-events: none;
}
.CTATChart path.CTATChart--point {
  fill: black;
  stroke-width: 2;
}
.CTATChart path.CTATChart--point.CTAT--hint {
  fill: yellow;
  stroke: yellow;
  fill-opacity: 0.7;
}
.CTATChart path.CTATChart--point.CTAT--incorrect {
  fill: red;
  fill-opacity: 0.7;
}
.CTATChart path.CTATChart--point.CTAT--correct {
  stroke: limegreen;
  fill-opacity: 0.7;
}

.CTATChart path.CTATChart--out-of-bounds {
  fill: lightgrey;
  stroke: black;
  opacity: 0.8;
  stroke-width: 1;
}
.CTATChart path.CTATChart--out-of-bounds.CTAT--hint {
  stroke: yellow;
  fill: yellow;
}
.CTATChart path.CTATChart--out-of-bounds.CTAT--incorrect {
  stroke: red;
  stroke-dasharray: 5 5;
  stroke-width: 2;
}
.CTATChart path.CTATChart--out-of-bounds.CTAT--correct {
  stroke: limegreen;
}

.CTATChart line.CTATChart--spline {
  stroke-width: 2;
  stroke: black;
}
.CTATChart line.CTATChart--spline.CTAT--hint {
  stroke: yellow;
}
.CTATChart line.CTATChart--spline.CTAT--incorrect {
  stroke: red;
  stroke-dasharray: 5 5;
}
.CTATChart line.CTATChart--spline.CTAT--correct {
  stroke: limegreen;
}
```

## Mass Production

Example for mass producing the minimum, maximum, and tick marks for a CTATChart:

```html
<div
  id="chart1"
  class="CTATChart"
  aria-label="Interactive two dimension data graph."
  role="img"
  data-ctat-disable-on-correct="false"
  data-ctat-minimum-x="%(x-min)%"
  data-ctat-maximum-x="%(x-max)%"
  data-ctat-minimum-y="%(y-min)%"
  data-ctat-maximum-y="%(y-max)%"></div>
```
