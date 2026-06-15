---
tag: vee-validate@4.1.4
version: 4.1.4
published: 2021-01-04
---

# vee-validate@4.1.4

####   Bugs Fixed

fixed an issue where formless checkboxes created with `<Field />` component would fail to toggle their associated `v-model` value #3105 

This also means can use a group `<Field type="checkbox" />` without form as long as they are bound to the same `v-model`, which mirrors the behavior of `v-model` on `input[type="checkbox"]` where it wasn't possible before without a wrapping `<Form />` or `useForm`.
