// This mixin fixes following issue: errorHandler does not work with async component methods.
// Fixing that issue is required for the ErrorBoundary component to work correctly.
//
// First I tried https://github.com/vuejs/vue/issues/7653
// That didn't work, so I then tried: https://markeev.com/posts/vue-error-handling/
// Which seems to work! (as long as you mark all functions as async and use await properly)

function handleError(error, vm, info) {
  let cur = vm;
  while ((cur = cur.$parent)) {
    const hooks = cur.$options.errorCaptured || [];
    for (const hook of hooks) if (hook.call(cur, error, vm, info) === false) break;
  }
}

export default {
  beforeCreate: function() {
    const _self = this;
    const methods = this.$options.methods || {};
    for (var key in methods) {
      var original = methods[key];
      methods[key] = function() {
        try {
          const result = original.apply(this, arguments);
          // let's analyse what is returned from the method
          if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
            // this looks like a Promise. let's handle it's errors:
            return result.catch(function(err) {
              handleError(err, _self, key);
            });
          } else return result;
        } catch (e) {
          handleError(e, _self, key);
        }
      };
    }
  },
};
