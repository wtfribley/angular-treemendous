describe('directive: treeMendous', function() {
  var scope;
  var $element;
  var $elementGroupBy;
  var directive;
  var directiveGroupBy;

  beforeEach(module('treemendous'));
  
  beforeEach(inject(function(_$compile_, _$rootScope_) {
    scope = _$rootScope_.$new();
    
    $element = angular.element(
      '<tree-mendous nodes="foos">' +
        '<div ng-repeat="node in nodes | filter:filters">' +
          '{{node.name || node.type}}' +
        '</div>' +
      '</tree-mendous>'
    );
    
    $elementGroupBy = angular.element(
      '<tree-mendous nodes="foos group by type">' +
        '<div ng-repeat="node in nodes">{{node.name || node.type}}</div>' +
      '</tree-mendous>'
    );

    directive = _$compile_($element);
    directive(scope);
    directiveGroupBy = _$compile_($elementGroupBy);
    directiveGroupBy(scope);
    
    scope.foos = [
      {name: 'a', type: 'foo'},
      {name: 'b', type: 'foo'},
      {name: 'c', type: 'foo'},
      {name: 'd', type: 'bar'}
    ];
    scope.filters = {};
    scope.$digest();
  }));

  it('should watch the collection indicated in the `nodes` expression, ' +
  'assigning the result to the `nodes` property of a newly-created child scope',
  function() {
    
    expect($element.find('div')).to.have.length(4);

    scope.foos.push({name: 'e', type: 'bar'});
    scope.$digest();
    expect($element.find('div')).to.have.length(5);
    expect($element.find('div').eq(0).text()).to.equal('a');
    
    scope.foos.push({name: 'f', type: 'baz'});
    scope.$digest();
    expect($element.find('div')).to.have.length(6);
  });

  it('should create child scopes with prototypal inheritance (i.e. NOT ' +
  'isolate scopes) - gives access to "outer" scope variables', function() {
    
    scope.filters.name = 'a';
    scope.$digest();
    expect($element.find('div')).to.have.length(1);

    scope.filters.name = '';
    scope.$digest();
    expect($element.find('div')).to.have.length(4);
  });

  it('should watch the collection indicated in the `nodes` expression and ' +
  'use the "group by" clause to create groupings, assigned to the `nodes` ' +
  'property of a newly-created child scope', function() {
    
    expect($elementGroupBy.find('div')).to.have.length(2);

    scope.foos.push({name: 'e', type: 'bar'});
    scope.$digest();
    expect($elementGroupBy.find('div')).to.have.length(2);
    
    scope.foos.push({name: 'f', type: 'baz'});
    scope.$digest();
    expect($elementGroupBy.find('div')).to.have.length(3);
  });

  it('should set the property indicated by the "group by" clause for each ' +
  'created group', function() {

    expect($elementGroupBy.find('div').eq(0).text()).to.equal('foo');
    expect($elementGroupBy.find('div').eq(1).text()).to.equal('bar');

    scope.foos.push({name: 'e', type: 'baz'});
    scope.$digest();
    expect($elementGroupBy.find('div').eq(0).text()).to.equal('foo');
    expect($elementGroupBy.find('div').eq(1).text()).to.equal('bar');
    expect($elementGroupBy.find('div').eq(2).text()).to.equal('baz');
  });
});
