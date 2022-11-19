<a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a>.

# CTATChart

This is a [Cognitive Tutor Authoring Tools](http://ctat.pact.cs.cmu.edu)
tutorable component for working with two dimensional charts.

## Dependencies

This is an extension of the CTAT library and is not intended to be run
independently.
It requires the following pier libraries:

- [CTAT](https://cdn.ctat.cmu.edu/latest/ctat.min.js)

## Usage in a Tutor

Load the CTATChart.js file in the html header of a CTAT html tutor after
`ctat.min.js` but before `ctatloader.js`. For example:

```html
<html>
  <head>
    ...
    <link rel="stylesheet" href="https://cdn.ctat.cs.cmu.edu/releases/latest/CTAT.min.css"/>
    <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
    <script src="https://cdn.ctat.cs.cmu.edu/releases/latest/ctat.min.js"></script>
    <script src="https://ringenbergctat.gitlab.io/ctatchart/CTATChart.js"></script>
    <script src="https://cdn.ctat.cs.cmu.edu/releases/latest/ctatloader.js"></script>
    ...
  </head>
  ...
</html>

```

## Component Documentation

[CTATChart](./doc/CTATChart.md)

[CTATChart Examples](https://ringenbergctat.gitlab.io/ctatchart/)

#  For Advanced Tutor Development

## Local Installation

To install this library using npm, using your Github username and personal access token:
```
  npm install git+https://username:accesstoken@github.com/CMUCTAT/CTATChart
```

## Usage

As this component uses ES6 modules, using a transplier might be required if
compiling from source.
Add the following to the custom javascript file:
`export { default as CTATChart } from 'ctatchart';`
As `CTATChart` registers itself with CTAT, exporting is not strictly necessary,
but when used with building tools that perform tree shaking, exporting it will make
sure that it is included.

# Thanks

Development is supported by
[Carnegie Mellon University](https://www.cmu.edu/)'s
[Simon Initiative](https://www.cmu.edu/simon/)
and [CTAT](https://github.com/CMUCTAT/CTAT/wiki).
