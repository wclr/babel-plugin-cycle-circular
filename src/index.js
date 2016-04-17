import minimatch from 'minimatch'

const getIdentifierFromPath = (path) => {
  let type = path.parentPath.type
  return type == 'MemberExpression' || type == 'CallExpression'
    ? getIdentifierFromPath(path.parentPath) : path
}

const toArray = (thing) =>
  thing && !Array.isArray(thing) ? [thing] : (thing || [])


const checkItems = (items, checkFn) =>
  items.reduce((checked, item) => {
    return checked || checkFn(item)
  }, false)

let checkMinimatch = (masks, filename) => checkItems(toArray(masks),
  (mask) => minimatch(filename, mask)
)

const checkScopeIsFunction = (scope) => {
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
    proxies: {},
    proxiesCount: 0
  }
  return scope._cycleCircular
}

export default function ({types: t}) {
  const makeVisitor = (scope, options, lib) => {
    
    let matchIdentifiers = toArray(options.identifiers)
      .map(match => new RegExp(match))
    
    let mainScope = scope
    
    const matchIdentifierName = (name) => {
      if (matchIdentifiers.length){
        return matchIdentifiers.reduce((matched, match) => 
          matched || match.test(name)
        , false)
      }
      return true
    }
    
    return {
      ReferencedIdentifier (path) {
        if (!checkScopeIsFunction(path.scope)) return
        let _circular = getScopeCircular(path.scope)

        let name = '__' + path.node.name

        if (_circular.declarations[name]){
          return
        }
        _circular.identifiers[name] = _circular.identifiers[name] || {paths: []}
        _circular.identifiers[name].paths.push(path)
      },

      VariableDeclaration (path) {
        if (!checkScopeIsFunction(path.scope)) return

        let _circular = getScopeCircular(path.scope)
        var body = path.scope.block.body.body

        path.node.declarations.forEach(dec => {
          let identifier = _circular.identifiers['__' + dec.id.name]
          if (identifier){
            identifier.paths.forEach((path) => {
              let identifierPath = getIdentifierFromPath(path)
              let identifierSource = identifierPath.getSource()
              if (!matchIdentifierName(identifierSource)){
                return
              }
              let proxyName = '__Proxy' + _circular.proxiesCount
              let proxy = lib.makeProxy(proxyName, identifierSource, options)
              
              body.unshift(proxy.declaration)
              identifierPath.replaceWith(proxy.replaceWith)

              let ret = body[body.length - 1].type == 'ReturnStatement'
                ? body.pop() : null
              body.push(proxy.subscription)
              ret && body.push(ret)

              _circular.proxiesCount++
              mainScope._hasCircularProxies = true
            })
          }
          _circular.declarations[dec.id.name] = true
        })
      }
    }
  }

  return  {
    visitor: {
      Program (path, state) {
        const scope = path.context.scope
        const options = this.opts
        const filename = this.file.opts.filename

        const filterFiles = options.include || options.exclude
        if (filterFiles){
          let match = checkMinimatch(filterFiles, filename)
          match = options.include
            ? (!match && !checkMinimatch(options.exclude, filename))
            : match
          if (match){ return }
        }

        let lib, libName = options.lib || 'rx'
        lib = require('./' + libName)
        
        path.traverse(makeVisitor(scope, options, lib))
        
        if (scope._hasCircularProxies){
          lib.addImports(path.node, scope, options)
        }
      }
    }
  }
}
