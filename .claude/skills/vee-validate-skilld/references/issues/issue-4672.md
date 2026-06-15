---
number: 4672
title: Error message localization is not reactive (`setLocale`, `@vee-validate/i18n`, and `vue-i18n`)
type: other
state: closed
created: 2024-02-21
url: "https://github.com/logaretm/vee-validate/issues/4672"
reactions: 6
comments: 12
---

# Error message localization is not reactive (`setLocale`, `@vee-validate/i18n`, and `vue-i18n`)

### What happened?

Error messages are not reactive to locale changes like they used to be in v2. We need this functionality because we have a global locale selector button that changes the app locale. When the form is dirty and they change the locale, we need to still show the validation error messages without resetting the validation state.

There was a similar closed issue: https://github.com/logaretm/vee-validate/issues/3876 , but I don't agree with the conclusion that it's a rare scenario and our application needs this as per our product's requirements.

It would be ideal if there was a way to pass the reactive `locale` from `vue-i18n` or any source really and have `vee-validate` watch that ref for changes, and when it changes it would switch locales. Currently, the `setLocale` function from `@vee-validate/i18n` does not suffice.

### Reproduction steps

1. Install dependencies
**dependencies**: `@vee-validate/i18n`, `@vee-validate/rules`, `vue`, `vue-i18n`, `vee-validate`
**devDependencies**: `@vitejs/plugin-vue`, `typescript`, `vite`, `vue-tsc`

2. main.ts
    ```ts
    import { createApp } from 'vue';
    import { configure, defineRule } from 'vee-validate';
    import * as rules from '@vee-validate/rules';
    import { localize } from '@vee-validate/i18n';
    import { setLocale } from '@vee-validate/i18n';
    import en from '@vee-validate/i18n/dist/locale/en.json';
    import es from '@vee-validate/i18n/dist/locale/es.json';
    import App from './App.vue';
    import i18n from './i18n';
    
    defineRule('required', rules.required);
    
    configure({
      generateMessage: localize({
        en,
        es,
      }),
    });
    
    setLocale('en');
    
    const app = createApp(App);
    app.use(i18n);
    
    app.mount('#app');
    ```...