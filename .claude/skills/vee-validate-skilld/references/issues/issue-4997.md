---
number: 4997
title: initial-values + zod validation-schema behaves strangely in multi-step form
type: other
state: open
created: 2025-03-04
url: "https://github.com/logaretm/vee-validate/issues/4997"
reactions: 3
comments: 0
---

# initial-values + zod validation-schema behaves strangely in multi-step form

### What happened?

I have this example using yup: https://stackblitz.com/edit/vee-validate-v4-hoc-multi-step-form-eky2u2as?file=src%2FApp.vue

And this using zod: https://stackblitz.com/edit/vee-validate-v4-hoc-multi-step-form-meu1mnvu?file=src%2FApp.vue

You will see that both examples are exactly the same. However the value for the zod example only contains the values in the first step but the yup one contains all values.

Zod is the validation tool I'm using in my project

Locally I have had varying behaviour. With some form configurations the value contains all of the initial values and other only the values from the first step. I can't figure out the specifics but managed to get this example to reproduce it.

...