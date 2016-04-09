import {Component1} from './component1'
import {Component2} from './component2'

function mainFiltered ({DOM, HTTP}) {

  var component1 = Component1({value$: component2.value$, DOM})
  var x = doNotProxyMe
  var component2 = Component2({HTTP})
  var doNotProxyMe = 2

  return {
    DOM: component1.DOM,
    HTTP: component2.HTTP
  }
}