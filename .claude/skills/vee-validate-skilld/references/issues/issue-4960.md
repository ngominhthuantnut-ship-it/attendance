---
number: 4960
title: toTypedSchema makes handleSubmit.withControlled include all values
type: other
state: open
created: 2024-12-12
url: "https://github.com/logaretm/vee-validate/issues/4960"
reactions: 3
comments: 0
---

# toTypedSchema makes handleSubmit.withControlled include all values

### What happened?

First of all, love the project!

I think i may have found a minor issue, but it may also be me just misunderstanding and doing something wrong.

Given a setup like this:
```js
const validationSchema = toTypedSchema(
  yup.object({
    name: yup.string().required(),
  })
)

const initialValues = {
  name: '',
  deletedAt: null, // no input exists for this
}

const { handleSubmit, controlledValues } = useForm({ validationSchema, initialValues })
```
If I have a single child input component with `useField('name')`, I find that `controlledValues` only contains name, but the `values` argument provided in `handleSubmit.withControlled` contains both name and deletedAt.

Not sure if this is intended, but if I don't use a validation schema, or if I use a sch...