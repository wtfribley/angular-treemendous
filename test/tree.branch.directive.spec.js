describe('directive: treeBranch', function() {
  var scope;
  var $element;
  var directive;

  beforeEach(module('treemendous'));
  
  beforeEach(inject(function(_$compile_, _$rootScope_) {
    scope = _$rootScope_.$new();
    
    $element = angular.element(
      '<tree-mendous nodes="foos">' +
        '<div ng-repeat="node in nodes | filter:filters">' +
          '{{node.name}}' +
          '<tree-branch nodes="node.children"></tree-branch>' +
        '</div>' +
      '</tree-mendous>'
    );
    
    directive = _$compile_($element);
    directive(scope);
    
    scope.foos = [
      {name: 'a', children: [
        {name: 'b'},
        {name: 'c'},
        {name: 'd'}
      ]},
      {name: 'e'}
    ];
    scope.filters = {};
    scope.$digest();
  }));

  it('should transclude the contents of treeMendous, using TreeMendousCtrl ' +
  'to set up a watch to mirror changes into a new scope', function() {
    
    expect($element.find('tree-branch').eq(0).find('div')).to.have.length(3);
    expect(
      $element.find('tree-branch').eq(0).find('div').eq(0).text()
    ).to.equal('b');

    scope.foos[0].children.push({name: 'f'});
    scope.$digest();

    expect($element.find('tree-branch').eq(0).find('div')).to.have.length(4);
  });
});
