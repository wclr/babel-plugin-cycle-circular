'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeProxy = exports.addImports = undefined;

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

var _rx = require('./rx');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var addImports = exports.addImports = function addImports(node, scope) {
  if (!scope.hasBinding('Subject')) {
    var subjectImportDeclaration = t.importDeclaration([t.importSpecifier(_rx.subjectIdentifier, _rx.subjectIdentifier)], t.stringLiteral('rxjs'));
    node.body.unshift(subjectImportDeclaration);
  }
};

exports.makeProxy = _rx.makeProxy;