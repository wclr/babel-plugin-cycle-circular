import { subject } from 'most-subject';
import { Component1 } from './component1';
import { Component2 } from './component2';

const main = ({ DOM, HTTP: string }) => {
  const {
    __Proxy0_Stream,
    __Proxy0_Observer
  } = subject();

  var component1 = Component1({ value$: __Proxy0_Stream, DOM });
  var component2 = Component2({ HTTP });

  const __Proxy0_Sub = component2.value$.observe(__Proxy0_Observer.next).then(__Proxy0_Observer.complete).catch(__Proxy0_Observer.error);

  return {
    DOM: component1.DOM,
    HTTP: component2.HTTP
  };
};