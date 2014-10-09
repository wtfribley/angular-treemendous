angular-treemendous
===================

### Simple, flexible Angular tree with grouping.

Yes, another recursive tree directive.

Instead of providing a ton of features in one monolithic directive,
**angular-treemendous** is very lightweight and modular - other sub-directives
provide additional features like selection, asynchronous loading, etc.

### Usage

Install with [bower](http://bower.io/) or [npm](https://www.npmjs.org/).

`$ bower install angular-treemendous` or `$ npm install angular-treemendous`.

To include **angular-treemendous**, first load the script (or require it if
you're using browserify).

```html
<script src="bower_components/angular-treemendous/angular-treemendous.min.js"></script>
```

Then add the `treemendous` module as a dependency in your Angular code.

```js
var myAppModule = angular.module('myApp', ['treemendous']);
```

This is very much a DIY directive, providing lots of flexibility by leaving the
specifics up to you. **angular-treemendous** focuses on two core aspects of
building a tree:

  - **recursion**
  - **grouping**

There are also sub-directives that add other features - so far:

  - `tree-select`
  - `tree-expand` (this allows async loading)

#### Recursion

Using the `tree-branch` directive within `tree-mendous` creates the recursive
structure. `tree-branch` works a lot like `ng-transclude`, transcluding the
markup contained in the `tree-mendous` directive - this is a recursive process,
as `tree-branch` is itself transcluded.

At each level, the expression provided to the **nodes** attribute is evaluated
and set as `scope.nodes`.

```html
<tree-mendous nodes="collection">
  <div ng-repeat="item in nodes">
    <tree-branch nodes="item.children"></tree-branch>
  </div>
</tree-mendous>

<!-- this could be compiled into something like this: -->

<tree-mendous nodes="collection">
  <div ng-repeat="item in nodes">
    <tree-branch nodes="item.children">
      <div ng-repeat="item in nodes">
        <tree-branch nodes="item.children"></tree-branch>
      </div>
    </tree-branch>
  </div>
</tree-mendous>
```

#### Grouping

At the root `tree-mendous` level and in each `tree-branch`, the collection
provided to the directive may be grouped according to a given property (which
should be present on each item in that collection).

The groups are represented by new "intermediate" branches in the tree. The scope
of these branches will contain a special `scope.$intermediate` property, set to
`true`.

```html
<tree-mendous nodes="collection group by type">
  <div ng-repeat="item in nodes">
    {{$intermediate === true}}
    <tree-branch nodes="item.children"></tree-branch>
  </div>
</tree-mendous>
```

This will create an intermediate branch for each distinct value of the `type`
property found on items in `collection`. Grouping occurs at every level in the
tree - this means that every other level will contain "intermediate" branches.

When groups are created they are given a property named by the "group by"
clause - so, in this example, each group has a property called `type`. All the
nodes in that level with the same `type` are then added to the group under the
`children` property - unless a different property name is specified like so:

```html
<tree-mendous nodes="collection group by type as someOtherName">
  <div ng-repeat="item in nodes">
    <tree-branch nodes="item.someOtherName"></tree-branch>
  </div>
</tree-mendous>
```

This is helpful if your data source uses a property other than `children` to
name each node's children. Then `tree-mendous` will create groups that match
your data source.

#### Selection

Add the `tree-select` directive to any element within the tree to enable
selection, in the form of adding a `$selected` boolean to the surrounding
scope.

`tree-select` may also be given a function, which is called each time its
element is selected (i.e. every other single click). This function may return
`false` to prevent the selection - or a promise which, if rejected or returns
`false`, may also prevent the selection.

`tree-mendous` supports four different select modes:

  - **none** prevents any selection at all.
  - **single** allows only one scope to be selected at a time.
  - **active** allows only one selected scope, but multile `$active` scopes.
  - **multi** allows any number of scopes to be selected.

This is set on the `tree-mendous` directive like so:

```html
<tree-mendous nodes="collection" select-mode="single">
```

#### Expansion

The `tree-expand` directive operates just like `tree-select` - it toggles a
`$expanded` boolean on its scope. It may also be given a function that can
return `false` (or a promise) to prevent the expansion.

That function may also be used to add asynchronous loading behavior. Take the
following example:

```html
<tree-mendous nodes="collection">
  <div ng-repeat="item in nodes" tree-expand="expandFn(item)">
    <tree-branch nodes="item.children" ng-show="$expanded"></tree-branch>
  </div>
</tree-mendous>
```

The expand function could run an async call (via **$http** or similar), use the
result to set the `item.children` property, then return `true` to allow the
expansion - setting `$expanded` to true and showing the next branch of the tree.

If `tree-expand` is used on the same element as `tree-select`, it will require a
**double-click** to trigger.

### Development

First, run `npm install` from the project directory to install dev dependencies.

This module uses [Gulp](http://gulpjs.com/) to build:

`$ gulp build`

[Karma](http://karma-runner.github.io/) - using
[Mocha](http://visionmedia.github.io/mocha/) and [Chai](http://chaijs.com/) - to
test:

`$ gulp test` or `$ npm test`

And to watch files - linting, testing and building on changes:

`$ gulp watch`

-----

&copy; 2014 Weston Fribley

This software is MIT licensed - please see `LICENCE` for details.
