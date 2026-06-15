---
number: 4684
title: in Production  error context not accessible in shared components across nuxt modules or layers
type: other
state: open
created: 2024-03-05
url: "https://github.com/logaretm/vee-validate/issues/4684"
reactions: 4
comments: 2
---

# in Production  error context not accessible in shared components across nuxt modules or layers

### What happened?

We are using nuxt-layers and nuxt modules in conjunction with vee-validate.

Our shared component has a fieldwrapper that displays a field label, and shows any error messages below the field by using a field name prop. Currently we are using the provided ErrorMessage component to do this, but we have also tried the composition helpers.  `<ErrorMessage name="fieldName" />`

On local everything works as expected.

in production errors in shared components are  undefined
<img width="385" alt="image" src="https://github.com/logaretm/vee-validate/assets/9349874/1e15e0a9-3630-4c4e-9d73-904a01c0816e">


In production builds the errors are always undefined. It doesn't work when the component is provided either by a nuxt-layer, or by our validation module, it only wo...