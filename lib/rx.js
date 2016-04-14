'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeProxy = exports.addImports = exports.subjectIdentifier = undefined;

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//const subjectLiteral = 'Subject'
var subjectLiteral = 'ReplaySubject';
var subjectArguments = [t.identifier('1')];
var subjectIdentifier = exports.subjectIdentifier = t.identifier(subjectLiteral);

var addImports = exports.addImports = function addImports(node, scope) {
  if (!scope.hasBinding('Subject')) {
    var subjectImportDeclaration = t.importDeclaration([t.importSpecifier(subjectIdentifier, subjectIdentifier)], t.stringLiteral('rx'));
    node.body.unshift(subjectImportDeclaration);
  }
};
var getSubFinallyExpression = function getSubFinallyExpression(proxyIdentifier, subIdentifier) {
  var disposeExpression = t.callExpression(t.memberExpression(subIdentifier, t.identifier('dispose')), []);
  var observersCount = t.memberExpression(proxyIdentifier, t.identifier('observers.length'));
  var condition = t.ifStatement(t.binaryExpression("===", observersCount, t.identifier('0')), t.expressionStatement(disposeExpression));
  return t.callExpression(t.memberExpression(proxyIdentifier, t.identifier('finally')), [t.arrowFunctionExpression([], t.blockStatement([condition]))]);
};

var makeProxy = exports.makeProxy = function makeProxy(name, source) {
  var identifier = t.identifier(name);

  var newExpression = t.newExpression(subjectIdentifier, subjectArguments);
  var declaration = t.variableDeclaration('const', [t.variableDeclarator(identifier, newExpression)]);

  var originIdentifier = t.identifier(source + '.subscribe');
  //let subscriberIdentifier = t.identifier(name + '.asObserver()')
  var subscriberIdentifier = identifier;
  var subCallExpression = t.callExpression(originIdentifier, [subscriberIdentifier]);
  var subIdentifier = t.identifier(name + '_Sub');
  var subscription = t.variableDeclaration('const', [t.variableDeclarator(subIdentifier, subCallExpression)]);

  var replaceWith = getSubFinallyExpression(identifier, subIdentifier);

  return {
    declaration: declaration,
    subscription: subscription,
    replaceWith: replaceWith
  };
};