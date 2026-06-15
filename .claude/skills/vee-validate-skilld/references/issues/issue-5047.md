---
number: 5047
title: Allow multiple useForm | provide unique id to useForm
type: other
state: open
created: 2025-05-23
url: "https://github.com/logaretm/vee-validate/issues/5047"
reactions: 8
comments: 1
---

# Allow multiple useForm | provide unique id to useForm

**Is your feature request related to a problem? Please describe.**

Currently there is not way to have multiple `useForm` in the same component. (#4550 , #3270)

Let's imagine a scenario where on a page, you have a filters on a sidebar and a top bar form.  We might want to separate the validation for both components, and maybe also access the values from formA in formB.

**Describe the solution you'd like**

I was thinking of providing a `key` or `id` property to `useForm` (or `useFormContext` but it's not documented currently).

It would be used for the provide/inject pattern currently in place.


**Describe alternatives you've considered**

The only alternative we have currently is using a single `useForm` wrapping all our fields.

Maybe i'm missing something ?
Thanks !



---

## Top Comments

**@ojvribeiro**:

Yeah, I tried to do this for a multi-step form for password changing:



The second `useForm` work just fine, but the form for email stopped working.