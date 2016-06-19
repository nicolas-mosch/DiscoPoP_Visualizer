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
   * Converts values for red green and blue to a hex representation
   * @param  {Number} r The value for red ([0-255])
   * @param  {Number} g The value for green ([0-255])
   * @param  {Number} b The value for blue ([0-255])
   * @return {String}   The hex representation of the input color-values
   */
  rgbToHex: function rgbToHex(r, g, b) {
    function byte2Hex (n)
    {
      var nybHexString = "0123456789ABCDEF";
      return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
    };
    return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
  }
}
