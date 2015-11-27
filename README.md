# &lt;gaia-header&gt; [![](https://travis-ci.org/gaia-components/gaia-header.svg)](https://travis-ci.org/gaia-components/gaia-header)

## Installation

```bash
$ bower install gaia-components/gaia-header
```

## Examples

- [Example](http://gaia-components.github.io/gaia-header/)

## Usage

### Optimizing with `title-start` & `title-end`

If your header contains custom buttons you can optimize setup time by providing the title's start and end offsets. This avoids the component having to read dimensions from the DOM, which can be costly.

```html
<gaia-header action="back" title-start="50" title-end="100">
  <h1>title</h1>
  <button data-icon="add"></button>
  <button data-icon="settings"></button>
</gaia-header>
```

### `not-flush`

```html
<gaia-header action="back" not-flush>
  <h1>title</h1>
</gaia-header>
```

By default the gaia-header component assumes that it is flush with the `window` edge when fitting text and centering the title. When the component is not flush with the window edge, the `not-flush` attribute should be used.

### `no-font-fit`

```html
<gaia-header action="back" no-font-fit>
  <h1>title</h1>
</gaia-header>
```

Prevents font-fit logic from running. Will run when the attribute is removed. You may choose to use this for app specific performance optimizations.

### `ignore-dir`

```html
<gaia-header action="back" ignore-dir>
  <h1>title</h1>
</gaia-header>
```

Force the older behavior of gaia-header, where the whole header is always displayed in LTR mode.

## Tests

1. Ensure Firefox Nightly is installed on your machine.
2. `$ npm install`
3. `$ npm run test-unit`

If your would like tests to run on file change use:

`$ npm run test-unit-dev`

If your would like run integration tests, use:

`$ export FIREFOX_NIGHTLY_BIN=/absolute/path/to/nightly/firefox-bin`
`$ npm run test-integration`

## Lint check

Run lint check with command:

`$ npm run test-lint`
