(function(angular) {
  'use strict';

  /**
   * @typedef {Error} TreeMendousMinErr
   */
  var TreeMendousMinErr = angular.$$minErr('treemendous');

  angular.module('treemendous', ['ngAnimate'])

.factory('treemendousParser', ['$parse', function($parse) {

  // jscs:disable maximumLineLength
  var BRANCH_REGEXP = /^s*([\s\S]+?)(?:\s+group\s+by\s+([\$\w][\$\w\d]*)(?:\s+as\s+([\$\w][\$\w\d]*))?)?$/;
  // jscs:enable

  return {
    parse: function(expression) {
      var match = expression.match(BRANCH_REGEXP);

      if (!match) {
        throw new TreeMendousMinErr('iexp',
          "Expected expression in the form of '_nodes_ (group by _property_ " +
          "(as _children_)?)?' but got '{0}'.", expression);
      }

      return {
        nodeMapper: $parse(match[1]),
        groupBy: match[2] || false,
        children: match[3] || 'children'
      };
    }
  };
}])

/**
 * @ngdoc type
 * @name treeMendous.TreeMendousCtrl
 *
 * @property {string} selectMode One of four possible values to control behavior
 *  of the treeSelect directive.
 *
 *  - **none** prevents selection.
 *  - **single** allows only a single node (i.e. scope) to be selected.
 *  - **active** allows only a single selected node, but many "active" nodes.
 *  - **multi** any number of nodes may be selected at any given time.
 *
 * @property {function()} transclude Stores the transclude function from the
 *  **treeMendous** directive (i.e. the tree's root), to be reused by all of the
 *  tree's branches.
 * @property {Array} selectScopes The treeSelect directive registers its scope
 *  as a member of this array, allowing the controller to arbitrate selection.
 */
.controller('TreeMendousCtrl', ['$animate', function($animate) {
  var groupBy = false;
  var children = 'children';

  this.selectMode = 'none';
  this.selectElements = [];
  this.transclude = null;
  this.parserResult = null;

  /**
   * @ngdoc method
   * @name treeMendous.TreeMendousCtrl#setParserResult
   * @kind function
   *
   * @description
   * Set the results of an expression parsed with treemendousParser.
   *
   * @param {obj} result treemendousParser results.
   */
  this.setParserResult = function setParserResult(result) {
    this.parserResult = result;
    groupBy = result.groupBy;
    children = result.children;
  };

  /**
   * @ngdoc method
   * @name treeMendous.TreeMendousCtrl#watchNodes
   * @kind function
   *
   * @description
   * Watch a collection of nodes on **parentScope**, using **nodeMapper** as the
   * watch expression. A new set of nodes will be added to **scope**, based on
   * the **nodeMapper** and the previously-set **groupBy** variable.
   *
   * @param {obj} scope Scope on which to add a set of nodes.
   * @param {obj} parentScope The scope to watch for a set of nodes.
   * @param {string|Array|function()} watchExp A watch expression - also used in
   * the **getNodes** function -- see its docs for more.
   * @throws {treeMendousMinErr}
   */
  this.watchNodes = function watchNodes(scope, parentScope, watchExp) {
    var typeofWatch = Array.isArray(watchExp) ? 'array' : typeof watchExp;

    if (['function', 'string', 'array'].indexOf(typeofWatch) < 0) {
      throw new TreeMendousMinErr('type',
        'Expected watchExp to be a function, string or array ' +
        "but got '{0}'.", typeofWatch);
    }

    parentScope.$watchCollection(watchExp, function() {
      var nodes = getNodes(parentScope, watchExp);

      scope.$intermediate = nodes.$intermediate;
      scope.nodes = nodes.nodes;
    });
  };

  /**
   * @private
   * @description
   * Given a scope and set of nodes, determine if they should be grouped, do
   * the grouping and return the (possibly) modified nodes.
   *
   * @param {Scope} scope The scope containing a set of nodes and an
   *  $intermediate property, indicating whether those nodes are groupings.
   * @param {string|Array|function()} nodes May be a function created by $parse,
   *  used to map an expression to a set of nodes **OR** a string, evaluated
   *  against the given scope **OR** the actual array of nodes.
   */
  function getNodes(scope, nodes) {
    var groups = {};
    var node;
    var group;

    // nodes may be one of the following:
    // a function created by $parse, to be evaluated against the scope.
    if (typeof nodes == 'function') nodes = nodes(scope) || [];

    // a string naming the nodes variable in the scope.
    else if (typeof nodes == 'string') nodes = scope.$eval(nodes) || [];

    // the actual array of nodes
    else if (Array.isArray(nodes)) nodes = nodes;

    if (groupBy === false) return {nodes: nodes};
    if (scope.$intermediate === true) {
      return {nodes: nodes, $intermediate: false};
    }

    for (var i = 0, len = nodes.length; i < len; i++) {
      node = nodes[i];
      group = node[groupBy];

      if (!groups[group]) {
        groups[group] = {};
        groups[group][children] = [node];
        groups[group][groupBy] = group;
      }
      else {
        groups[group][children].push(node);
      }
    }

    return {
      $intermediate: true,
      nodes: Object.keys(groups).map(function(group) {
        return groups[group];
      })
    };
  }

  /**
   * @ngdoc method
   * @name treeMendous.TreeMendousCtrl#select
   * @kind function
   *
   * @description
   * Select a given **element**, using the controller's **selectMode**.
   * A selected element will have the "selected" class, an active one the
   * "active" class.
   *
   *  - A selectMode of "none" prevents selection.
   *  - "single" or "active" allows only one element to be selected at a time.
   *  - "active" also allows many elements to be active.
   *  - "multi" allows many elements to be selected (no active elements).
   *
   * @param {obj} $element The jqLite element to select.
   */
  this.select = function select($element) {
    var selectMode = this.selectMode;

    if (selectMode == 'none') return;

    if (selectMode == 'single' || selectMode == 'active') {
      for (var i = 0, len = this.selectElements.length; i < len; i++) {
        $animate.removeClass(this.selectElements[i], 'selected');
      }
    }

    $animate.addClass($element, 'selected');
    if (selectMode == 'active') $animate.addClass($element, 'active');
  };

  /**
   * @ngdoc method
   * @name treeMendous.TreeMendousCtrl#deselect
   * @kind function
   *
   * @description
   * Deselects a given element by removing the "selected" (and potentially the
   * "active") class.
   *
   * @param {obj} $element The jqLite element to deselect.
   */
  this.deselect = function deselect($element) {
    if ($element.hasClass('active')) $animate.removeClass($element, 'active');
    $animate.removeClass($element, 'selected');
  };

  /**
   * @ngdoc method
   * @name treeMendous.TreeMendousCtrl#registerSelectElement
   * @kind function
   *
   * @description
   * The treeSelect directive registers its element to be selected.
   *
   * @param {object} $element A jqLite-wrapped element to select/deselect.
   * @returns {function()} Call this function to deregister the element.
   */
  this.registerSelectElement = function registerSelectElement($element) {
    var selectElements = this.selectElements;

    selectElements.push($element);
    return function() {
      selectElements.splice(selectElements.indexOf($element), 1);
    };
  };
}])

/**
 * @ngdoc directive
 * @name treeMendous
 *
 * @description
 * **treeMendous** is a directive for displaying data in a tree-like structure.
 * The markup contained within the directive - in conjunction with the
 * **treeBranch** directive - will be recursively transcluded to display an
 * arbitrary number of "levels", drilling down into the tree.
 *
 * Nodes in a tree-like structure may be given to this directive, and may be
 * grouped by a named property. These groupings appear as "intermediate" levels
 * in the tree hierarchy.
 *
 * @example
    <example>
      <tree-mendous nodes="nodes group by type">
        <ul>
          <li ng-repeat="node in nodes">
            <pre>{{node | json}}</pre>
            <tree-branch nodes="node.children"></tree-branch>
          </li>
        </ul>
      </tree-mendous>
    </example
 *
 * @param {string=} selectMode Control how items are selected.
 *
 *  - `single`: only one item may be selected at a time.
 *  - `multi`: many items may be selected, shift-click/ctrl-click are enabled.
 *  - `active`: only one item may be selected, but many can be marked "active".
 *
 * @param {expression} nodes in one of the following forms:
 *
 *  - `collection`
 *  - `collection` **`group by`** `group`
 *
 * Where:
 *
 *  - `collection`: an array or a function which returns an array (this
 *    expression may include filters, sorting, etc).
 *  - `group`: A named property of each item in the collection, used to group
 *    those items by creating "intermediate" grouping branches in the tree.
 */
.directive('treeMendous', ['treemendousParser', function(parser) {

  var SELECT_MODES = {
    single: 'single',
    multi: 'multi',
    active: 'active',
    none: 'none'
  };

  return {
    restrict: 'EA',
    transclude: true,
    controller: 'TreeMendousCtrl',
    link: function(parentScope, $element, attrs, ctrl, transclude) {

      // the controller will arbitrate selection - it needs to know the mode.
      ctrl.selectMode = SELECT_MODES[attrs.selectMode] || 'none';

      // provide access to the root-level's transclusion function to children.
      ctrl.transclude = transclude;

      // we use manual watches and parsing to handle "group by" behavior. The
      // controller handles this (preventing code duplication).
      ctrl.setParserResult(parser.parse(attrs.nodes));

      // a new scope will prevent pollution into the outer "parent" scope, but
      // also provide a place to safely attach generated groups and other data.
      var scope = parentScope.$new();

      // because we need access to the transclude function, we'll have to do our
      // simple transclusion manually.
      transclude(scope, function(clone) { $element.append(clone); });

      // watch the node expression, create groups (if indicated by "group by")
      // and assign to the new scope.
      ctrl.watchNodes(scope, parentScope, ctrl.parserResult.nodeMapper);
    }
  };
}])

/**
 * @ngdoc directive
 * @name treeBranch
 *
 * @description
 * Use this directive to place the next branch in the tree, forming a recursive
 * structure. All the markup contained in the treeMendous directive will be
 * recursively transcluded into this element.
 *
 * @param {expression} nodes A string expression evaluated against the
 * containing scope, used to determing the set of nodes for the next branch.
 */
.directive('treeBranch', function() {

  return {
    restrict: 'EA',
    require: '^treeMendous',
    link: function(parentScope, $element, attrs, ctrl) {

      // each branch must isolate its scope to prevent selection / expansion
      // from leaking out.
      var scope = parentScope.$new();

      // transclude elements from the root level into this new scope.
      ctrl.transclude(scope, function(clone) { $element.append(clone); });

      // watch nodes, create intermediate groupings, etc.
      ctrl.watchNodes(scope, parentScope, attrs.nodes);
    }
  };
})

/**
 * @ngdoc directive
 * @name treeMendous.treeSelect
 * @restrict A
 *
 * @description
 * This directive will respond to clicks by toggling the **selected** class on
 * its element.
 *
 * It works in conjuction with the TreeMendousCtrl to implement the various
 * selectModes.
 *
 * @param {function()=} treeSelect Optionally provide a function (parsed against
 * the directive's scope), called when the element is selected. It may return
 * **false** to prevent selection - or a promise that, if rejected or resolved
 * with **false**, may prevent selection.
 */
.directive('treeSelect',
['$parse', '$q', '$timeout', function($parse, $q, $timeout) {
  return {
    restrict: 'A',
    require: '^treeMendous',
    link: function(scope, $element, attrs, ctrl) {
      var handler = function() { return true; };
      var timer = null;

      // register the element with the controller, allowing it to control
      // selection across the entire tree.
      var deregisterElement = ctrl.registerSelectElement($element);
      scope.$on('$destroy', deregisterElement);

      // the select function can return an explicit false to prevent selection.
      if (attrs.treeSelect) handler = $parse(attrs.treeSelect);

      // to provide compatibility with the treeExpand directive, the click
      // handler is debounced so as to only fire once on a double click.
      $element.on('click', function(event) {
        event.stopPropagation();

        var callFn = !timer;
        $timeout.cancel(timer);
        timer = $timeout(function() { timer = null; }, 300);

        if (callFn) {
          if ($element.hasClass('selected')) return ctrl.deselect($element);

          // support promises - promises that are rejected or return false
          // will prevent selection.
          $q.when(handler(scope, {$event: event})).then(function(select) {
            if (select !== false) ctrl.select($element);
          });
        }
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @name treeMendous.treeExpand
 * @restrict A
 *
 * @description
 * This directive will respond to clicks by toggling the **$expanded** boolean
 * property of its scope.
 *
 * When placed on the same element as the **treeSelect** directive, a double
 * click is required to trigger expansion.
 *
 * @param {function()=} treeExpand Optionally provide a function (parsed against
 * the directive's scope), called when the scope is expanded. Like
 * **treeSelect**, this function may be used to prevent expansion and supports
 * promises.
 */
.directive('treeExpand', ['$parse', '$q', function($parse, $q) {
  return {
    restrict: 'A',
    require: '^treeMendous',
    link: function(scope, $element, attrs) {

      // when this directive is used on the same element as the treeSelect
      // directive, it requires a dblclick to expand.
      var eventName = attrs.treeSelect === void 0 ? 'click' : 'dblclick';
      var handler;

      // prevent prototypal inheritance of this particular property.
      scope.$expanded = false;

      // no expand function? use a noop which returns undefined.
      if (attrs.treeExpand) handler = $parse(attrs.treeExpand);
      else handler = angular.noop;

      $element.on(eventName, function(event) {
        event.stopPropagation();

        if (scope.$expanded) {
          return scope.$apply(function() { scope.$expanded = false; });
        }

        $q.when(handler(scope, {$event: event})).then(function(expand) {
          if (expand !== false) scope.$expanded = true;
        });
      });
    }
  };
}]);

})(angular);
