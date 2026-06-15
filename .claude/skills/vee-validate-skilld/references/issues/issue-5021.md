---
number: 5021
title: Breaking Change in `useField` Behavior After v4.11.8 - meta object no longer syncs
type: other
state: open
created: 2025-04-10
url: "https://github.com/logaretm/vee-validate/issues/5021"
reactions: 3
comments: 0
---

# Breaking Change in `useField` Behavior After v4.11.8 - meta object no longer syncs

### What happened?

Since upgrading from version `4.11.8` to any later version (`>= 4.12.x`), a breaking change has occurred in the behavior of `useField`. Specifically, when encapsulating an input within a parent component—such as handling generic UI states like error messages—calling `useField("fieldname")` separately in both parent and child components now returns two separate `meta` objects which are no longer synchronized.

In previous versions (`<= 4.11.8`), interacting with a field (e.g., touching the field) would correctly update both the child and parent component `meta` states simultaneously. In newer versions, the child component's `meta` updates independently, while the parent's `meta` remains unchanged, causing inconsistent validation state management.

...