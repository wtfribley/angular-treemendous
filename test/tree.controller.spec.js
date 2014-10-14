describe('controller: TreeMendousCtrl', function() {
  var $rootScope;

  beforeEach(module('treemendous'));

  describe('TreeMendousCtrl#watchNodes(scope, parentScope, watchExp)',
  function() {
    var ctrl;
    var parentScope;
    var scope;

    beforeEach(inject(function(_$controller_, _$rootScope_) {
      ctrl = _$controller_('TreeMendousCtrl');
      $rootScope = _$rootScope_;

      parentScope = $rootScope.$new();
      scope = parentScope.$new();
    }));
    
    it('should accept a string watchExp, mirroring changes from parentScope ' +
    'to `scope.nodes`', function() {
      delete scope.nodes;
      
      ctrl.watchNodes(scope, parentScope, 'nodes');
      parentScope.nodes = [1,2,3,4,5];
      parentScope.$digest();
      expect(scope.nodes).to.have.length(5);
      
      parentScope.nodes.push(6);
      parentScope.$digest();
      expect(scope.nodes).to.have.length(6);
    });

    it('should accept an Array watchExp, mirroring changes from parentScope ' +
    'to `scope.nodes`', function() {
      var watchArray = [1,2,3,4,5];
      delete scope.nodes;
      
      ctrl.watchNodes(scope, parentScope, watchArray);
      parentScope.nodes = watchArray;
      parentScope.$digest();
      expect(scope.nodes).to.have.length(5);
      
      parentScope.nodes.push(6);
      parentScope.$digest();
      expect(scope.nodes).to.have.length(6);
    });

    it('should accept a function watchExp, mirroring changes from parentScope' +
    ' to `scope.nodes`', function() {
      var watchFunction = function() { return parentScope.nodes; };
      delete scope.nodes;
      
      ctrl.watchNodes(scope, parentScope, watchFunction);
      parentScope.nodes = [1,2,3,4,5];
      parentScope.$digest();
      expect(scope.nodes).to.have.length(5);
      
      parentScope.nodes.push(6);
      parentScope.$digest();
      expect(scope.nodes).to.have.length(6);
    });

    it('should throw if given a watchExp of the wrong type', function() {
      expect(
        ctrl.watchNodes.bind(ctrl, scope, parentScope, {})
      ).to.throw(/Expected watchExp to be a function, string or array/);
    });

    it('should create groupings, setting them as `scope.nodes` when ' +
    '`groupBy` has been set previously via TreeMendousCtrl#setParserResult',
    function() {
      ctrl.setParserResult({groupBy: 'type', children: 'children'});
      delete scope.nodes;

      ctrl.watchNodes(scope, parentScope, 'nodes');
      parentScope.nodes = [
        {name: 'a', type: 'foo'},
        {name: 'b', type: 'foo'},
        {name: 'c', type: 'foo'},
        {name: 'd', type: 'bar'}
      ];
      parentScope.$digest();

      expect(scope.nodes).to.have.length(2);
      expect(scope.nodes[0].type).to.exist;
      expect(scope.nodes[1].type).to.exist;
    });

    it('should use the "as _children_" clause to create groups', function() {
      ctrl.setParserResult({groupBy: 'type', children: 'foos'});
      delete scope.nodes;

      ctrl.watchNodes(scope, parentScope, 'nodes');
      parentScope.nodes = [
        {name: 'a', type: 'foo'},
        {name: 'b', type: 'foo'},
        {name: 'c', type: 'foo'},
        {name: 'd', type: 'bar'}
      ];
      parentScope.$digest();

      expect(scope.nodes).to.have.length(2);
      expect(scope.nodes[0].foos).to.exist;
      expect(scope.nodes[0].foos).to.have.length(3);
    });

    it('should alternate between groupings and actual nodes when using ' +
    '`group by` (i.e. `scope.$intermediate = true` when nodes are given and ' +
    'groupings are created, `scope.$intermediate = false` when groupings are ' +
    'given and the actual nodes are used', function() {
      ctrl.setParserResult({groupBy: 'type', children: 'children'});
      delete scope.nodes;

      ctrl.watchNodes(scope, parentScope, 'nodes');
      parentScope.nodes = [
        {name: 'a', type: 'foo'},
        {name: 'b', type: 'foo'},
        {name: 'c', type: 'foo'},
        {name: 'd', type: 'bar'}
      ];
      parentScope.$digest();

      expect(scope.$intermediate).to.be.true;
      expect(scope.nodes).to.have.length(2);

      var childScope = scope.$new();

      ctrl.watchNodes(childScope, scope, 'nodes[0].children');
      scope.$digest();

      expect(childScope.$intermediate).to.be.false;
      expect(childScope.nodes).to.have.length(3);
    });
  });

  describe('TreeMendousCtrl#select(scope)', function() {
    var ctrl;
    var $elements = [];

    beforeEach(inject(function(_$controller_, _$rootScope_) {
      ctrl = _$controller_('TreeMendousCtrl');
      $elements = [];
      for (i = 0; i < 5; i++) $elements.push(angular.element('<div>'));
    }));

    describe('TreeMendousCtrl#selectElements', function() {
      it('should be an array', function() {
        expect(Array.isArray(ctrl.selectElements)).to.be.true;
      });
    });

    describe('selectMode == "none"', function() {
      it('should do nothing', function() {
        ctrl.selectMode = 'none';
        ctrl.selectElements = $elements;
        
        ctrl.select($elements[0]);
        expect($elements[0].hasClass('selected')).to.be.false;
      });
    });

    describe('selectMode == "single", selectMode == "active"', function() {
      it('should select only one scope at a time', function() {
        ctrl.selectMode = 'single';
        ctrl.selectElements = $elements;

        ctrl.select($elements[0]);
        expect($elements[0].hasClass('selected')).to.be.true;
        expect($elements[0].hasClass('active')).to.be.false;

        ctrl.select($elements[1]);
        expect($elements[0].hasClass('selected')).to.be.false;
        expect($elements[1].hasClass('selected')).to.be.true;
      });

      it('should mark any number of scopes as active', function() {
        ctrl.selectMode = 'active';
        ctrl.selectElements = $elements;

        ctrl.select($elements[0]);
        expect($elements[0].hasClass('selected')).to.be.true;
        expect($elements[0].hasClass('active')).to.be.true;

        ctrl.select($elements[1]);
        expect($elements[0].hasClass('selected')).to.be.false;
        expect($elements[0].hasClass('active')).to.be.true;
        expect($elements[1].hasClass('selected')).to.be.true;
        expect($elements[1].hasClass('active')).to.be.true;
      });
    });

    describe('selectMode == "multi"', function() {
      it('should allow any number of scopes to be selected', function() {
        ctrl.selectMode = 'multi';
        ctrl.selectElements = $elements;

        ctrl.select($elements[0]);
        expect($elements[0].hasClass('selected')).to.be.true;
        expect($elements[0].hasClass('active')).to.be.false;

        ctrl.select($elements[1]);
        expect($elements[0].hasClass('selected')).to.be.true;
        expect($elements[1].hasClass('selected')).to.be.true;
      });
    });
  });

  describe('TreeMendousCtrl#registerSelectElement', function() {
    var ctrl;
    var $elements = [];

    beforeEach(inject(function(_$controller_, _$rootScope_) {
      ctrl = _$controller_('TreeMendousCtrl');
      $elements = [];
      for (i = 0; i < 5; i++) $elements.push(angular.element('<div>'));
    }));

    it('should add the given element to selectElements', function() {
      expect(ctrl.selectElements).to.have.length(0);
      ctrl.registerSelectElement($elements[0]);
      expect(ctrl.selectElements).to.have.length(1);
    });

    it('should return a deregistration function', function() {
      var deregister = ctrl.registerSelectElement($elements[0]);
      expect(ctrl.selectElements).to.have.length(1);

      deregister();
      expect(ctrl.selectElements).to.have.length(0);
    });
  });
});
