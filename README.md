<a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a>.

# CTATChart

This is a [Cognitive Tutor Authoring Tools](http://ctat.pact.cs.cmu.edu)
tutorable component for working with two dimensional charts.

## Dependencies

This is an extension of the CTAT library and is not intended to be run
independently.
It requires the following pier libraries:

- [CTAT](https://cdn.ctat.cmu.edu/latest/ctat.min.js)

## Installation

To install this library using npm:
`npm install --save gitlab:RingenbergCTAT/ctatchart`

## Usage

As this component uses ES6 modules, using a cross-compiler might be required.
Add the following to the custom javascript file:
`export { default as CTATChart } from 'ctatchart';`
As `CTATChart` registers itself with CTAT, exporting is not strictly necessary,
but when used with building tools that does tree shaking, exporting it will make
sure that it is included.

## Component Documentation

[CTATChart](./CTATChart.md)

[CTATChart Examples](https://ringenbergctat.gitlab.io/ctatchart/)

## Thanks

Developement is supported by
[Carnegie Mellon University](https://www.cmu.edu/)'s
[Simon Initiative](https://www.cmu.edu/simon/)
and [CTAT](http://ctat.pact.cs.cmu.edu/).
