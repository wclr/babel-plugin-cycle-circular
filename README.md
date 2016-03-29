# babel-plugin-cycle-circular

Babel plugin allowing to have circular dependencies with [cycle.js](http://cycle.js.org)

## What?

This (note that `componentBar` is *used* **before** *declared*):

```js
  const componentFoo = ComponentFoo({value$: componentBar.value$, DOM})
  const componentBar = ComponentBar({HTTP, componentFoo.prop$})
```

will just work.

## How does it

This is your ES6 source:

```js
import {ComponentFoo} from './ComponentFoo'
import {ComponentBar} from './ComponentBar'

const main = ({DOM, HTTP}) => {

  const componentFoo = ComponentFoo({value$: componentBar.value$, DOM})
  const componentBar = ComponentBar({HTTP, componentFoo.prop$})

  return {
    DOM: componentFoo.DOM,
    HTTP: componentBar.HTTP
  }
}
```

To get the same result without this `plugin` you may 
sacrifice functional style and do the following with your hands:

```js
// import subject which is usually not needed
import {Subject} from './component1'
import {ComponentFoo} from './ComponentFoo'
import {ComponentBar} from './ComponentBar'

const main = ({DOM, HTTP}) => {
  // declare proxy subject which will be used to subscribe 
  // to target stream, and be a source for consumption
  const valueProxy = new Subject()
  // make proxy stream safe - when it ends (or terminates) 
  // remove subscription to prevent memory leak 
  const value$SafeProxy = valueProxy.finally(() => {
    value$ProxySub.dispose()
  })

  const componentFoo = ComponentFoo({value$SafeProxy, DOM})
  const componentBar = ComponentBar({HTTP, componentFoo.prop$})

  // create subscription for target stream 
  // subscription is actually `side effect`   
  const value$ProxySub = componentBar.value$.subscribe(value$Proxy$)

  return {
    DOM: componentFoo.DOM,
    HTTP: componentBar.HTTP
  }
}

```

## Usage

```bash
npm install bable-plugin-cycle-circular
```

Just add plugin to to your `.babelrc` file or transform options:
```json
{
  "presets": ["es2015"],
  "plugins": ["cycle-circular"]
}
```

There are some options that you can supply to the plugin:
* **identifiers** (default: null) - regExp pattern(s) for matching identifiers names that should be proxied. 
* **include** (default: '') - includes files my `minimatch` mask (can be array)
* **exclude** (default: '') - includes files my `minimatch` mask (can be array)


## Tests
Tests checks if actual transformed source from `fixtures` 
corresponds to fixed transformed version in the same `fixtures/{case}` folder. 
```bash
npm run test
```