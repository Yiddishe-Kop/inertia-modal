(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue'), require('axios'), require('@inertiajs/vue3')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vue', 'axios', '@inertiajs/vue3'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["inertia-modal"] = {}, global.vue, global.axios, global.vue3));
})(this, (function (exports, vue, axios, vue3) { 'use strict';

  const resolveCallback = vue.ref();

  var resolver = {
    setResolveCallback: (callback) => {
      resolveCallback.value = callback;
    },
    resolve: (name) => resolveCallback.value(name),
  };

  const props$1 = vue.computed(() => vue3.usePage().props);
  const component$1 = vue.computed(() => vue3.usePage().component);

  /**
   * Reuse current (stale) props and component for the modal backdrop
   */
  function preserveBackdrop () {
    axios.interceptors.response.use(function(response) {
      if(response.headers['x-inertia'] && response.data.props?.modal) {
        let oldProps = JSON.parse(JSON.stringify(props$1.value));
        response.data.props = { ...oldProps, ...response.data.props };
        response.data.component = component$1.value;
      }
      return response
    });
  }

  const plugin = {
    install(app, options) {
      resolver.setResolveCallback(options.resolve);

      preserveBackdrop();
    },
  };

  const response = vue.computed(() => vue3.usePage().props);
  const modal = vue.computed(() => response.value?.modal);
  const props = vue.computed(() => modal.value?.props);
  const key = vue.computed(() => modal.value?.key);

  const componentName = vue.ref();
  const component = vue.shallowRef();
  const show = vue.ref(false);
  const vnode = vue.ref();

  const setHeaders = () => {
    axios.defaults.headers.common['X-Inertia-Modal-Key'] = key.value;
    axios.defaults.headers.common['X-Inertia-Modal-Redirect'] = modal.value?.redirectURL;
  };

  const resetHeaders = () => {
    delete axios.defaults.headers.common['X-Inertia-Modal-Key'];
    delete axios.defaults.headers.common['X-Inertia-Modal-Redirect'];
  };

  const close = () => {
    show.value = false;
    resetHeaders();
  };

  const resolveComponent = () => {
    if (!modal.value?.component) {
      return close()
    }

    if (componentName.value !== modal.value?.component) {
      componentName.value = modal.value.component;

      if (componentName.value) {
        component.value = vue.defineAsyncComponent(() => resolver.resolve(componentName.value));
      } else {
        component.value = false;
      }
    }

    vnode.value = component.value
      ? vue.h(component.value, {
        key: key.value,
        ...props.value,
      })
      : '';

    vue.nextTick(() => (show.value = true));
  };

  resolveComponent();

  vue.watch(
    () => modal.value,
    () => {
        resolveComponent();
    },
    { deep: true }
  );
  vue.watch(() => key.value, setHeaders);

  const redirect = () => {
    const redirectURL = modal.value?.redirectURL ?? modal.value?.baseURL;

    vnode.value = false;

    if (!redirectURL) {
      return
    }

    return vue3.router.visit(redirectURL, {
      preserveScroll: true,
      preserveState: true,
    })
  };

  const useModal = () => {
    return {
      show,
      vnode,
      close,
      redirect,
      props,
    }
  };

  const Modal = vue.defineComponent({
    setup() {
      const { vnode } = useModal();

      return () => vnode.value
    },
  });

  exports.Modal = Modal;
  exports.modal = plugin;
  exports.useModal = useModal;

}));