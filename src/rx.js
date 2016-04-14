import * as t from 'babel-types'

//const subjectLiteral = 'Subject'
const subjectLiteral = 'ReplaySubject'
const subjectArguments = [t.identifier('1')]
export const subjectIdentifier = t.identifier(subjectLiteral)

export const addImports = (node, scope) => {
  if (!scope.hasBinding('Subject')){
    const subjectImportDeclaration = t.importDeclaration([
      t.importSpecifier(subjectIdentifier, subjectIdentifier)
    ], t.stringLiteral('rx'));
    node.body.unshift(subjectImportDeclaration);
  }
}
const getSubFinallyExpression = function(proxyIdentifier, subIdentifier){
  const disposeExpression = t.callExpression(
    t.memberExpression(subIdentifier, t.identifier('dispose')),
    []
  )
  let observersCount = t.memberExpression(proxyIdentifier, t.identifier('observers.length'));
  const condition = t.ifStatement(
    t.binaryExpression("===", observersCount, t.identifier('0')),
    t.expressionStatement(disposeExpression)
  )
  return t.callExpression(
    t.memberExpression(proxyIdentifier, t.identifier('finally')),
    [t.arrowFunctionExpression([], t.blockStatement([condition]))]
  )
}

export const makeProxy = (name, source) => {
  let identifier = t.identifier(name)

  let newExpression = t.newExpression(subjectIdentifier, subjectArguments)
  let declaration = t.variableDeclaration('const', [
    t.variableDeclarator(identifier, newExpression)
  ])

  let originIdentifier = t.identifier(source + '.subscribe')
  //let subscriberIdentifier = t.identifier(name + '.asObserver()')
  let subscriberIdentifier = identifier
  let subCallExpression = t.callExpression(originIdentifier, [subscriberIdentifier])
  let subIdentifier =  t.identifier(name + '_Sub')
  let subscription = t.variableDeclaration('const', [
    t.variableDeclarator(subIdentifier, subCallExpression)
  ])
  
  let replaceWith = getSubFinallyExpression(identifier, subIdentifier)
  
  return {
    declaration, 
    subscription,
    replaceWith
  }
}