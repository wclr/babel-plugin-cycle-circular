import minimatch from 'minimatch'

const getIdentifierNameFromNode = (node) => {
  if (node.name || node.value){
    return node.name || ('V' + node.value)
  }
  else {
    return getIdentifierNameFromNode(node.object)
      + '_' + getIdentifierNameFromNode(node.property)
  }
}

const toArray = (thing) =>
  thing && !Array.isArray(thing) ? [thing] : (thing || [])


const checkItems = (items, checkFn) =>
  items.reduce((checked, item) => {
    return checked || checkFn(item)
  }, false)

const getIdentifierFromPath = (path) => {
  // path.parentPath.node.type === 'Identifier'
  while (path.parentPath.type == 'MemberExpression') {
    path = path.parentPath
  }
  var node = path.node
  return {
    source: path.getSource(),
    name: getIdentifierNameFromNode(node),
    path
  }
}

const checkScope = (scope) => {
  // FunctionDeclaration
  // ArrowFunctionExpression
  return /Function/.test(scope.block.type)
}

const getScopeCircular = (scope) => {
  if (scope._cycleCircular){
    return scope._cycleCircular
  }
  scope._cycleCircular = {
    identifiers: {},
    declarations: {},
    proxies: {}
  }
  return scope._cycleCircular
}

const getSubjectLiteral = ({globals, references}, options) => {
  if (references.Subject){
    return 'Subject'
  } else {
    const rxRef = checkItems([options.rxRef, 'Rx', 'rx'],
      (prop) => ((references[prop] || globals[prop]) && prop)
    )
    if (rxRef){
      return rxRef + '.Subject'
    }
  }
}

const canMakeCircular = (scope, options) => {
  return getSubjectLiteral(scope, options)
}

export default function ({types: t}) {
  const makeVisitor = (scope, options) => {
    let subjectLiteral = getSubjectLiteral(scope, options)
    let subjectIdentifier = t.identifier(subjectLiteral)

    let matchIdentifiers = toArray(options.identifiers)
      .map(match => new RegExp(match))
    
    const matchIdentifierName = (name) => {
      if (matchIdentifiers.length){
        return matchIdentifiers.reduce((matched, match) => 
          matched || match.test(name)
        , false)
      }
      return true
    }

    const getSubFinallyExpression = function(proxyIdentifier, subIdentifier){
      const disposeExpression = t.callExpression(
        t.memberExpression(subIdentifier, t.identifier('dispose')),
        []
      )
      return t.callExpression(
        t.memberExpression(proxyIdentifier, t.identifier('finally')),
        [t.arrowFunctionExpression([], disposeExpression)]
      )
    }
    
    const makeProxy = (toProxy) => {
      let idName = toProxy.name + '__Proxy'
      let identifier = t.identifier(idName)

      let newExpression = t.newExpression(subjectIdentifier, [])
      let declaration = t.variableDeclaration('const', [
        t.variableDeclarator(identifier, newExpression)
      ])
      
      let originIdentifier = t.identifier(toProxy.source + '.subscribe')
      let subscriberIdentifier = t.identifier(idName + '.asObserver()')
      let subCallExpression = t.callExpression(originIdentifier, [subscriberIdentifier])
      let subIdentifier =  t.identifier(toProxy.name + '__ProxySub')
      let subscription = t.variableDeclaration('const', [
        t.variableDeclarator(subIdentifier, subCallExpression)
      ])

      return {
        identifier,
        declaration, subscription,
        finally: getSubFinallyExpression(identifier, subIdentifier)
      }
    }

    return {
      ReferencedIdentifier (path) {
        if (!checkScope(path.scope)) return

        let _circular = getScopeCircular(path.scope)

        let name = path.node.name

        if (_circular.declarations[name]){
          return
        }
        _circular.identifiers[name] = _circular.identifiers[name] || {paths: []}
        _circular.identifiers[name].paths.push(path)
      },

      VariableDeclaration (path) {
        if (!checkScope(path.scope)) return

        let _circular = getScopeCircular(path.scope)
        var body = path.scope.block.body.body
        path.node.declarations.forEach(dec => {
          let identifier = _circular.identifiers[dec.id.name]
          if (identifier){
            identifier.paths.forEach((path) => {
              var identifierToProxy = getIdentifierFromPath(path)

              let proxyName = identifierToProxy.name

              if (!matchIdentifierName(proxyName)){
                return
              }

              let proxyIndex =
                (_circular.proxies[proxyName] || 0)
              identifierToProxy.name += '_' + proxyIndex

              let proxy = makeProxy(identifierToProxy)

              body.unshift(proxy.declaration)
              identifierToProxy.path.replaceWith(proxy.finally)

              let ret = body[body.length - 1].type == 'ReturnStatement'
                ? body.pop() : null
              body.push(proxy.subscription)
              ret && body.push(ret)

              _circular.proxies[proxyName] = proxyIndex + 1
            })
          }
          _circular.declarations[dec.id.name] = true
        })
      }
    }
  }

  return  {
    visitor: {
      Program(path) {
        const scope = path.context.scope
        const options = this.opts
        const filename = this.file.opts.filename
        
        const filterFiles = options.include || options.exclude
        if (filterFiles){
          let match = checkItems(toArray(filterFiles),
            (mask) => minimatch(filename, mask)
          )
          if (options.include ? !match : match){
            return
          }
        }

        if (canMakeCircular(scope, options)){
          path.traverse(makeVisitor(scope, options))
        }
      }
    }
  }
}
