'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref2) {
  var t = _ref2.types;

  var makeVisitor = function makeVisitor(scope, options) {
    var subjectLiteral = getSubjectLiteral(scope, options);
    var subjectIdentifier = t.identifier(subjectLiteral);

    var matchIdentifiers = toArray(options.identifiers).map(function (match) {
      return new RegExp(match);
    });

    var matchIdentifierName = function matchIdentifierName(name) {
      if (matchIdentifiers.length) {
        return matchIdentifiers.reduce(function (matched, match) {
          return matched || match.test(name);
        }, false);
      }
      return true;
    };

    var getSubFinallyExpression = function getSubFinallyExpression(proxyIdentifier, subIdentifier) {
      var disposeExpression = t.callExpression(t.memberExpression(subIdentifier, t.identifier('dispose')), []);
      return t.callExpression(t.memberExpression(proxyIdentifier, t.identifier('finally')), [t.arrowFunctionExpression([], disposeExpression)]);
    };

    var makeProxy = function makeProxy(toProxy) {
      var idName = toProxy.name + '__Proxy';
      var identifier = t.identifier(idName);

      var newExpression = t.newExpression(subjectIdentifier, []);
      var declaration = t.variableDeclaration('const', [t.variableDeclarator(identifier, newExpression)]);

      var originIdentifier = t.identifier(toProxy.source + '.subscribe');
      var subscriberIdentifier = t.identifier(idName + '.asObserver()');
      var subCallExpression = t.callExpression(originIdentifier, [subscriberIdentifier]);
      var subIdentifier = t.identifier(toProxy.name + '__ProxySub');
      var subscription = t.variableDeclaration('const', [t.variableDeclarator(subIdentifier, subCallExpression)]);

      return {
        identifier: identifier,
        declaration: declaration, subscription: subscription,
        finally: getSubFinallyExpression(identifier, subIdentifier)
      };
    };

    return {
      ReferencedIdentifier: function ReferencedIdentifier(path) {
        if (!checkScope(path.scope)) return;

        var _circular = getScopeCircular(path.scope);

        var name = path.node.name;

        if (_circular.declarations[name]) {
          return;
        }
        _circular.identifiers[name] = _circular.identifiers[name] || { paths: [] };
        _circular.identifiers[name].paths.push(path);
      },
      VariableDeclaration: function VariableDeclaration(path) {
        if (!checkScope(path.scope)) return;

        var _circular = getScopeCircular(path.scope);
        var body = path.scope.block.body.body;
        path.node.declarations.forEach(function (dec) {
          var identifier = _circular.identifiers[dec.id.name];
          if (identifier) {
            identifier.paths.forEach(function (path) {
              var identifierToProxy = getIdentifierFromPath(path);

              var proxyName = identifierToProxy.name;

              if (!matchIdentifierName(proxyName)) {
                return;
              }

              var proxyIndex = _circular.proxies[proxyName] || 0;
              identifierToProxy.name += '_' + proxyIndex;

              var proxy = makeProxy(identifierToProxy);

              body.unshift(proxy.declaration);
              identifierToProxy.path.replaceWith(proxy.finally);

              var ret = body[body.length - 1].type == 'ReturnStatement' ? body.pop() : null;
              body.push(proxy.subscription);
              ret && body.push(ret);

              _circular.proxies[proxyName] = proxyIndex + 1;
            });
          }
          _circular.declarations[dec.id.name] = true;
        });
      }
    };
  };

  return {
    visitor: {
      Program: function Program(path) {
        var scope = path.context.scope;
        var options = this.opts;
        var filename = this.file.opts.filename;

        var filterFiles = options.include || options.exclude;
        if (filterFiles) {
          var match = checkItems(toArray(filterFiles), function (mask) {
            return (0, _minimatch2.default)(filename, mask);
          });
          if (options.include ? !match : match) {
            return;
          }
        }

        if (canMakeCircular(scope, options)) {
          path.traverse(makeVisitor(scope, options));
        }
      }
    }
  };
};

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getIdentifierNameFromNode = function getIdentifierNameFromNode(node) {
  if (node.name || node.value) {
    return node.name || 'V' + node.value;
  } else {
    return getIdentifierNameFromNode(node.object) + '_' + getIdentifierNameFromNode(node.property);
  }
};

var toArray = function toArray(thing) {
  return thing && !Array.isArray(thing) ? [thing] : thing || [];
};

var checkItems = function checkItems(items, checkFn) {
  return items.reduce(function (checked, item) {
    return checked || checkFn(item);
  }, false);
};

var getIdentifierFromPath = function getIdentifierFromPath(path) {
  // path.parentPath.node.type === 'Identifier'
  while (path.parentPath.type == 'MemberExpression') {
    path = path.parentPath;
  }
  var node = path.node;
  return {
    source: path.getSource(),
    name: getIdentifierNameFromNode(node),
    path: path
  };
};

var checkScope = function checkScope(scope) {
  // FunctionDeclaration
  // ArrowFunctionExpression
  return (/Function/.test(scope.block.type)
  );
};

var getScopeCircular = function getScopeCircular(scope) {
  if (scope._cycleCircular) {
    return scope._cycleCircular;
  }
  scope._cycleCircular = {
    identifiers: {},
    declarations: {},
    proxies: {}
  };
  return scope._cycleCircular;
};

var getSubjectLiteral = function getSubjectLiteral(_ref, options) {
  var globals = _ref.globals;
  var references = _ref.references;

  if (references.Subject) {
    return 'Subject';
  } else {
    var rxRef = checkItems([options.rxRef, 'Rx', 'rx'], function (prop) {
      return (references[prop] || globals[prop]) && prop;
    });
    if (rxRef) {
      return rxRef + '.Subject';
    }
  }
};

var canMakeCircular = function canMakeCircular(scope, options) {
  return getSubjectLiteral(scope, options);
};