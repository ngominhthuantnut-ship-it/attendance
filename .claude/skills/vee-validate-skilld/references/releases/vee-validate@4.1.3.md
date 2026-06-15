---
tag: vee-validate@4.1.3
version: 4.1.3
published: 2021-01-02
---

# vee-validate@4.1.3

####   Types

Now you can provide a value type to `useField`:

```typescript
const { value, resetField } = useField<string>('email', yup.string().email());

value.value = 1; // ⛔️  Error
value.value = 'test@example.com'; // ✅

resetField({
  value: 1, // ⛔️  Error
});
resetField({
  value: 'test@example.com', // ✅
});
```

It defaults to `any`, this also fixes the issue where the `value` prop is typed as `any`  when it should be `Ref<any>`