---
tag: vee-validate@4.0.6
version: 4.0.6
published: 2020-12-15
---

# vee-validate@4.0.6

####  New Features

- added `unchecked-value` prop to the `<Field />` component to allow creating toggling value fields.
- minor performance enhancements for `<Field />` and `<Form />` components (49fa2c1b4a337149c533c13725d2e71bb2664706) (d2668787d0ffcab5ba2e8be048ee7334d2b0f9e7)

####  Bug Fixes

- fixed an odd behavior where `resetForm` or `handleReset` would toggle checkboxes values each time they are called #3084 (38778f96471b6aa16fb020cfb1bde56b77a19cfb)
- added a `preventDefault` call on native `reset` events to prevent the browser's default behavior of unchecking the inputs (a66df13c3f39d84984581dc3c0ce368b052b6e8e)
