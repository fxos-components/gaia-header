
module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'sinon-chai'],
    browsers: ['firefox_latest'],
    client: {
      captureConsole: true,
      mocha: { 'ui': 'tdd' }
    },
    basePath: '../',

    customLaunchers: {
      firefox_latest: {
        base: 'FirefoxNightly',
        prefs: { 'dom.webcomponents.enabled': true }
      }
    },

    files: [
      'bower_components/gaia-component/gaia-component.js',
      'bower_components/gaia-icons/gaia-icons.js',
      'lib/font-fit.js',
      'gaia-header.js',
      'test/mocks/mock_font_fit.js',
      'test/font_fit_test.js',
      'test/test.js',
      {
        pattern: 'bower_components/gaia-icons/gaia-icons.css',
        included: false
      },
      {
        pattern: 'bower_components/gaia-icons/fonts/gaia-icons.ttf',
        included: false
      }
    ],

    proxies: {
      '/bower_components/': 'http://localhost:9876/base/bower_components/'
    }
  });
};
