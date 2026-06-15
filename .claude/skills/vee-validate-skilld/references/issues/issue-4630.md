---
number: 4630
title: useForm - meta.valid false even tho there are no errors?
type: other
state: open
created: 2024-01-12
url: "https://github.com/logaretm/vee-validate/issues/4630"
reactions: 5
comments: 14
labels: "[v5]"
---

# useForm - meta.valid false even tho there are no errors?

### What happened?

I got multiple Forms that get shown one after the other. If I am at step 5 or whatever and I get back to a previous step like step 2 the form of step 2 gets shown but it's no longer valid even tho it was before.

Even if I then change the values of the form again the meta.valid state doesn't get updated while the errors get set correctly.


```ts
interface SchadenursacheData {
  schadenursache: SchadenursacheTypes;
  valid: boolean;
}

const { handleSubmit, meta, values, errors } = useForm<SchadenursacheData>({
  validationSchema: object({
    schadenursache: string().required("Bitte angeben"),
  }),
});
```

This is the "failed state" after returning to the form: 




### Reproduction steps

Sorry I don't have reliable repro steps outside our codebase.

### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [X] Firefox
- [X] Chrome
- [X] Safari
- [ ] Microsoft Edge

### Relevant log output

_No response_

### Demo link

-

### Code of Conduct

- [X] I agree to follow this project's [Code of Conduct](CONDUCT.md)