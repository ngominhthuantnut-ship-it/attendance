---
number: 4697
title: The meta.dirty value always true when you use initialValues parameter in useForm()
type: other
state: open
created: 2024-03-12
url: "https://github.com/logaretm/vee-validate/issues/4697"
reactions: 5
comments: 1
---

# The meta.dirty value always true when you use initialValues parameter in useForm()

### What happened?

For example, I have this form:

```
interface EditVersionModalForm {
  name: string
  name2: string
  name3: string
}

const useFormOptions = {
  validationSchema: {
    name: requiredField,
  },
  initialValues: {
    name: props.tariff.name,
    name2: props.tariff.name2,
    name3: props.tariff.name3,
  },
}

const { defineField, handleSubmit, errors, meta, handleReset } =
  useForm<EditVersionModalForm>(useFormOptions)
```

In this case, I am trying to disable the submit button, when values are didn't change at all. But I get always `meta.dirty` value as `true`

I think useForm considers initialValues as "updated values". But if we will think from UX side, it seems should be `false`, when you give initial values. And only set to `true`, when initial values are changed.

### Reproduction steps

1. Create form using `useForm()` composable.
2. Set `initialValues` parameter
3. Always get a `meta.dirty` value as `true`


### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [ ] Firefox
- [x] Chrome
- [ ] Safari
- [ ] Microsoft Edge

### Relevant log output

_No response_

### Demo link

I can't. But I think I explained well

### Code of Conduct

- [x] I agree to follow this project's [Code of Conduct](CONDUCT.md)