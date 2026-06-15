---
number: 4966
title: Dirty check doesn't work when resetForm values contains optional field
type: other
state: closed
created: 2024-12-22
url: "https://github.com/logaretm/vee-validate/issues/4966"
reactions: 6
comments: 7
---

# Dirty check doesn't work when resetForm values contains optional field

### What happened?

Consider a use case where user types something in the form and then moves to some other page but forgets to save. In this case it would be nice to show a confirmation dialog to the user to verify if they want to leave the page without saving.

In order to do this, I'm using `meta` object `dirty` value to check if at least one field's value has been changed. When the user lands on the page then initial data is fetched from the backend server. I'm using `resetForm` to update the values and reset meta state just like it's described in here https://vee-validate.logaretm.com/v4/guide/composition-api/handling-forms/#setting-initial-values-asynchronously. This works for most fields but sometimes there's no "dirty check" for some other fields.

### Reproduction steps

Open stackblitz demo link

1. Type something in the 3rd field. - "Dirty check" works as expected.
2. Press `Reset` button. - This mimics API request, sets values and resets meta state.
3. Type something in the 3rd field. - "Dirty check" doesn't work at all.

I've observed that when `field1` is `undefined` then the last field's "dirty check" doesn't work. When `field1` is something else than `undefined` then "dirty check" works for all fields. I've also observed that when the order of `formSchema`'s `field2` and `field3` is changed, then `field2` dirty check doesn't work anymore but `field3` dirty check works.

### Version

Vue.js 3.x and vee-validate 4.x

### What browsers are you...

---

## Top Comments

**@vonBrax** (+3):

I just stumbled upon this exact same issue today and I spent a few hours unsuccessfully trying to reproduce it until I found this issue, so thank you @sander96 for the demo link.

I have exactly the same use case as the author, which is a schema with some optional fields and async data that is set using `resetForm`, which caused the `dirty` check to stop working.

Looking at the source code, the problem seems to be on this line inside the `isEqual` function:

https://github.com/logaretm/vee-validate/blob/f8a82fc4f84a98f7881cb73a023f59a8051d69ab/packages/vee-validate/src/utils/assertions....

**@metalsadman** (+1):

I'm also having this same issue, also spent hours wondering why it's doing this, the problem is we have plenty of forms that rely on this, but now most of them are not detecting dirty states on some fields. My current workaround/hack is similar to @vonBrax solution which is a "dirty" (pun intended) solution atm. I hope @logaretm takes notice of this ticket. This use to work we just noticed started happening when our QA reported these issues.

**@joakimriedel**:

> Hi, any ETA on the release?

While waiting for an official release, what I did was to build vee-validate locally, put the compressed package in my source in a folder "local-packages" and refer to it as:

```
"vee-validate": "file:local-packages/vee-validate-4.15.1-beta.tgz"
```

... in my package.json. Not optimal but works well.