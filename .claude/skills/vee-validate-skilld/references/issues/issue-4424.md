---
number: 4424
title: Maximum recursive updates exceeded when using `useField`
type: other
state: closed
created: 2023-08-18
url: "https://github.com/logaretm/vee-validate/issues/4424"
reactions: 8
comments: 2
---

# Maximum recursive updates exceeded when using `useField`

### What happened?

Hello. First of all, thank you for amazing library.

I got warn `[Vue warn]: Maximum recursive updates exceeded in component <App>. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.` when editing child component which use `useField()` function. 

I also tried to modify element of `rules` array like so:

```
const setCertificate = useSetFieldValue<Certificate>(
  () => `rules[${props.index}].certificate`
);
```

It's actually works but got another warn `[Vue warn]: [vee-validate]: Could not set value for unknown field with path "rules[0].certificate"`


Maybe I am doing something wrong with array fields? How can I manage it from child component? 

### Reproduction steps

1. Change something in `rule-row.vue`.
2. Check devtools console for the warning.
...


### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [X] Firefox
- [X] Chrome
- [ ] Safari
- [ ] Microsoft Edge

### Relevant log output

```shell
[Vue warn]: Maximum recursive updates exceeded in component <App>. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.
```


### Demo link

...

---

## Top Comments

**@viT-1** (+1):

Have same problem with `Maximum recursive updates exceeded` in script setup (any console.log) with my component form since I start to use useField for custom input.

Some investigation:
recursive render starts as soon as I use my custom reactive variable with meta (in custom input component), such as
```js
const { meta: veeMeta } = useField(() => params.id, val => !!val, { syncVModel: true });

const state = reactive({
isValid: params.required ? false : true,
isAccepted: params.required ? veeMeta.valid && veeMeta.touched : undefined,
});
```


**@logaretm** [maintainer]:

Thanks for reporting this, I'm investigating it.