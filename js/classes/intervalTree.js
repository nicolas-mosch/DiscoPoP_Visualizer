'use strict';

var _ = require('lodash');
const RED = true;
const BLACK = false;

/**
 *
 * Implementation of a Red-Black-Tree augmented for having intervals as node-keys.
 * Based on chapters 13 and 14 from book: Introduction to Algorithms, Third Edition (By:
 * Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest and Clifford Stein)
 *
 * @author Nicolas Morew
 */

class IntervalTree {
  /**
   * Creates a new node with the given interval as its key and value as its value inserts it into the tree
   * @param  {number[]} interval The interval-key
   * @param  {Object}   value    The value held by the interval
   */
  constructor() {
    this._root = null;
  }
  insert(interval, value) {
    var x = this._root;
    var y = null;
    var z = {
      start: interval[0],
      end: interval[1],
      value: value
    };
    while (x != null) {
      y = x;
      if (!_.has(x, 'maxEnd') || interval[1] > x.maxEnd) {
        x.maxEnd = interval[1];
      }

      if (z.start < x.start) {
        x = x.left;
      } else {
        x = x.right;
      }
    }
    z.parent = y;
    if (y == null) {
      this._root = z;
    } else if (z.start < y.start) {
      y.left = z;
    } else {
      y.right = z;
    }
    this._insertFixup(z);
  }

  /**
   * Finds an interval in the tree that overlaps the given interval
   * @param  {Number}	start	The overlapping interval's start
   * @param  {Number}	end		The overlapping interval's end
   * @return {Object}			The value of the found interval-node
   */
  findOne(start, end) {
    var x = this._root;
    while (x != null && (end < x.start || start > x.end)) {
      if (_.has(x, 'left') && x.left.maxEnd >= start) {
        x = x.left;
      } else if (_.has(x, 'right')) {
        x = x.right;
      } else {
        return null;
      }
    }
    return x.value;
  }

  /**
   * Finds all intervals in the tree that overlap the given interval
   * @param  {Number} start	The overlapping interval's start
   * @param  {Number} end The overlapping interval's end
   * @return {Object[]}          An array containing all of the values of the overlapping interval-nodes
   */
  findAll(start, end) {
    var intervalList = [];
    var queue = [];
    var x;
    queue.push(this._root);

    while (queue.length) {
      x = queue.pop();
      if (end >= x.start && start <= x.end) {
        intervalList.push(x.value);
      }
      if (_.has(x, 'left') && x.left.maxEnd >= start) {
        queue.push(x.left);
      }
      if (_.has(x, 'right'))
        queue.push(x.right);
    }
    return intervalList;
  }

  /**
   * Removes an interval-node from the tree
   * @param  {number[]} z The interval-key of the node to be removed
   */
  remove(z) {
    var x = null;
    var y = z;
    var yOriginalColor = y.color;
    if (z.left == null) {
      x = z.right;
      this._transplant(z, z.right);
    } else if (z.right == null) {
      x = z.left;
      this._transplant(z, z.left);
    } else {
      y = this._treeMinimum(z.right);
      yOriginalColor = y.color;
      x = y.right;
      if (y.parent == z) {
        x.parent = y;
      } else {
        this._transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }
      this._transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      y.color = z.color;
    }
    if (yOriginalColor == BLACK) {
      this._deleteFixup(x);
    }

    // TODO: Update 'max' attribute of each node affected by delete
  }

  _insertFixup(z) {
    var y;
    while (z.parent != null && z.parent.color == RED) {
      if (z.parent == z.parent.parent.left) {
        y = z.parent.parent.right;
        if (y.color == RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else if (z == z.parent.right) {
          z = z.parent;
          this._rotateLeft(z);
        }
        z.parent.color = BLACK;
        z.parent.parent.color = RED;
        this._rotateRight(z.parent.parent);
      } else {
        y = z.parent.parent.left;
        if (y.color == RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else if (z == z.parent.left) {
          z = z.parent;
          this._rotateRight(z);
        }
        z.parent.color = BLACK;
        z.parent.parent.color = RED;
        this._rotateLeft(z.parent.parent);
      }
    }
    this._root.color = BLACK;
  }

  _deleteFixup(x) {
    var w;
    while (x != this._root && x.color == BLACK) {
      if (x == x.parent.left) {
        w = x.parent.right;
        if (w.color == RED) {
          w.color = BLACK;
          x.parent.color = RED;
          this._rotateLeft(x.parent);
          w = x.parent.right;
        }
        if (w.left.color == BLACK && w.right.color == BLACK) {
          w.color = RED;
          x = x.parent;
        } else {
          if (w.right.color == BLACK) {
            w.left.color = BLACK;
            w.color = RED;
            this._rotateRight(w);
            w = x.parent.right;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK;
          w.right.color = BLACK;
          this._rotateLeft(x.parent);
          x = this._root;
        }
      } else {
        w = x.parent.left;
        if (w.color == RED) {
          w.color = BLACK;
          x.parent.color = RED;
          this._rotateRight(x.parent);
          w = x.parent.left;
        }
        if (w.right.color == BLACK && w.left.color == BLACK) {
          w.color = RED;
          x = x.parent;
        } else {
          if (w.left.color == BLACK) {
            w.right.color = BLACK;
            w.color = RED;
            this._rotateRight(w);
            w = x.parent.left;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK;
          w.left.color = BLACK;
          this._rotateLeft(x.parent);
          x = this._root;
        }
      }
    }
    x.color = BLACK;
  }

  _treeMinimum(subRoot) {
    if (subRoot.left == null) {
      return subRoot;
    } else {
      return this._treeMinimum(subRoot.left);
    }
  }

  _transplant(u, v) {
    if (u.parent == null) {
      this._root = v;
    } else if (u == u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }
    v.parent = u.parent;
  }

  _rotateLeft(x) {
    var y = x.right;
    x.right = y.left;
    if (y.left != null) {
      y.left.parent = x;
    }
    y.parent = x.parent;
    if (x.parent == null) {
      this._root = y;
    } else if (x == x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }
    y.left = x;
    x.parent = y;

    if (y.maxEnd < x.maxEnd)
      y.maxEnd = x.maxEnd;
    else if (x.right.maxEnd > x.maxEnd) {
      x.maxEnd = x.right.maxEnd;
    }
  }

  _rotateRight(y) {
    var x = y.left;
    y.left = x.right;
    if (x.right != null) {
      x.right.parent = y;
    }
    x.parent = y.parent;
    if (y.parent == null) {
      this._root = x;
    } else if (y == y.parent.right) {
      y.parent.right = x;
    } else {
      y.parent.left = x;
    }
    x.left = y;
    y.parent = x;

    if (x.maxEnd < y.maxEnd) {
      x.maxEnd = y.maxEnd;
    } else {
      y.maxEnd = y.left.maxEnd;
    }
  }
}

module.exports = IntervalTree;
