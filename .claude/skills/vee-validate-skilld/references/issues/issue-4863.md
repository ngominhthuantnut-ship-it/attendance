---
number: 4863
title: "@vue/devtools-api/lib/cjs/index.js' does not provide an export named 'setupDevtoolsPlugin' (at vee-validate.esm.js:7:10)"
type: other
state: closed
created: 2024-09-17
url: "https://github.com/logaretm/vee-validate/issues/4863"
reactions: 11
comments: 8
---

# @vue/devtools-api/lib/cjs/index.js' does not provide an export named 'setupDevtoolsPlugin' (at vee-validate.esm.js:7:10)

### What happened?

There is an error in console:

```
Uncaught SyntaxError: The requested module '/_nuxt/@fs/Users/x/Code/y-frontend/node_modules/.pnpm/@vue+devtools-api@6.6.4/node_modules/@vue/devtools-api/lib/cjs/index.js' does not provide an export named 'setupDevtoolsPlugin' (at vee-validate.esm.js:7:10)Understand this error
```

I see further information here:

https://github.com/nuxt/nuxt/issues/27544#issuecomment-2168194904



### Reproduction steps

1. Use latest nuxt
2. Use latest vee-validate
3.

### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [ ] Firefox
- [X] Chrome
- [ ] Safari
- [ ] Microsoft Edge

### Relevant log output

_No response_

### Demo link

n/a

### Code of Conduct

- [X] I agree to follow this project's [Code of Conduct](CONDUCT.md)

---

## Top Comments

**@logaretm** [maintainer]:

I pushed a possible fix by defining `export` fields in `package.json`. I will verify if it works then update this issue.

**@logaretm** [maintainer]:

Seems fixed against the linked issue in Nuxt repo with vee-validate `v4.14.0`. Let me know if this isn't the case.

Change was in 97cebd83ad23e7eeb1fdf69acabd8e42814e1755

**@murshex** (+2):

I have same problem. Using pnpm