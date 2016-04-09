'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeProxy = exports.addImports = undefined;

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var subjectLiteral = 'subject';
var subjectIdentifier = t.identifier(subjectLiteral);

var addImports = exports.addImports = function addImports(node, scope) {
  if (!scope.hasBinding('subject')) {
    var subjectImportDeclaration = t.importDeclaration([t.importSpecifier(t.identifier('subject'), t.identifier('subject'))], t.stringLiteral('most-subject'));
    node.body.unshift(subjectImportDeclaration);
  }
};

var addChainCall = function addChainCall(identifier, methodName, argIdentifier, propertyName) {
  return t.callExpression(t.memberExpression(identifier, t.identifier(methodName)), [t.memberExpression(argIdentifier, t.identifier(propertyName))]);
};

var makeProxy = exports.makeProxy = function makeProxy(name, source) {
  var streamIdentifier = t.identifier(name + '_Stream');
  var observerIdentifier = t.identifier(name + '_Observer');
  var declareIdentifier = t.objectPattern([t.ObjectProperty(streamIdentifier, streamIdentifier, false, true), t.ObjectProperty(observerIdentifier, observerIdentifier, false, true)]);

  var callExpression = t.callExpression(subjectIdentifier, []);
  var declaration = t.variableDeclaration('const', [t.variableDeclarator(declareIdentifier, callExpression)]);

  var originIdentifier = t.identifier(source);

  var subscriberIdentifier = t.identifier(name + '.asObserver()');
  var subCallExpression = addChainCall(addChainCall(addChainCall(originIdentifier, 'observe', observerIdentifier, 'next'), 'then', observerIdentifier, 'complete'), 'catch', observerIdentifier, 'error');

  var subIdentifier = t.identifier(name + '_Sub');
  var subscription = t.variableDeclaration('const', [t.variableDeclarator(subIdentifier, subCallExpression)]);

  var replaceWith = streamIdentifier;

  return {
    declaration: declaration,
    subscription: subscription,
    replaceWith: replaceWith
  };
};