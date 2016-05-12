var _ = require('lodash');
/**
 *
 * Extension of a Red-Black-Tree optimized for having Intervals as node-keys.
 * Pseudocode taken from book: Introduction to Algorithms, Third Edition (By:
 * Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest and Clifford Stein)
 *
 * @author Nicolas Morew
 *
 * @param <T>
 *            (Comparable) Data-type of the points in an interval
 */
function IntervalTree (){
  const RED = true;
  const BLACK = false;
  var root;

  /**
   * Creates a new node with the given as its key and inserts it into the tree
   *
   * @param key
   *            The interval to be inserted
   */

  function insert(interval, value) {

    var x = root;
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
      root = z;
    } else if (z.start < y.start) {
      y.left = z;
    } else {
      y.right = z;
    }

    insertFixup(z);

  }

  function insertFixup(z) {
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
          rotateLeft(z);
        }
        z.parent.color = BLACK;
        z.parent.parent.color = RED;
        rotateRight(z.parent.parent);
      } else {
        y = z.parent.parent.left;
        if (y.color == RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else if (z == z.parent.left) {
          z = z.parent;
          rotateRight(z);
        }
        z.parent.color = BLACK;
        z.parent.parent.color = RED;
        rotateLeft(z.parent.parent);
      }
    }
    this.root.color = BLACK;
  }

  /**
   * @param z
   *            The node
   */
  function remove(z) {
    var x = null;
    var y = z;
    var yOriginalColor = y.color;
    if (z.left == null) {
      x = z.right;
      transplant(z, z.right);
    } else if (z.right == null) {
      x = z.left;
      transplant(z, z.left);
    } else {
      y = treeMinimum(z.right);
      yOriginalColor = y.color;
      x = y.right;
      if (y.parent == z) {
        x.parent = y;
      } else {
        transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }
      transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      y.color = z.color;
    }
    if (yOriginalColor == BLACK) {
      deleteFixup(x);
    }

    // TODO: Update 'max' attribute of each node affected by delete
    // (irrelevant for immediate task).
  }

  function deleteFixup(x) {
    var w;
    while (x != this.root && x.color == BLACK) {
      if (x == x.parent.left) {
        w = x.parent.right;
        if (w.color == RED) {
          w.color = BLACK;
          x.parent.color = RED;
          rotateLeft(x.parent);
          w = x.parent.right;
        }
        if (w.left.color == BLACK && w.right.color == BLACK) {
          w.color = RED;
          x = x.parent;
        } else {
          if (w.right.color == BLACK) {
            w.left.color = BLACK;
            w.color = RED;
            rotateRight(w);
            w = x.parent.right;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK;
          w.right.color = BLACK;
          rotateLeft(x.parent);
          x = this.root;
        }
      } else {
        w = x.parent.left;
        if (w.color == RED) {
          w.color = BLACK;
          x.parent.color = RED;
          rotateRight(x.parent);
          w = x.parent.left;
        }
        if (w.right.color == BLACK && w.left.color == BLACK) {
          w.color = RED;
          x = x.parent;
        } else {
          if (w.left.color == BLACK) {
            w.right.color = BLACK;
            w.color = RED;
            rotateRight(w);
            w = x.parent.left;
          }
          w.color = x.parent.color;
          x.parent.color = BLACK;
          w.left.color = BLACK;
          rotateLeft(x.parent);
          x = this.root;
        }
      }
    }
    x.color = BLACK;
  }

  function treeMinimum(subRoot) {
    if (subRoot.left == null) {
      return subRoot;
    } else {
      return treeMinimum(subRoot.left);
    }
  }

  function transplant(u, v) {
    if (u.parent == null) {
      this.root = v;
    } else if (u == u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }
    v.parent = u.parent;
  }

  function rotateLeft(x) {
    var y = x.right;
    x.right = y.left;
    if (y.left != null) {
      y.left.parent = x;
    }
    y.parent = x.parent;
    if (x.parent == null) {
      this.root = y;
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

  function rotateRight(y) {
    var x = y.left;
    y.left = x.right;
    if (x.right != null) {
      x.right.parent = y;
    }
    x.parent = y.parent;
    if (y.parent == null) {
      this.root = x;
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

  /**
   * Finds an interval in the tree that overlaps the given interval
   *
   * @param interval
   *            The overlapping interval
   * @return The first found overlapping interval
   */
  function findOne(interval) {
    var x = root;
    while (x != null && (interval[1] < x.start || interval[0] > x.end)) {
      if (_.has(x, 'left') && x.left.maxEnd >= interval[0]) {
        x = x.left;
      } else if(_.has(x, 'right')){
        x = x.right;
      } else{
        return null;
      }
    }
    return x.value;
  }

  /**
   * Finds all intervals in the tree that overlaps the given interval
   *
   * @param interval
   *            The overlapping interval
   * @return A list of overlapping intervals
   */
  function findAll(interval) {
    var intervalList = [];
    var queue = [];
    var x;
    queue.push(root);

    while (queue.length) {
      x = queue.pop();
      if (interval[1] >= x.start && interval[0] <= x.end) {
        intervalList.push(x.value);
      }
      if (_.has(x, 'left') && x.left.maxEnd >= interval[0]) {
        queue.push(x.left);
      }
      if (_.has(x, 'right'))
        queue.push(x.right);
    }
    return intervalList;
  }

  function log(){
    console.log('root', root);
  }

  return {
    insert: insert,
    remove: remove,
    findOne: findOne,
    findAll: findAll,
    log: log
  }
}

module.exports = IntervalTree;
