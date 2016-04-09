import { Subject } from 'rxjs';
import { Component1 } from './component1';
import { Component2 } from './component2';

const main = ({ DOM, HTTP }) => {
  const __Proxy0 = new Subject();

  var component1 = Component1({ value$: __Proxy0.finally(() => __Proxy0_Sub.dispose()), DOM });
  var component2 = Component2({ HTTP });

  const __Proxy0_Sub = component2.value$.subscribe(__Proxy0);

  return {
    DOM: component1.DOM,
    HTTP: component2.HTTP
  };
};