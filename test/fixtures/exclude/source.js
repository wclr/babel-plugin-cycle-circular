import {Subject} from 'rx'
import {Component1} from './component1'
import {Component2} from './component2'

function main ({DOM, HTTP}) {

  var component1 = Component1({value$: component2.value$, DOM})
  var component2 = Component2({HTTP})

  return {
    DOM: component1.DOM,
    HTTP: component2.HTTP
  }
}