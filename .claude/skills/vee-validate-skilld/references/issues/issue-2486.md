---
number: 2486
title: Chrome autofill leave form as invalid
type: other
state: closed
created: 2019-11-12
url: "https://github.com/logaretm/vee-validate/issues/2486"
reactions: 11
comments: 15
---

# Chrome autofill leave form as invalid

**Versions**

- vee-validate: 3.0.11
- vue: 2.6.10

**Describe the bug**
When chrome autofill form, vee validate still thinks form is invalid, while all fields are valid. Errors are empty. Touched is true, pristine is false but invalid is true, while it should be false

**To reproduce**
Open repro link click login - enter anything. click login. save chrome creds. Reload page open again

**Expected behavior**
form is valid after chrome autofill.


**Demo link**
https://1hqj7.sse.codesandbox.io/
https://codesandbox.io/s/codesandbox-nuxt-1hqj7

