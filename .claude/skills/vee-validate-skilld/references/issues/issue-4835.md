---
number: 4835
title: Extend meta object from useForm with meta state per field
type: other
state: open
created: 2024-08-09
url: "https://github.com/logaretm/vee-validate/issues/4835"
reactions: 5
comments: 0
---

# Extend meta object from useForm with meta state per field

**Is your feature request related to a problem? Please describe.**

When building a form, it's a good UX practice to show the validation state of a field as indeterminate _until_ the user has finished typing. Currently, this is not possible when using `useForm`, because the meta object only contains the dirty and touched states for the _entire_ form.

This is also inconsistent with `useForm`s objects `values` and `errors`, which are objects with keys of each field.

**Describe the solution you'd like**

I propose to be able to do the following:

```
const { meta } = useForm({
  firstName: string().required(),
  lastName: string().required()
})
```

Which would give me the state for the form as a whole _plus_ the meta for each field included:

```
const meta = {
    dirty: true,
    pending: false,
    touched: true,
    valid: false,
    // keys with the meta for each field
    firstName: {
      dirty: true,
      pending: false,
      touched: true,
      valid: true,
    },
    lastName: {
      dirty: false,
      pending: false,
      touched: false,
      valid: false,
    },
  };
```

This solution would allow me to pass specific meta details to each field's component, without having to rely on `useField`, making the code more compact.
