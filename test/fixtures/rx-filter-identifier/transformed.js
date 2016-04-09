import { Subject } from 'rx';
import { Component1 } from './component1';
import { Component2 } from './component2';

function mainFiltered({ DOM, HTTP }) {
  const __Proxy0 = new Subject();

  var component1 = Component1({ value$: __Proxy0.finally(() => __Proxy0_Sub.dispose()), DOM });
  var x = doNotProxyMe;
  var component2 = Component2({ HTTP });
  var doNotProxyMe = 2;

  const __Proxy0_Sub = component2.value$.subscribe(__Proxy0);

  return {
    DOM: component1.DOM,
    HTTP: component2.HTTP
  };
}