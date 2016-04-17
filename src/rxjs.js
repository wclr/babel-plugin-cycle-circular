import * as t from 'babel-types'
import {makeProxy, getSubjectLiteral} from './rx'

export const addImports = (node, scope, options) => {
  const subjectLiteral = getSubjectLiteral(options)
  const subjectIdentifier = t.identifier(subjectLiteral)
  if (!scope.hasBinding(subjectLiteral)){
    const subjectImportDeclaration = t.importDeclaration([
      t.importSpecifier(subjectIdentifier, subjectIdentifier)
    ], t.stringLiteral('rxjs'));
    node.body.unshift(subjectImportDeclaration);
  }
}

export {makeProxy}
