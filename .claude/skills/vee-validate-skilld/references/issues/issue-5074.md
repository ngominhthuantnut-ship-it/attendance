---
number: 5074
title: Types issues when using `setFieldValue` with arrays
type: other
state: open
created: 2025-08-06
url: "https://github.com/logaretm/vee-validate/issues/5074"
reactions: 5
comments: 0
---

# Types issues when using `setFieldValue` with arrays

### What happened?

When using path containing arrays notation (`array[${0}].something`) with `setFieldValue` value type is always set to `never`. 

Everything works as expected, it's just a typing issue.

### Reproduction steps

1. Create a dummy test component like: 
   ```vue
   <script lang="ts" setup>
   import * as z from 'zod'
   import { useForm } from 'vee-validate'
   
   const schema = z.object({
     value: z.string(),

     // will test on this array
     array: z.array(z.object({
       name: z.string(),
     })),
   })
   
   const { setFieldValue, values } = useForm({
     validationSchema: schema,
   })
  
   function doSomething() {
     // this resolves to `string` as expected
     setFieldValue(`value`, 'foobar')
   
     // this resolves to `{ name: string }[]` as expected
     setFieldValue(`array`, [{ name: 'foo' }])
   
     // this types resolve to `never`, whereas it should resolve to `{ name: string }`
     setFieldValue(`array[${0}]`, { name: 'qux' })
   
     // this types resolve to `never`, whereas it should resolve to `string`
     setFieldValue(`array[${2}].name`, 'baz')
   }
   </script>
   
   <template>
     <div>
       <button @click="doSomething">
         Do something
       </button>
       <pre>{{ values }}</pre>
     </div>
   </template>
   ```
  
2. Clicking on "Do something" button should resolve as expected:
   ```json
   {
     "value": "foobar",
     "array": [
       {
         "name": "qux"
       },
       null,
       {
         "name": "baz"
       }
     ]
   }
   ```...