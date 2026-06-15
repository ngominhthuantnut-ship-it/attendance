---
number: 5043
title: Add `useFieldMeta()`
type: other
state: open
created: 2025-05-14
url: "https://github.com/logaretm/vee-validate/issues/5043"
reactions: 5
comments: 1
---

# Add `useFieldMeta()`

**Is your feature request related to a problem? Please describe.**

I created a collection of form components, and I want to style the required fields differently.
I can tell which fields are required by looking at `meta.required`, but `meta` is currently only available through `useField()`.

**Describe the solution you'd like**

I suggest adding `useFieldMeta()` to return the field's meta.

**Describe alternatives you've considered**

I tried `useField()`, but it causes issues when the field needs options (such as `{type:"checkbox"}`) because it alters the field's behavior.

Adding `useFieldRequired()`/`useIsFieldRequired()` would also be a suitable solution to my issue, but I noticed that the documentation never mentions `meta.required`, so I assume this property isn't always available.



---

## Top Comments

**@bblanchon** (+1):

According to the migration guide, `meta.required` will stop working in v5:

> Resolving `required` meta flag is no longer supported from schemas.

This forces me to mark required fields at the component level so I won't need `useFieldMeta()` after all.