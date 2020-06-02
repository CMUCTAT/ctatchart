# CTATChart

This is a [Cognitive Tutor Authoring Tools](http://ctat.pact.cs.cmu.edu)
tutorable component for working with two dimensional charts.

## Dependencies

This is an extension of the CTAT library and is not intended to be run
independently.
It requires the following pier libraries:
* [CTAT](https://cdn.ctat.cmu.edu/latest/ctat.min.js)
* jQuery

## Installation
To install this library using npm:
```npm install --save gitlab:RingenbergCTAT/ctatchart```

## Usage
As this component uses ES6 modules, using a cross-compiler might be required.
Add the following to the custom javascript file:
```export { default as CTATChart } from 'ctatchart';```
As `CTATChart` registers itself with CTAT, exporting is not strictly necessary,
but when used with building tools that does tree shaking, exporting it will make
sure that it is included.

## Thanks
Developement is supported by
[Carnegie Mellon University](https://www.cmu.edu/)'s
[Simon Initiative](https://www.cmu.edu/simon/)
and [CTAT](http://ctat.pact.cs.cmu.edu/).
