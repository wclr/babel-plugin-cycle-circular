import * as t from 'babel-types'

let subjectLiteral = 'subject'
let subjectIdentifier = t.identifier(subjectLiteral)

export const addImports = (node, scope) => {
  if (!scope.hasBinding('subject')){
    const subjectImportDeclaration = t.importDeclaration([
      t.importSpecifier(t.identifier('subject'), t.identifier('subject'))
    ], t.stringLiteral('most-subject'));
    node.body.unshift(subjectImportDeclaration);
  }
}

const addChainCall = (identifier, methodName, argIdentifier, propertyName) => {
  return t.callExpression(
    t.memberExpression(identifier, t.identifier(methodName)),
    [t.memberExpression(argIdentifier, t.identifier(propertyName))]
  )
}

export const makeProxy = (name, source) => {
  let streamIdentifier = t.identifier(name + '_Stream')
  let observerIdentifier = t.identifier(name + '_Observer')
  let declareIdentifier = t.objectPattern([
    t.ObjectProperty(streamIdentifier, streamIdentifier, false, true),
    t.ObjectProperty(observerIdentifier, observerIdentifier, false, true)
  ])

  let callExpression = t.callExpression(subjectIdentifier, [])
  let declaration = t.variableDeclaration('const', [
    t.variableDeclarator(declareIdentifier, callExpression)
  ])

  let originIdentifier = t.identifier(source)

  let subscriberIdentifier = t.identifier(name + '.asObserver()')
  let subCallExpression =
    addChainCall(
      addChainCall(
        addChainCall(
          originIdentifier, 'observe', observerIdentifier, 'next'),
        'then', observerIdentifier, 'complete'),
      'catch', observerIdentifier, 'error')

  let subIdentifier =  t.identifier(name + '_Sub')
  let subscription = t.variableDeclaration('const', [
    t.variableDeclarator(subIdentifier, subCallExpression)
  ])

  let replaceWith = streamIdentifier

  return {
    declaration,
    subscription,
    replaceWith
  }
}