import { ReplaySubject } from 'rx';
import { Component1 } from './component1';
import { Component2 } from './component2';

function mainFiltered({ DOM, HTTP }) {
  const __Proxy0 = new ReplaySubject(1);

  var component1 = Component1({ value$: __Proxy0.finally(() => {
      if (__Proxy0.observers.length === 0) __Proxy0_Sub.dispose();
    }), DOM });
  var x = doNotProxyMe;
  var component2 = Component2({ HTTP });
  var doNotProxyMe = 2;

  const __Proxy0_Sub = component2.value$.subscribe(__Proxy0);

  return {
    DOM: component1.DOM,
    HTTP: component2.HTTP
  };
}