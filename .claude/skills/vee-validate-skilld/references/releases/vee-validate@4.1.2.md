---
tag: vee-validate@4.1.2
version: 4.1.2
published: 2020-12-26
---

# vee-validate@4.1.2

####   New Feature

- added `useSubmitForm` composition API helper that functions similarly to `handleSubmit` but with a composition API style.

```js
import { useSubmitForm } from 'vee-validate';

const submitForm = useSubmitForm((values, actions) => {
  // Send data to your api ...
  alert(JSON.stringify(values, null, 2));

  // You can perform any of the form actions using the actions object
  // set a single field value
  actions.setFieldValue('field', 'hello');
  // set multiple fields values
  actions.setValues({ email: 'value', password: 'hi' });
  // set a single field error
  actions.setFieldError('field', 'this field is bad');
  // set multiple fields errors
  actions.setErrors({ email: 'bad email', password: 'bad password' });
  // reset the form
  actions.resetForm();
});
```