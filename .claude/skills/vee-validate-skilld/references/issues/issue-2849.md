---
number: 2849
title: "[v4] - Migration Guide"
type: docs
state: closed
created: 2020-08-04
url: "https://github.com/logaretm/vee-validate/issues/2849"
reactions: 26
comments: 26
labels: "[ docs,  v4.0]"
---

# [v4] - Migration Guide

Is there a migration guide, explaining the changes upgrading from 3.3 to 4.0? 


---

## Top Comments

**@logaretm** [maintainer] (+8):

I plan to release a few posts on the changes and maybe collect them in a guide but there is no direct upgrade route as the API is completely different, plus it does not support Vue 2.

**@logaretm** [maintainer] (+2):

@ux-engineer I already use `vue-demi` for another lib (villus) which works fine there, however for `vee-validate` it will be tricky as a large portion of the code base depends on the new VNode API which wouldn't work. So basically `Field` and `Form` components won't work.

Another reason is that some of the internals of vee-validate now relies on adding/removing properties at runtime, which means the old reactivity caveats still apply and won't work well with `v4`, that means limited feature support for `useField` and `useForm` and edge cases will be more apparent and confusing in Vue 2.

**@logaretm** [maintainer] (+4):

@bodograumann I thought about that initially, but aside from how hard is it to find a new name, I think it is better to build on the existing popularity of vee-validate especially not everyone who used vee-validate will switch to the new package and I would be gettings tons of requests for Vue 3 support.