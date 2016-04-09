import * as t from 'babel-types'
import {makeProxy, subjectIdentifier} from './rx'

export const addImports = (node, scope) => {
  if (!scope.hasBinding('Subject')){
    const subjectImportDeclaration = t.importDeclaration([
      t.importSpecifier(subjectIdentifier, subjectIdentifier)
    ], t.stringLiteral('rxjs'));
    node.body.unshift(subjectImportDeclaration);
  }
}

export {makeProxy}
