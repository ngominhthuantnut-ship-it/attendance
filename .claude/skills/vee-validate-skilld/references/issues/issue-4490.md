---
number: 4490
title: Expose useFormContext composable
type: feature
state: closed
created: 2023-10-04
url: "https://github.com/logaretm/vee-validate/issues/4490"
reactions: 6
comments: 3
labels: "[ enhancement]"
---

# Expose useFormContext composable

**Is your feature request related to a problem? Please describe.**

In cases where multiple form context elements are required, such as utility functions to manage state of reset/submit buttons depending on several factors within form context, it would be nice to have access to the form context via a composable.

For example, consider a sample function that checks whether a cancel button should be disabled or not. It checks multiple aspects of form context, which would be annoying to both get and pass in individually every time this is used . Instead, passing in `FormContext` allows calling the function and directly passing form context for ease of use.

```ts
/**
 * Disable cancel buttons when form is submitting or empty/unsubmitted
 *
 * @param form           - Form state (potentially from injected reference)
 * @param allowWhenEmpty - Allow cancelling (reset) when empty/unsubmitted (useful in dialogs, etc)
 */
export const shouldDisableCancel = (form: FormContext<FieldValues>, allowWhenEmpty = false) => {
  const isSubmittingOrValidating = form.isSubmitting.value || form.isValidating.value;

  // Some locations may allow cancelling when empty/unsubmitted (ie. dialogs)
  if (allowWhenEmpty) return isSubmittingOrValidating;

  // Must include submit count to allow resetting field after invalid submission attempt
  return isSubmittingOrValidating || (!form.meta.value.dirty && !form.submitCount.value);
};
```

**Describe the solution you'd like**

E...