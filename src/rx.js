import * as t from 'babel-types'

//const subjectLiteral = 'Subject'
//const subjectLiteral = 'ReplaySubject'
//const subjectArguments = [t.identifier('1')]
//const subjectArguments = []
//const subjectIdentifier = t.identifier(subjectLiteral)

export const getSubjectLiteral = (options) => {
  return (options && options.replay) ? 'ReplaySubject' : 'Subject'
}

export const getSubjectArguments = (options) => {
  return (options && options.replay) ? [t.identifier('1')] : []
}

export const addImports = (node, scope, options) => {
  const subjectLiteral = getSubjectLiteral(options)
  const subjectIdentifier = t.identifier(subjectLiteral)
  if (!scope.hasBinding(subjectLiteral)){
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

export const makeProxy = (name, source, options) => {
  let identifier = t.identifier(name)
  const subjectLiteral = getSubjectLiteral(options)
  const subjectIdentifier = t.identifier(subjectLiteral)
  const subjectArguments = getSubjectArguments(options)
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