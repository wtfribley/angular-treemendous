describe('factory: treemendousParser', function() {
  var scope;
  var treemendousParser;

  beforeEach(module('treemendous'));
  
  beforeEach(inject(function(_$rootScope_, _treemendousParser_) {
    scope = _$rootScope_.$new();
    treemendousParser = _treemendousParser_;

    scope.nodes = [
      {title: 'A', type: 'type1', children: [
        {title: 'Aa', type: 'type2', children: [{title: 'Aaa'}]},
        {title: 'Ab', type: 'type2'}
      ]},
      {title: 'B', type: 'type1', children: [
        {title: 'Ba', type: 'type2', children: [{title: 'Baa'}]},
        {title: 'Bb', type: 'type3'}
      ]}
    ];
  }));

  describe('_nodes_', function() {
    var result;
    var groupBy;

    beforeEach(function() {
      result = treemendousParser.parse(
        'nodes | filter:$filter | orderBy:"title":true'
      );
      groupBy = result.groupBy;
    });

    it('should filter and sort _nodes_', function() {
      var nodes = result.nodeMapper(scope, {$filter: {title: 'a'}});
      expect(nodes).to.have.length(1);
      expect(nodes[0].title).to.equal('A');

      nodes = result.nodeMapper(scope, {$filter: {}});
      expect(nodes).to.have.length(2);
      expect(nodes[0].title).to.equal('B');
    });

    it('should set "groupBy" to false', function() {
      expect(result.groupBy).to.equal(false);
    });
  });

  describe('_nodes_ group by _property_',
  function() {
    var result;
    var groupBy;

    beforeEach(function() {
      result = treemendousParser.parse(
        'nodes | filter:$filter | orderBy:"title":true group by type'
      );
      groupBy = result.groupBy;
    });

    it('should match the group by _property_', function() {
      expect(groupBy).to.equal('type');
    });

    it('should filter and sort _nodes_', function() {
      var nodes = result.nodeMapper(scope, {$filter: {title: 'a'}});
      expect(nodes).to.have.length(1);
      expect(nodes[0].title).to.equal('A');

      nodes = result.nodeMapper(scope, {$filter: {}});
      expect(nodes).to.have.length(2);
      expect(nodes[0].title).to.equal('B');
    });
  });
});
