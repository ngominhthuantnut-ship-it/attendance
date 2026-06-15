---
tag: vee-validate@4.1.0
version: 4.1.0
published: 2020-12-18
---

# vee-validate@4.1.0

####  Composition Helpers

Added (#3055) the following composition API functions, these functions should make it easier to build specific specialized components for your forms (indicators, behaviors, etc...) 

- `useResetForm` allows you to reset the form from anywhere in the component tree
- `useFieldErrors` returns a computed ref to any form field's error message
- `useFormErrors` returns a computed ref of the entire form's error bag
- `useIsFieldDirty` returns a computed boolean ref for the field's dirty status
- `useIsFieldTouched` returns a computed boolean ref for the field's touched status
- `useIsFormDirty` returns a computed boolean ref for the form's dirty status (if any field is dirty)
- `useIsFormTouched` returns a computed boolean ref for the form's touched status (if any field is touched)
- `useIsFieldValid` returns a computed boolean ref for a field's valid status
- `useIsFormValid` returns a computed boolean ref if the form is valid
- `useIsSubmitting` returns a computed boolean if the form is submitting
- `useValidateField` returns a function that validates the specified field
- `useValidateForm` returns a function that validates the context form
- `useSubmitCount` returns the submission attempts count done by the user
- `useFieldValue` returns a specific field's current value
- `useFormValues` returns the values of the form's fields  

####  Breaking Changes

- Changed the return result of `validate()` for the `<Form />` and `useForm()`, instead of a boolean it now returns an object containing `errors` object and `valid` boolean flag, this should make the function more useful.

####  Types

- Exported a few internal Types #3065 (b88dffd)