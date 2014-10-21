describe('controller: TreeMendousCtrl', function() {
  var ctrl;
  var elements = [];
  var scopes = [];

  beforeEach(module('treemendous'));

  beforeEach(inject(function(_$controller_, _$rootScope_) {
    ctrl = _$controller_('TreeMendousCtrl');
    elements = [];
    scopes = [];

    var scope;

    for (var i = 0; i < 4; i++) {
      elements.push(angular.element('<div>'));
      scope = _$rootScope_.$new();
      scope.$selected = false;
      scope.$active = false;
      scopes.push(scope);
    }
  }));

  // Selection of Elements by Adding a "selected" Class

  it('should expose public method **TreeMendousCtrl#registerSelectElement**',
  function() {
    expect(ctrl.registerSelect).to.be.a('function');
  });

  it('should expose public method **TreeMendousCtrl#select**',
  function() {
    expect(ctrl.select).to.be.a('function');
  });

  it('should expose public method **TreeMendousCtrl#deselect**',
  function() {
    expect(ctrl.deselect).to.be.a('function');
  });

  it('should expose public string property **TreeMendousCtrl#selectMode** -- ' +
  'defaults to "none"', function() {
    expect(ctrl.selectMode).to.equal('none');
  });

  describe('method: TreeMendousCtrl#select', function() {

    it('should only allow selection of registered elements', function() {
      ctrl.selectMode = 'single';

      expect(elements[0].hasClass('selected')).to.be.false;
      ctrl.select(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.false;
      expect(scopes[0].$selected).to.be.false;
      
      ctrl.registerSelect(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.false;
      
      ctrl.select(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.true;
      expect(scopes[0].$selected).to.be.true;
  
    });

    it('should select no elements when selectMode is "none"', function() {
      ctrl.selectMode = 'none';
      
      ctrl.registerSelect(elements[0], scopes[0]);
      ctrl.select(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.false;
      expect(scopes[0].$selected).to.be.false;
    });

    it('should select only one element at a time when selectMode is "single"',
    function() {
      ctrl.selectMode = 'single';
      
      ctrl.registerSelect(elements[0], scopes[0]);
      ctrl.registerSelect(elements[1], scopes[1]);

      ctrl.select(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.true;
      expect(scopes[0].$selected).to.be.true;
      expect(elements[1].hasClass('selected')).to.be.false;
      expect(scopes[1].$selected).to.be.false;
      
      ctrl.select(elements[1], scopes[1]);
      expect(elements[0].hasClass('selected')).to.be.false;
      expect(scopes[0].$selected).to.be.false;
      expect(elements[1].hasClass('selected')).to.be.true;
      expect(scopes[1].$selected).to.be.true;
    });

    it('should select only one element at a time when selectMode is ' +
    '"active", but should allow multiple active elements', function() {
      ctrl.selectMode = 'active';

      ctrl.registerSelect(elements[0], scopes[0]);
      ctrl.registerSelect(elements[1], scopes[1]);

      ctrl.select(elements[0], scopes[0]);
      
      expect(elements[0].hasClass('selected')).to.be.true;
      expect(scopes[0].$selected).to.be.true;
      expect(elements[0].hasClass('active')).to.be.true;
      expect(scopes[0].$active).to.be.true;
      
      expect(elements[1].hasClass('selected')).to.be.false;
      expect(scopes[1].$selected).to.be.false;
      expect(elements[1].hasClass('active')).to.be.false;
      expect(scopes[1].$active).to.be.false;

      ctrl.select(elements[1], scopes[1]);
      
      expect(elements[0].hasClass('selected')).to.be.false;
      expect(scopes[0].$selected).to.be.false;
      expect(elements[0].hasClass('active')).to.be.true;
      expect(scopes[0].$active).to.be.true;
      
      expect(elements[1].hasClass('selected')).to.be.true;
      expect(scopes[1].$selected).to.be.true;
      expect(elements[1].hasClass('active')).to.be.true;
      expect(scopes[1].$active).to.be.true;

    });

    it('should allow multiple elements to be selected at a time when ' +
    'selectMode is "multi"', function() {
      ctrl.selectMode = 'multi';
      
      ctrl.registerSelect(elements[0], scopes[0]);
      ctrl.registerSelect(elements[1], scopes[1]);

      ctrl.select(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.true;
      expect(scopes[0].$selected).to.be.true;
      expect(elements[1].hasClass('selected')).to.be.false;
      expect(scopes[1].$selected).to.be.false;
      
      ctrl.select(elements[1], scopes[1]);
      expect(elements[0].hasClass('selected')).to.be.true;
      expect(scopes[0].$selected).to.be.true;
      expect(elements[1].hasClass('selected')).to.be.true;
      expect(scopes[1].$selected).to.be.true;
    });
  });

  describe('method: TreeMendousCtrl#deselect', function() {
    it('should deselect a registered element', function() {
      ctrl.selectMode = 'single';
      
      ctrl.registerSelect(elements[0], scopes[0]);

      ctrl.select(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.true;
      expect(scopes[0].$selected).to.be.true;
      
      ctrl.deselect(elements[0], scopes[0]);
      expect(elements[0].hasClass('selected')).to.be.false;
      expect(scopes[0].$selected).to.be.false;
    });
  });

  describe('method: registerSelectElement', function() {
    it('should return a function that deregisters the element', function() {
      ctrl.selectMode = 'multi';

      var deregisterZero = ctrl.registerSelect(elements[0], scopes[0]);
      var deregisterOne = ctrl.registerSelect(elements[1], scopes[1]);
      var deregisterTwo = ctrl.registerSelect(elements[2], scopes[2]);
      
      deregisterOne();

      ctrl.select(elements[1], scopes[1]);
      expect(elements[0].hasClass('selected')).to.be.false;
      expect(scopes[0].$selected).to.be.false;
      expect(elements[1].hasClass('selected')).to.be.false;
      expect(scopes[1].$selected).to.be.false;
      expect(elements[2].hasClass('selected')).to.be.false;
      expect(scopes[2].$selected).to.be.false;

      // a second call is a noop.
      deregisterOne();

      ctrl.select(elements[0], scopes[0]);
      ctrl.select(elements[1], scopes[1]);
      ctrl.select(elements[2], scopes[2]);
      expect(elements[0].hasClass('selected')).to.be.true;
      expect(scopes[0].$selected).to.be.true;
      expect(elements[1].hasClass('selected')).to.be.false;
      expect(scopes[1].$selected).to.be.false;
      expect(elements[2].hasClass('selected')).to.be.true;
      expect(scopes[2].$selected).to.be.true;
    });
  });

  // Watching / Grouping

  it('should expose public property **TreeMendousCtrl#expression**',
  function() {
    expect(ctrl.expression).to.equal('');
  });

  it('should expose public property **TreeMendousCtrl#transclude**',
  function() {
    expect(ctrl.transclude).to.equal(null);
  });

  it('should expose public mathod **TreeMendousCtrl#watch**', function() {
    expect(ctrl.watch).to.be.a('function');
  });

  describe('method: watch', function() {
    
    it('should mirror _nodes_ from `scope` to `branch`', function() {
      var scope = scopes[0];
      var branch = scopes[1];

      ctrl.expression = 'nodes';
      branch.nodes = [];
      scope.nodes = ['a','b','c','d'];

      expect(branch.nodes).to.have.length(0);
      
      ctrl.watch(branch, scope);
      scope.$digest();
      expect(branch.nodes).to.have.length(4);

      scope.nodes.push('e');
      expect(branch.nodes).to.have.length(5);
      expect(branch.nodes[4]).to.equal('e');

      branch.nodes.splice(2, 1);
      expect(scope.nodes).to.have.length(4);
      scope.nodes.forEach(function(node) {
        expect(node).to.not.equal('c');
      });
    });

    it('should generate groups', function() {
      var scope = scopes[0];
      var branch = scopes[1];

      ctrl.expression = 'nodes group by type as foos';
      branch.nodes = [];
      scope.nodes = [
        {name: 'a', type: 'A'},
        {name: 'b', type: 'A'},
        {name: 'c', type: 'A'},
        {name: 'd', type: 'B'}
      ];

      ctrl.watch(branch, scope);
      scope.$digest();

      expect(branch.$intermediate).to.be.true;
      expect(branch.nodes).to.have.length(2);
      
      expect(branch.nodes[0].type).to.equal('A');
      expect(branch.nodes[0].foos).to.have.length(3);
    });

    it('should mirror _nodes_ when using groups', function() {
      var scope = scopes[0];
      scope.nodes = [
        {name: 'a', type: 'A'},
        {name: 'b', type: 'A'},
        {name: 'c', type: 'A'},
        {name: 'd', type: 'B'}
      ];
      
      ctrl.expression = 'nodes group by type as foos';

      var branch = scope.$new();
      branch.nodes = [];

      ctrl.watch(branch, scope, 'nodes');
      scope.$digest();

      expect(scope.nodes).to.not.equal(branch.nodes);

      branch.$intermediate = false;
      branch.nodes.splice(1, 1);
      branch.$digest();

      expect(scope.nodes).to.equal(branch.nodes);
    });
  });
});

