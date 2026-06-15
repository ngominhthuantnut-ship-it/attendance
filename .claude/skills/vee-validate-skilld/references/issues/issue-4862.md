---
number: 4862
title: Unable to `autoImport` components in nuxt
type: bug
state: closed
created: 2024-09-16
url: "https://github.com/logaretm/vee-validate/issues/4862"
reactions: 14
comments: 19
labels: "[ bug]"
---

# Unable to `autoImport` components in nuxt

### What happened?

When integrating with nuxt, setting `autoImport: true` doesn't seem to work correctly.

An error is thrown:

```sh
The requested module '/_nuxt/node_modules/.pnpm/vee-validate@4.13.2_vue@3.5.6/node_modules/vee-validate/dist/vee-validate.js?v=b2471b49' does not provide an export named 'Form' 
```

### Reproduction steps

1. Add nuxt module
2. Try to use `<Form>`

### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [X] Firefox
- [X] Chrome
- [X] Safari
- [X] Microsoft Edge

### Relevant log output

```shell
The requested module '/_nuxt/node_modules/.pnpm/vee-validate@4.13.2_vue@3.5.6/node_modules/vee-validate/dist/vee-validate.js?v=b2471b49' does not provide an export named 'Form'
```


### Demo link

https://stackblitz.com/edit/github-kdegep

### Code of Conduct

- [X] I agree to follow this project's [Code of Conduct](CONDUCT.md)

---

## Top Comments

**@luc122c** (+2):

I'm also having a similar issue (`The requested module '[...]vee-validate.js' does not provide an export named 'Field'`). Pinning Nuxt to 3.12.4 seems to be a good workaround for now.

**@genu**:

You don't have to downgrade nuxt to workaround this issue. You can simply import the component manually from `vee-validate`

**@luc122c**:

> You don't have to downgrade nuxt to workaround this issue. 

I know, but I have a lot of components importing `Field`, I don't fancy adding manual imports to them all. It's easier for me to pin Nuxt until the auto-import issue is resolved. 