# babel-plugin-cycle-circular

Babel plugin allowing to have circular dependencies with [cycle.js](http://cycle.js.org)

## What?

This (note that `bar` is ***used* before *declared*** in the code):

```js
  const foo = Foo({value$: bar.value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
```

will just work.

**This is experimented feature** - try and see if it fits your needs, if something wrong or 
it doesn't cover you usage scenarios just create [an issue](issues) and we'll try to fix it.  

## How does it work

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
import {Subject} from 'rx'
import {ComponentFoo} from './ComponentFoo'
import {ComponentBar} from './ComponentBar'

const main = ({DOM, HTTP}) => {
  // declare proxy subject which will be used to subscribe 
  // to target stream, and be a source for consumption
  const valueProxy$ = new Subject()
  // make proxy stream safe - when it ends (or terminates) 
  // remove subscription to prevent memory leak 
  const valueSafeProxy$ = valueProxy$.finally(() => {
    valueProxySub.dispose()
  })

  const componentFoo = ComponentFoo({valueSafeProxy$, DOM})
  const componentBar = ComponentBar({HTTP, componentFoo.prop$})

  // create subscription for target stream 
  // subscription is actually `side effect`   
  const valueProxySub = componentBar.value$.subscribe(valueProxy$)

  return {
    DOM: componentFoo.DOM,
    HTTP: componentBar.HTTP
  }
}

```

This also work for [`most.js`](https://github.com/cujojs/most) library, as if you write this: 
```
import {subject} from 'most-subject'
import {ComponentFoo} from './ComponentFoo'
import {ComponentBar} from './ComponentBar'

const main = ({DOM, HTTP}) => {

  const proxy = subject()

  const componentFoo = ComponentFoo({proxy.stream, DOM})
  const componentBar = ComponentBar({HTTP, componentFoo.prop$})

  const valueProxySub = componentBar.value$
     .observe(proxy.observer.next)
     .then(proxy.observer.complete)
     .catch(proxy.observer.error)

  return {
    DOM: componentFoo.DOM,
    HTTP: componentBar.HTTP
  }
}
```

## Usage

```bash
npm install babel-plugin-cycle-circular
```

Just add plugin to to your `.babelrc` file or transform options:
```json
{
  "presets": ["es2015"],
  "plugins": ["cycle-circular"]
}
```

### Conventions

*NB!*
 Works with [`rxjs v4`](https://github.com/Reactive-Extensions/RxJS), 
 [`rxjs v5`](https://github.com/ReactiveX/rxjs) and [`most.js`](https://github.com/cujojs/most) ES6 sources.
 If you want to use CJS source you should `require` Subject (or subject) manually.
 
### Options

There are some options that you can supply to the plugin:
* **lib** (default: 'rx') - what library rules to use for creating proxies, possilbe values: `"rx", "rxjs", "most"`.
* **identifiers** (default: null) - regExp pattern(s) for matching identifiers names that should be proxied.
* **include** (default: '') - includes files my `minimatch` mask (can be array)
* **exclude** (default: '') - includes files my `minimatch` mask (can be array)

**Options example:**
This options for plugin will exclude from processing all files in `models/` folder 
and will proxy only if last identifier of reference ends with `$` for example `component.value$`,
(references like `component.value` won't be handled)
```json
{
  "presets": ["es2015"],
  "plugins": [
    ["cycle-circular", {
        "lib": "rxjs",
        "identifiers": ["\\$$"],
        "exlude": ["**/models/**"]  
    }]
  ]
}
```

## Is it safe to use?
 
Technically, it just traverse (scans) each function and finds variable references that go before declaration, 
and applies `subject proxy` for it during `babel` transpilation. It is said that the plugin is experimental but 
it does simple transformation of your code, so if something goes wrong you should see it during development. 

## Tests
Tests checks if actual transformed source from `fixtures` 
corresponds to fixed transformed version in the same `fixtures/{case}` folder. 
```bash
npm run test
```