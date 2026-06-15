---
number: 4995
title: Support Custom Validations for FieldArray fields
type: other
state: open
created: 2025-02-26
url: "https://github.com/logaretm/vee-validate/issues/4995"
reactions: 5
comments: 1
---

# Support Custom Validations for FieldArray fields

As of this moment, custom validator functions do not work with field arrays.

```
const validationSchema = {
    'fieldArray.*': validatorFn
}

const { meta, errors, setErrors, handleSubmit, setFieldValue } = useForm({
    validationSchema
})
```

The upper passage does not work.

I tried to work around this by just returning an array of `[null, null, 'Error here!']`, but the `errors` property returned by `useForm()` returns the first element/does not return the array at all:

```
function validateFieldArray(value) {
        let result = []

        for (let i = 0; i < value.length; i++) {
            if (!value[i].trim().length) {
                result[i] = 'This field is required!'
            }
        }

       console.log(result) // [empty, empty, 'This field is required!']

        // returning true means no error
        return !result.length ? true : result
}

const validationSchema = {
    fieldArray: validateFieldArray,
}

// errors object comes back empty {}
```

Requested Solution: implement support for custom validator functions (no yup/zod) for field arrays, or let `errors` object pass arrays as error messages



---

## Top Comments

**@Snurppa**:

And `initialValue`! 

Was surprised that it was not available — background story is big migration where using `useField`s as drop-in for old field components. We've been able to reduce some effort getting state for fields via `initialValue` in field level as form level initialValues is not currently possible and forced to do the migration bottom-top.

Also the custom validation functions would be great during this kind of migration.

So couple of views with repeating field have been slightly tricky to migrate as initialValue is missing from `useFieldArray`.