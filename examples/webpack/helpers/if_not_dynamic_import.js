module.exports = function noop(options) {
  if (!this.file.match(/example-desktop\.(js|css)/)) {
    return options.fn(this);
  }
};