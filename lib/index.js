'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var t = _ref.types;

  var makeVisitor = function makeVisitor(scope, options, lib) {

    var matchIdentifiers = toArray(options.identifiers).map(function (match) {
      return new RegExp(match);
    });

    var mainScope = scope;

    var matchIdentifierName = function matchIdentifierName(name) {
      if (matchIdentifiers.length) {
        return matchIdentifiers.reduce(function (matched, match) {
          return matched || match.test(name);
        }, false);
      }
      return true;
    };

    return {
      ReferencedIdentifier: function ReferencedIdentifier(path) {
        if (!checkScopeIsFunction(path.scope)) return;
        var _circular = getScopeCircular(path.scope);

        var name = '__' + path.node.name;

        if (_circular.declarations[name]) {
          return;
        }
        _circular.identifiers[name] = _circular.identifiers[name] || { paths: [] };
        _circular.identifiers[name].paths.push(path);
      },
      VariableDeclaration: function VariableDeclaration(path) {
        if (!checkScopeIsFunction(path.scope)) return;

        var _circular = getScopeCircular(path.scope);
        var body = path.scope.block.body.body;

        path.node.declarations.forEach(function (dec) {
          var identifier = _circular.identifiers['__' + dec.id.name];
          if (identifier) {
            identifier.paths.forEach(function (path) {
              var identifierPath = getIdentifierFromPath(path);
              var identifierSource = identifierPath.getSource();
              if (!matchIdentifierName(identifierSource)) {
                return;
              }
              var proxyName = '__Proxy' + _circular.proxiesCount;
              var proxy = lib.makeProxy(proxyName, identifierSource, options);

              body.unshift(proxy.declaration);
              identifierPath.replaceWith(proxy.replaceWith);

              var ret = body[body.length - 1].type == 'ReturnStatement' ? body.pop() : null;
              body.push(proxy.subscription);
              ret && body.push(ret);

              _circular.proxiesCount++;
              mainScope._hasCircularProxies = true;
            });
          }
          _circular.declarations[dec.id.name] = true;
        });
      }
    };
  };

  return {
    visitor: {
      Program: function Program(path, state) {
        var scope = path.context.scope;
        var options = this.opts;
        var filename = this.file.opts.filename;

        var filterFiles = options.include || options.exclude;
        if (filterFiles) {
          var match = checkMinimatch(filterFiles, filename);
          match = options.include ? !match && !checkMinimatch(options.exclude, filename) : match;
          if (match) {
            return;
          }
        }

        var lib = void 0,
            libName = options.lib || 'rx';
        lib = require('./' + libName);

        path.traverse(makeVisitor(scope, options, lib));

        if (scope._hasCircularProxies) {
          lib.addImports(path.node, scope, options);
        }
      }
    }
  };
};

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getIdentifierFromPath = function getIdentifierFromPath(path) {
  var type = path.parentPath.type;
  return type == 'MemberExpression' || type == 'CallExpression' ? getIdentifierFromPath(path.parentPath) : path;
};

var toArray = function toArray(thing) {
  return thing && !Array.isArray(thing) ? [thing] : thing || [];
};

var checkItems = function checkItems(items, checkFn) {
  return items.reduce(function (checked, item) {
    return checked || checkFn(item);
  }, false);
};

var checkMinimatch = function checkMinimatch(masks, filename) {
  return checkItems(toArray(masks), function (mask) {
    return (0, _minimatch2.default)(filename, mask);
  });
};

var checkScopeIsFunction = function checkScopeIsFunction(scope) {
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
    proxies: {},
    proxiesCount: 0
  };
  return scope._cycleCircular;
};