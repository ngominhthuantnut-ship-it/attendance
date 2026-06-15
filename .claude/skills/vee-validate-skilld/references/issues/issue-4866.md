---
number: 4866
title: Type errors on vee-validate components after Vue 3.5 update
type: other
state: open
created: 2024-09-23
url: "https://github.com/logaretm/vee-validate/issues/4866"
reactions: 7
comments: 1
labels: "[ TypeScript]"
---

# Type errors on vee-validate components after Vue 3.5 update

### What happened?

After the Vue 3.5 upgrade, we get type errors about private types from the ErrorMessage or Field components.:
- Default export of the module has or is using private name 'FieldSlotProps'
-  Default export of the module has or is using private name 'ErrorMessageSlotProps'

Due to these errors we get serialization errors in TypeScript which cascades through the whole project.
The issue did not occur before we upgraded to Vue 3.5 but only happens for the vee-validate package.

### Reproduction steps

1. Install vee-validate in a new Vue project (using vue-create)
2. Create a new (.ts) file defining a component:
```typescript

import { ErrorMessage, Field, Form } from 'vee-validate'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    ErrorMessage,
    Field,
    Form
  }
})

```

3. Observe the type errors on ErrorMessage and Field components:



### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you seeing the problem on?

- [ ] Firefox
- [ ] Chrome
- [ ] Safari
- [ ] Microsoft Edge

### Relevant log output

_No response_

### Demo link

https://github.com/leondeklerkfenetre/vee-validate-playground

### Code of Conduct

- [X] I agree to follow this project's [Code of Conduct](CONDUCT.md)

---

## Top Comments

**@rs3d**:

I had the same issue.

After changing this **tsconfig.json** line 

```"composite": true,``` => ```"// composite": true,```


the error is gone.