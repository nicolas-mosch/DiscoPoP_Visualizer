/**
 * A module containing some general, independent functions
 * @module generalFunctions
 */
module.exports = {
  /**
   * Makes a more readable data-number
   * @param  {number}   bytes The number to be changed
   * @param  {boolean}  si    Defines whether the given number shall be considered as bytes (true) or bits (false)
   * @return {string}         A more readable representation of the given number
   */
  humanFileSize: function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }
    var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  },

  /**
   * [rbgToHex description]
   * @param  {[type]} r [description]
   * @param  {[type]} g [description]
   * @param  {[type]} b [description]
   * @return {[type]}   [description]
   */
  rgbToHex: function rgbToHex(r, g, b) {
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
}
