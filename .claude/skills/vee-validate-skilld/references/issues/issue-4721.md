---
number: 4721
title: The types for the errors when using useFieldArray are incorrect
type: other
state: open
created: 2024-04-02
url: "https://github.com/logaretm/vee-validate/issues/4721"
reactions: 12
comments: 4
labels: "[ TypeScript]"
---

# The types for the errors when using useFieldArray are incorrect

### What happened?

```javascript
const {
  handleSubmit,
  values,
  errors,
} = useForm(
  {
    validationSchema: toTypedSchema(schema),
    initialValues: {
      people:[{name: 'John'}]
    }
  })
```
According to the types the errors should be 
```javascript
<input  ... :error-messages="errors[`people.${index}.name`]" />
```
But in reality it is
```javascript
errors: {
  "people[0].name": "Required",
  "people[1].name": "Required"
}
```
yet writing this gives me a typescript error
```
<input  ... :error-messages="errors[`people[${index}].name`]" />
```

```
Element implicitly has an 'any' type because expression of type '`people[${number}].businessName`' can't be used to index type 'Partial<Record<"people" | `people.${number}` | `people.${number}.name` | `people.${number}.businessName` | `people.${number}.country` | `people.${number}.contactEmail` | `people.${number}.contactPerson` | `people.${number}....'.ts(7053)
```



### Reproduction steps

1.
2.
3.
...


### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [X] Firefox
- [X] Chrome
- [X] Safari
- [X] Microsoft Edge

### Relevant log output

_No response_

### Demo link

...

### Code of Conduct

- [X] I agree to follow this project's [Code of Conduct](CONDUCT.md)

---

## Top Comments

**@ArtemDehteruk** (+1):

@gukandrew Hello.
I haven't fixed it.
I found that the vee-validate.d.ts file of the vee-validate package dependency is different from the one I get after building that package, and if I use the new file, It fixes errors.

**@Janibek6119**:

@ArtemDehteruk thanks a lot! Apparently the commit where the types were fixed 721e9802d3ef6d94a080f1976463c895db8048eb happened just after the current release tag [v4.15.0](215e27a7d988f3a5ef9b81a67cfa5277cd268d9a)

...

**@ArtemDehteruk**:

Hello.
I did some research and found that the vee-validate has a different context for the vee-validate.d.ts file than the file created using the npm package menager. When I use the created file, it fixes the array path error.
@logaretm Please check.
Thanks.