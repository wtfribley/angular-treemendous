(function(angular) {
  'use strict';

  /**
   * @typedef {Error} treeMendousMinErr
   */
  var treeMendousMinErr = angular.$$minErr('treemendous');

  angular.module('treemendous', ['ngAnimate'])

/**
 * @ngdoc service
 * @name treemendous.treemendousParser
 */
.factory('treemendousParser', ['$parse', function($parse) {

  // jscs:disable maximumLineLength
  var BRANCH_REGEXP = /^s*([\s\S]+?)(?:\s+group\s+by\s+([\$\w][\$\w\d]*)(?:\s+as\s+([\$\w][\$\w\d]*))?)?$/;
  // jscs:enable

  return {
    parse: function(expression) {
      var match = expression.match(BRANCH_REGEXP);

      if (!match) {
        throw treeMendousMinErr('iexp',
          "Expected expression in the form of '_nodes_ (group by _property_ " +
          "(as _children_)?)?' but got '{0}'.", expression);
      }

      return {
        nodes: $parse(match[1]),
        groupBy: match[2] || false,
        children: match[3] || 'children'
      };
    }
  };
}])

/**
 * @ngdoc type
 * @name listview.ListViewCtrl
 */
.controller('TreeMendousCtrl',
['$animate', 'treemendousParser', function($animate, treemendousParser) {

  /**
   * @ngdoc property
   * @name treemendous.TreeMendousCtrl#transclude
   *
   * @description
   * Set by {@link treemendous.treeMendous}, used to transclude the same DOM
   * content into all branches of the tree.
   */
  this.transclude = null;

  /**
   * @ngdoc property
   * @name treemendous.TreeMendousCtrl#expression
   *
   * @description
   * The branch expression defined by the "nodes" attribute of the
   * {@link treemendous.treeMendous} directive.
   */
  this.expression = '';

  /**
   * @ngdoc property
   * @name treemendous.TreeMendousCtrl#selectMode
   *
   * @description
   * A string describing how selection should work on this tree.
   *
   * May be one of the following values:
   *   - **none** Do not allow selection.
   *   - **single** Only one tree node may be selected at a time.
   *   - **active** Same as single, but many nodes may be active.
   *   - **multi** Any number of nodes may be selected at a time.
   */
  this.selectMode = 'none';

  var selectElements = [];
  var selectScopes = [];
  var parse;

  /**
   * @ngdoc method
   * @name treemendous.TreeMendousCtrl#registerSelect
   * @kind function
   *
   * @description
   * The {@link treemendous.treeSelect} directive uses this to register its
   * element and scope for selection.
   *
   * @param {object} $element A jqLite-wrapped element to select/deselect.
   * @param {object} scope A scope to select/deselect.
   * @returns {function()} Call this function to deregister the element & scope.
   */
  this.registerSelect = function registerSelect($element, scope) {

    selectElements.push($element);
    selectScopes.push(scope);

    return function() {
      var elIndex = selectElements.indexOf($element);
      var scIndex = selectScopes.indexOf(scope);

      if (elIndex > -1) selectElements.splice(elIndex, 1);
      if (scIndex > -1) selectScopes.splice(scIndex, 1);
    };
  };

  /**
   * @ngdoc method
   * @name treemendous.TreeMendousCtrl#select
   * @kind function
   *
   * @description
   * Select an `element` and `scope`, using the controller's **selectMode**.
   * A selected element will have the "selected" class, an active one the
   * "active" class. A selected scope will have `$selected === true`, an active
   * one `$active === true`.
   *
   * Works in conjunction with {@link treemendous.TreeMendousCtrl#selectMode}.
   *
   * @param {obj} $element The jqLite element to select.
   * @param {obj} scope The scope to select.
   */
  this.select = function select($element, scope) {
    if (this.selectMode == 'none') return;
    if (!~selectElements.indexOf($element)) return;

    // selectElements.length will ALWAYS === selectScopes.length.
    if (~['single', 'active'].indexOf(this.selectMode)) {
      for (var i = 0, len = selectElements.length; i < len; i++) {
        $animate.removeClass(selectElements[i], 'selected');
        selectScopes[i].$selected = false;
      }
    }

    $animate.addClass($element, 'selected');
    scope.$selected = true;

    if (this.selectMode == 'active') {
      $animate.addClass($element, 'active');
      scope.$active = true;
    }
  };

  /**
   * @ngdoc method
   * @name treemendous.TreeMendousCtrl#deselect
   * @kind function
   *
   * @description
   * Deselects a given `$element` and `scope`.
   *
   * @param {obj} $element The jqLite element to deselect.
   * @param {obj} scope The scope to deselect.
   */
  this.deselect = function deselect($element, scope) {
    $animate.removeClass($element, 'active');
    $animate.removeClass($element, 'selected');
    scope.$active = false;
    scope.$selected = false;
  };

  /**
   * @ngdoc method
   * @name treemendous.TreeMendousCtrl#expand
   * @kind function
   *
   * @description
   * Expands a given `$element` and `scope`.
   *
   * @param {obj} $element The jqLite element to expand.
   * @param {obj} scope The scope to expand.
   */
  this.expand = function expand($element, scope) {
    $animate.removeClass($element, 'tree-branch-collapsed');
    $animate.addClass($element, 'tree-branch-expanded');
    scope.$expanded = true;
  };

  /**
   * @ngdoc method
   * @name treemendous.TreeMendousCtrl#collapse
   * @kind function
   *
   * @description
   * Collapses a given `$element` and `scope`.
   *
   * @param {obj} $element The jqLite element to collapse.
   * @param {obj} scope The scope to collapse.
   */
  this.collapse = function collapse($element, scope) {
    $animate.removeClass($element, 'tree-branch-expanded');
    $animate.addClass($element, 'tree-branch-collapsed');
    scope.$expanded = false;
  };

  /**
   * @ngdoc method
   * @name treemendous.TreeMendousCtrl#watch
   * @kind function
   *
   * @description
   * Uses the {@link treemendous.treeMendous} "branch" expression or a provided
   * expression to mirror a collection from `scope` to `branchScope`.
   *
   * The "nodes" expression on `tree-mendous` may contain a "group by _prop_ (as
   * _children_)?" clause - this causes the insertion of **"intermediate"**
   * branches into the tree. These branches group nodes by `_prop_`, doubling
   * the depth of the tree.
   *
   * When using "group by foo as bar", here's an example intermediate branch:
   *
   * ```js
   * // original collection
   * [
   *  {foo: 'a', baz: 'something'},
   *  {foo: 'a', bap: 'weeeeee'},
   *  {foo: 'b', boop: 'beep'},
   *  {foo: 'b'}
   * ]
   *
   * // groups
   * [
   *  {foo: 'a', bar: [
   *    {foo: 'a', baz: 'something'},
   *    {foo: 'a', bap: 'weeeeee'}
   *  ]},
   *  {foo: 'b', bar: [
   *    {foo: 'b', boop: 'beep'},
   *    {foo: 'b'}
   *  ]}
   * ]
   * ```
   *
   * The "nodes" expression on `tree-branch` may only specify the collection to
   * watch - any "group by" or "as" clauses will be ignored in favor of those on
   * the root `tree-mendous` directive.
   *
   * @param {obj} branchScope Scope on which to add a set of nodes.
   * @param {obj} scope The scope to watch for a set of nodes.
   * @param {string} [expression] This expression should name the collection to
   * watch.
   */
  this.watch = function watch(branch, scope, expression) {
    if (!parse) parse = treemendousParser.parse(this.expression);

    var nodesExp = (expression)
      ? treemendousParser.parse(expression).nodes
      : parse.nodes;

    scope.$watchCollection(nodesExp, function(nodes) {
      if (!nodes) return (branch.nodes = []);
      if (!parse.groupBy || scope.$intermediate) {
        branch.$intermediate = false;
        return (branch.nodes = nodes);
      }

      branch.$intermediate = true;
      makeGroups(branch, nodes);
    });

    // when using "group by", changes to each scope's array of nodes must be
    // manually propagated *up* the tree structure.
    if (parse.groupBy) {
      branch.$watchCollection(nodesExp, function(nodes, prevNodes) {
        if (!nodes || nodes.length === 0 || nodes === prevNodes) return;
        if (branch.$intermediate) return;

        var parent = scope;
        while (parent.$intermediate === true) parent = parent.$parent;

        if (nodesExp(parent)) nodesExp.assign(parent, nodes);
      });
    }
  };

  // add groups to `scope`, extracted from `nodes` using the parsed
  // `this.expression`.
  //
  // pushes nodes to groups, rather than simply reassigning, so as to prevent
  // destruction of tree branches and the associated loss of state. If the
  // scope's nodes array is simply replaced, all the branches will be destroyed
  // and re-drawn, causing them to revert to a default state (i.e. collapsed).
  function makeGroups(scope, nodes) {
    var children = parse.children;
    var groupBy = parse.groupBy;
    var groups = {};
    var group;
    var node;

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

    groups = Object.keys(groups)
    .map(function(group) { return groups[group]; });

    for (i = 0, len = groups.length; i < len; i++) {
      group = groups[i];

      if (scope.nodes.some(pushTo(group))) continue;

      scope.nodes.push(group);
    }
  }

  function pushTo(group) {
    var children = parse.children;
    var groupBy = parse.groupBy;

    return function(existingGroup) {

      if (existingGroup[groupBy] === group[groupBy]) {
        group[children].forEach(function(child) {
          if (~existingGroup[children].indexOf(child)) return;
          existingGroup[children].push(child);
        });

        return true;
      }

      return false;
    };
  }
}])

.directive('treeMendous', function() {

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
    link: function(scope, $element, attrs, ctrl, transclude) {

      // the controller will arbitrate selection - it needs to know the mode.
      ctrl.selectMode = SELECT_MODES[attrs.selectMode] || 'none';

      // each branch needs access to the same transclude function.
      ctrl.transclude = transclude;

      // in order to watch the collection and generate groups, the controller
      // needs to have access to the `attrs.nodes` expression.
      ctrl.expression = attrs.nodes || '';

      // the next three statements are duplicated from `treeBranch` - is there
      // any way to be DRY here?
      var branchScope = scope.$new();
      branchScope.nodes = [];
      transclude(branchScope, function(clone) { $element.append(clone); });
      ctrl.watch(branchScope, scope);
    }
  };
})

/**
 * @ngdoc directive
 * @name treemendous.treeBranch
 * @restrict EA
 *
 * @description
 * Use this directive to place the next branch in the tree, forming a recursive
 * structure. All the markup contained in the {@link treemendous.treeMendous}
 * directive will be transcluded into this element.
 *
 * @param {expression} nodes A string expression evaluated against the
 * containing scope, used to determing the set of nodes for the this branch.
 */
.directive('treeBranch', function() {
  return {
    restrict: 'EA',
    require: '^treeMendous',
    link: function(scope, $element, attrs, ctrl) {

      // each branch creates its own scope to hold stuff like `$intermediate`
      // and `$expanded` and `$selected` and such.
      var branchScope = scope.$new();

      // prevent prototypal inheritance of nodes.
      branchScope.nodes = [];

      // transclude the same DOM structure into this each new branch.
      ctrl.transclude(branchScope, function(clone) { $element.append(clone); });

      // watch the "node" expression on the scope, mirroring it to the branch
      // scope, creating groups if required by the "group by" clause.
      ctrl.watch(branchScope, scope, attrs.nodes);
    }
  };
})

/**
 * @ngdoc directive
 * @name treemendous.treeSelect
 * @restrict EA
 *
 * @description
 * This directive controls node selection by toggling the **"selected"** (and
 * sometimes the **"active"**) class on its element. It also toggles the boolean
 * scope variables `$selected` and `$active`.
 *
 * An expression may be given to `treeSelect` (using the `selectIf` attribute if
 * the directive is an element). When this expression evaluates to `false` (or
 * returns a promise which is rejected or resolves to `false), the selection
 * will be canceled.
 *
 * @param {string} [selectIf] An expression.
 * @param {string} [selectOn=click] Set the event which calls the expression.
 */
.directive('treeSelect', ['$q', '$timeout', function($q, $timeout) {
  return {
    restrict: 'EA',
    require: '^treeMendous',
    link: function(scope, $element, attrs, ctrl) {
      if (ctrl.selectMode == 'none') return;

      var eventName = attrs.selectOn || 'click';
      var handler = attrs.treeSelect || attrs.selectIf || true;

      // register the element -- returns a function to deregister the element
      // when the scope is destroyed.
      scope.$on('$destroy', ctrl.registerSelect($element, scope));

      // prevent prototypal inheritance of `$selected` and `$active`.
      scope.$selected = false;
      scope.$active = false;

      var select = function select(event) {
        event.stopPropagation();

        if (scope.$selected) {
          return scope.$apply(function() { ctrl.deselect($element, scope); });
        }

        $q.when(scope.$eval(handler, {$event: event})).then(function(select) {
          if (select === false) return;
          ctrl.select($element, scope);
        });
      };

      // to provide compatibility with other directives, click events are
      // debounced so we only select once per double-click (we don't
      // completely separate click from dblclick, because there's no good way
      // to do so without causing a delay between click and selection).
      $element.on(eventName, ((eventName == 'click')
        ? debounce(select, $timeout)
        : select
      ));
    }
  };
}])

/**
 * @ngdoc directive
 * @name treemendous.treeExpand
 * @restrict EA
 *
 * @description
 * This directive controls node selection by toggling the **"selected"** (and
 * sometimes the **"active"**) class on its element. It also toggles the boolean
 * scope variables `$selected` and `$active`.
 *
 * An expression may be given to `treeSelect` (using the `selectIf` attribute if
 * the directive is an element). When this expression evaluates to `false` (or
 * returns a promise which is rejected or resolves to `false), the selection
 * will be canceled.
 *
 * @param {string} [selectIf] An expression.
 * @param {string} [selectOn=click] Set the event which calls the expression.
 */
.directive('treeExpand', ['$q', '$timeout', function($q, $timeout) {
  return {
    restrict: 'EA',
    require: '^treeMendous',
    link: function(scope, $element, attrs, ctrl) {
      var eventName = attrs.expandOn || 'click';
      var handler = attrs.treeExpand || attrs.expand || true;

      // when on the same element as `tree-select`, the default is dblclick.
      if ((attrs.treeSelect !== void 0 ||
        $element[0].tagName == 'tree-select' ||
        $element[0].tagName == 'data-tree-select') && !attrs.expandOn) {
        eventName = 'dblclick';
      }

      // prevent prototypal inheritance of $expanded.
      scope.$expanded = false;

      var expand = function expand(event) {
        event.stopPropagation();

        if (scope.$expanded) {
          return scope.$apply(function() { ctrl.collapse($element, scope); });
        }

        $q.when(scope.$eval(handler, {$event: event})).then(function(expand) {
          if (expand === false) return;
          ctrl.expand($element, scope);
        });
      };

      $element.on(eventName, ((eventName == 'click')
        ? debounce(expand, $timeout)
        : expand
      ));
    }
  };
}]);

  function debounce(fn, $timeout) {
    var timer = null;

    return function(event) {

      // we need to stop event propagation even if `fn` is not called.
      event.stopPropagation();

      var callNow = !timer;

      $timeout.cancel(timer);
      timer = $timeout(function() { timer = null; }, 300);

      if (callNow) fn.apply(this, arguments);
    };
  }

})(angular);
