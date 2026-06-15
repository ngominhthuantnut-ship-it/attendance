---
number: 2638
title: Multiple v-models/values inside validation provider gives infinite loop
type: bug
state: closed
created: 2020-02-17
url: "https://github.com/logaretm/vee-validate/issues/2638"
reactions: 11
comments: 20
labels: "[ bug,  In PR]"
---

# Multiple v-models/values inside validation provider gives infinite loop

**Versions**
- vee-validate: 3.2.1
- vue: 2.6.10

**Describe the bug**
This is a copy of #2587 that got closed. I've attached a better demo.

It seems that when using a component with multiple v-models inside a validation provider the application hangs with an infinite loop.

**To reproduce**
Steps to reproduce the behavior:
1. Go to demo link
2. The Demo.vue-component contains a validation provider with a component inside.
3. As soon as a v-model is added to the component the loop starts.

**Demo link**
https://codesandbox.io/s/codesandbox-mlioh

**Desktop (please complete the following information):**
 - OS: win10
 - Browser chrome 
 - Version latest