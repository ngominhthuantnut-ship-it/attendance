---
number: 2248
title: Add a way to get all errors to ValidationObserver
type: feature
state: closed
created: 2019-08-27
url: "https://github.com/logaretm/vee-validate/issues/2248"
reactions: 16
comments: 15
labels: "[ enhancement, request]"
---

# Add a way to get all errors to ValidationObserver

**Is your feature request related to a problem? Please describe.**
I really like the changes in v3. It's solved a lot of the issues with componentizing forms (no more inject!) and displaying errors, etc. However, I keep wanting to have some concise way to get all the errors on the page. Either for debugging or for displaying the first error on submit or scrolling the form back up to the error message, etc.

**Describe the solution you'd like**
Add `getErrors` or some other interface to `ValidationObserver` to get some sort of error list. `validate` and `setErrors` already exists so it would seem natural to add a `getErrors`.

**Describe alternatives you've considered**
The `validate` method could return more than true/false but that seems a bit kludgy. An `error-model` or something similar could be used to store errors based on events.



---

## Top Comments

**@logaretm** [maintainer] (+5):

Currently, you can get the errors from the slot scope of the observer. Or using `$refs.observerRef.ctx.errors`.

But I will think of a better way to get it soon.

**@d3radicated** (+9):

If you would like to get errors after validation,

```
this.$refs.observerRef.validate().then(() => {
    console.log(this.$refs.observerRef.errors);
})
```

**@rafaelrenanpacheco** (+8):

Current workaround until a better way is published:

```js
this.notifications = Object.values(this.$refs.observer.ctx.errors).flat();
```

This will ignore the `_vee_n` keys and will flat their values (validation messages) into a final array.