visualizationFunctions.CollapsibleTree = function(element, data, opts) {
  /**
   * The collapsible tree context.
   * @namespace collapsible-tree
   */
  const context = this;

  // Utility functions

  /**
   * A function that does nothing. Mainly used as a default value.
   * @private
   * @memberof collapsible-tree
   */
  function voidFunction() {}

  /**
   * Replaces missing options with default values.
   * @private
   * @memberof collapsible-tree
   * @param  {Object|undefined} object The object with options.
   * @param  {!Object} defaults The object with default values.
   * @return {!Object} An object where any missing values have been replaced
   *                   by the defaults.
   */
  function withDefaults(object, defaults) {
    return Object.assign({}, defaults, object || {});
  }

  // Configuration
  const baseConfig = this.config = this.CreateBaseConfig();
  const config = baseConfig.meta;

  const treeDirection = config.direction || 'horizontal';

  const margins = withDefaults(config.innerMargins, {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  const nodeConfig = config.nodes || {};
  const nodeCallbacks = withDefaults(nodeConfig.callbacks, {
    sorter: null,
    renderer: function(nodeGroup) {
      nodeGroup.append('circle')
        .attr('r', 4.5);
    },
    beforeUpdate: voidFunction,
    afterUpdate: voidFunction
  });

  const linkConfig = config.links || {};
  const linkCallbacks = withDefaults(linkConfig.callbacks, {
    renderer: voidFunction,
    beforeUpdate: voidFunction,
    afterUpdate: voidFunction
  });

  const visConfig = config.visualization || {};
  const visCallbacks = withDefaults(visConfig.callbacks, {
    beforeUpdate: voidFunction,
    afterUpdate: voidFunction
  });

  // State
  let svg = this.SVG = baseConfig.easySVG(element[0]);
  let nodeIdCounter = 0;

  /**
   * A class representing a single node in the tree.
   * @memberof collapsible-tree
   */
  class Node {
    /**
     * Constructs a new node with specified parent and data.
     * @param  {Node} parent The parent node or null if this node is the root.
     * @param  {!Object} data The node data.
     * @param  {Array.<Object>|undefined} data[].children An array of child data.
     */
    constructor(parent, data) {
      /**
       * An unique integer id.
       * @private
       * @type {number}
       */
      this.id_ = nodeIdCounter++;

      /**
       * The parent node.
       * Null if this node is the root.
       * @type {?Node}
       */
      this.parent = parent;

      /**
       * The data associated with this node.
       * @type {!Object}
       */
      this.data = data;

      /**
       * Whether this node is in an expanded state.
       * @type {boolean}
       */
      this.expanded = false;

      /**
       * Cache of the child nodes.
       * @private
       * @type {Array.<Node>}
       */
      this.children_ = null;

      /**
       * Cache of all the child nodes.
       * @private
       * @type {Array.<Node>}
       */
      this.all_children_ = null;

      /**
       * x-coordinate of this node.
       * @type {number}
       */
      this.x = 0;

      /**
       * y-coordiate of this node.
       * @type {number}
       */
      this.y = 0;

      /**
       * Level of this node in the tree.
       * Root is located at depth 0.
       * @type {number}
       */
      this.depth = 0;

      /**
       * Previous x-coordinate of this node.
       * Used when inserting child nodes.
       * @private
       * @type {number}
       */
      this.previousX_ = 0;

      /**
       * Previous y-coordinate of this node.
       * Used when inserting child nodes.
       * @private
       * @type {number}
       */
      this.previousY_ = 0;
    }

    /**
     * Whether this node is a leaf node i.e. has no children.
     * @return {boolean} Whether this node is a leaf node.
     */
    isLeaf() {
      return !this.data.children || this.data.children.length == 0;
    }

    /**
     * The children of this node. Only available if this node is expanded.
     * @type {Array.<Node>}
     */
    get children() {
      if (this.isLeaf() || !this.expanded) {
        return null;
      }

      if (!this.children_) {
        this.children_ = this.all_children;
      }

      return this.children_;
    }

    /**
     * All of this node's children.
     * @type {!Array.<Node>}
     */
    get all_children() {
      if (!this.all_children_) {
        if (this.isLeaf()) {
          this.all_children_ = [];
        } else {
          this.all_children_ = this.data.children.map((data) => {
            return new Node(this, data);
          });
        }
      }

      return this.all_children_;
    }

    /**
     * Callback used by expand and collapse to select child nodes.
     * @callback nodeSelector
     * @memberof collapsible-tree
     * @param {Node} node The child node.
     * @returns {boolean} Whether to select this node.
     */

    /**
     * Expand this node.
     * @param  {string|nodeSelector} [selector='current']
     *         Either 'current', 'all', or a function taking a
     *         single data value. Used to select which nodes to
     *         include in the expansion.
     */
    expand(selector = 'current') {
      if (this.isLeaf()) {
        return;
      }

      if (selector === 'all') {
        this.children_ = this.all_children;
      } else if (typeof selector === 'function') {
        this.children_ = all_children.filter(selector);
      }

      this.expanded = true;
    }

    /**
     * [collapse description]
     * @param  {string|nodeSelector} [selector='current']
     *         Either 'current', 'all', or a function taking a
     *         single data value. Used to select which nodes to
     *         include in the collapse.
     */
    collapse(selector = 'current') {
      if (this.isLeaf()) {
        return;
      }

      if (typeof selector === 'function') {
        this.children_ = (this.children_ || []).filter((child) => {
          return !selector(child);
        });

        if (this.children_ === []) {
          this.children_ = null;
          this.expanded = false;
        }

        return;
      }

      if (selector === 'all') {
        this.children_ = null;
      }

      this.expanded = false;
    }

    /**
     * Toggles the expanded state.
     * @param  {string|nodeSelector} [expandSelector='current']
     *         Either 'current', 'all', or a function taking a
     *         single data value. Used to select which nodes to
     *         include in the expansion.
     * @param  {string|nodeSelector} [collapseSelector='current']
     *         Either 'current', 'all', or a function taking a
     *         single data value. Used to select which nodes to
     *         include in the collapse.
     */
    toggleExpandCollapse(expandSelector = 'current',
                         collapseSelector = 'current') {
        if (this.expanded) {
          this.collapse(collapseSelector);
        } else {
          this.expand(expandSelector);
        }
    }
  }

  // Position calculations

  /**
   * Calculates the position of nodes and links.
   * @private
   * @memberof collapsible-tree
   * @return {!Object} A object containing an array of nodes and
   *                     an array of links
   */
  function calculateNodesAndLinks() {
    const tree = d3.layout.tree().sort(nodeCallbacks.sorter);
    const nodes = tree(context.root);
    const links = tree.links(nodes);

    if (treeDirection === 'horizontal') {
      // Swap x and y coordinates
      nodes.forEach((node) => {
        let tmp = node.x;
        node.x = node.y;
        node.y = tmp;
      });
    }

    calculateAbsoluteNodePositions(nodes);
    return {nodes, links};
  }

  /**
   * Adjusts x- and y-coordinates to the size of the containing svg.
   * @private
   * @memberof collapsible-tree
   * @param  {!Array.<Node>} nodes The nodes to adjust.
   */
  function calculateAbsoluteNodePositions(nodes) {
    const width = baseConfig.dims.fixedWidth - margins.left - margins.right;
    const height = baseConfig.dims.fixedHeight - margins.top - margins.bottom;
    const depth = Math.max(...nodes.map((node) => { return node.depth; }));

    nodes.forEach((node) => {
      node.x *= width * depth / (depth + 1);
      node.x += margins.left;
      node.y *= height;
      node.y += margins.top;
    });
  }

  /**
   * Calculates the transform attribute for a node.
   * @private
   * @memberof collapsible-tree
   * @param  {!Node} node The node.
   * @return {string} The value of the attribute.
   */
  function calculateNodeGroupTransform(node) {
    return `translate(${node.x}px,${node.y}px)`;
  }

  /**
   * Calculates the previous value for the transform attribute.
   * @private
   * @memberof collapsible-tree
   * @param  {!Node} node The node.
   * @return {string} The calculated value.
   */
  function calculatePreviousNodeGroupTransform(node) {
    const previous = {x: node.previousX_, y: node.previousY_};
    return calculateNodeGroupTransform(previous);
  }

  /**
   * Calculates the 'd' attribute value for a link.
   * @private
   * @memberof collapsible-tree
   * @param  {!Node} from The node at which the link starts.
   * @param  {!Node} to The node ath which the link ends.
   * @return {string} The calculated value.
   */
  function calculateLinkCommand(from, to) {
    const halfway = (from.x + to.x) / 2;
    const moveCmd = `M${from.x},${from.y}`;
    const curveCmd = `C${halfway},${from.y} ${halfway},${to.y} ${to.x},${to.y}`;

    return moveCmd + curveCmd;
  }

  /**
   * Calculates the previous 'd' attribute value for a link.
   * @private
   * @memberof collapsible-tree
   * @param  {!Node} from The node at which the link starts.
   * @param  {!Node} to The node ath which the link ends.
   * @return {string} The calculated value.
   */
  function calculatePreviousLinkCommand(from, to) {
    const fromPrevious = {x: from.previousX_, y: from.previousY_};
    const toPrevious = {x: to.previousX_, y: to.previousY_};
    return calculateLinkCommand(fromPrevious, toPrevious);
  }

  // Update functions

  /**
   * Updates the visualization.
   * @memberof collapsible-tree
   * @param {!Node} sourceNode The node that was changed.
   */
  context.update = (sourceNode) => {
    const {nodes, links} = calculateNodesAndLinks();

    updateNodes(nodes, sourceNode);
    updateLinks(links, sourceNode);

    nodes.forEach((node) => {
      node.previousX_ = node.x;
      node.previousY_ = node.y;
    });
  }

  /**
   * Updates, inserts, and removes nodes to reflect
   * the current state of the tree.
   * @private
   * @memberof collapsible-tree
   * @param  {!Array.<Node>} nodes The nodes to display.
   * @param  {!Node} sourceNode The node that has been changed.
   */
  function updateNodes(nodes, sourceNode) {
    let nodeSelection = svg.selectAll('g.collapsible-tree-node')
        .data(nodes, (node) => { return node.id_; })
        .each(function(node) {
          nodeCallbacks.beforeUpdate.call(context, d3.select(this), node);
        });

    nodeSelection.enter().append('g')
        .classed('collapsible-tree-node', true)
        .style('transform', calculatePreviousNodeGroupTransform(sourceNode))
        .style('opacity', 0)
        .each(function(node) {
          nodeCallbacks.renderer.call(context, d3.select(this), node);
          if (!node.isLeaf()) {
            d3.select(this).on('click', (clickedNode) => {
              clickedNode.toggleExpandCollapse();
              context.update(clickedNode);
            });
          }
        });

    nodeSelection.transition().duration(0)
        .style('transform', calculateNodeGroupTransform)
        .style('opacity', 1);

    nodeSelection.exit()
        .on('click', null)
        .on('transitionend.collapsible-tree-node', function() {
          d3.select(this).remove();
        }).transition().duration(0)
        .style('transform', calculateNodeGroupTransform(sourceNode))
        .style('opacity', 0);

    nodeSelection.each(function(node) {
        nodeCallbacks.afterUpdate.call(context, d3.select(this), node);
    });
  }

  /**
   * Updates, inserts, and removes links to reflect
   * the current state of the tree.
   * @private
   * @memberof collapsible-tree
   * @param  {!Array.<Node>} links The links to show.
   * @param  {!Node} sourceNode The node that has been changed.
   */
  function updateLinks(links, sourceNode) {
    let linkSelection = svg.selectAll('path.collapsible-tree-link')
        .data(links, ({target: {id_}}) => { return id_; })
        .each(function({source, target}) {
          linkCallbacks.beforeUpdate.call(context,
              d3.select(this), source, target);
        });

    linkSelection.enter().insert('path', 'g')
        .classed('collapsible-tree-link', true)
        .attr('d', calculatePreviousLinkCommand(sourceNode, sourceNode))
        .style('opacity', 0)
        .each(function({source, target}) {
          linkCallbacks.renderer.call(context, d3.select(this), source, target);
        });

    linkSelection.transition().duration(0)
        .attr('d', ({source, target}) => {
          return calculateLinkCommand(source, target);
        }).style('opacity', 1);

    linkSelection.exit()
        .on('transitionend.collapsible-tree-link', function() {
          d3.select(this).remove();
        }).transition().duration(0)
        .attr('d', calculateLinkCommand(sourceNode, sourceNode))
        .style('opacity', 0);

    linkSelection.each(function({source, target}) {
      linkCallbacks.afterUpdate.call(context, d3.select(this), source, target);
    });
  }

  /**
   * Collapsible tree visualization function.
   * @memberof collapsible-tree
   */
  context.VisFunc = () => {
    /**
     * Root node of the tree.
     * @memberof collapsible-tree
     * @type {!Node}
     */
    let root = context.root = new Node(null, context.data);

    if (treeDirection === 'horizontal') {
      root.previousX_ = 0;
      root.previousY_ = baseConfig.dims.fixedHeight / 2;
    } else {
      root.previousX_ = baseConfig.dims.fixedWidth / 2;
      root.previousY_ = 0;
    }

    visCallbacks.beforeUpdate.call(context);
    context.update(root);
    visCallbacks.afterUpdate.call(context);
  }

  context.Node = Node;

  return context;
}
