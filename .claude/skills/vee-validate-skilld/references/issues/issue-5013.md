---
number: 5013
title: FieldArray doesn't work nicely with radio inputs
type: other
state: open
created: 2025-03-25
url: "https://github.com/logaretm/vee-validate/issues/5013"
reactions: 7
comments: 0
---

# FieldArray doesn't work nicely with radio inputs

### What happened?

When using FieldArray I get unexpected behavior while using radio buttons.  When deleting indexes the browser seems to lose the checked state on radio buttons sometimes. I have added reproduction steps and a code example below.

I have found that the issue lies in the usage of indexes as names, this seems to confuse the browser. Much more than that I do not know

### Reproduction steps

1. Add a total of three items.  
2. On index 0, check the first radio.  
3. On index 1, check the second radio.  
4. On index 2, check the first radio.  
5. Remove index 0.  
6. Notice that the old index 1 item becomes index 0, but its radio checked state is gone, while the HTML input element still has the attribute `checked`.

### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [ ] Firefox
- [x] Chrome
- [ ] Safari
- [ ] Microsoft Edge


### Demo link

https://codesandbox.io/p/devbox/7zqprr

### Code of Conduct

- [x] I agree to follow this project's [Code of Conduct](CONDUCT.md)