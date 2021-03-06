module.exports = function (config) {
  config.set({
    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      require('./lib/index')
    ],
    basePath: '',
    frameworks: ['jasmine', 'jasmine1-shim'],
    files: [
      'node_modules/es5-shim/es5-shim.js',
      'spec/*.js'
    ],
    exclude: [],
    preprocessors: {},
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
