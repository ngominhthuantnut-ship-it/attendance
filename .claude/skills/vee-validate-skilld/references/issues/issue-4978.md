---
number: 4978
title: Dev tools memory leak in prod builds - consider make devtools opt-in?
type: other
state: closed
created: 2025-01-22
url: "https://github.com/logaretm/vee-validate/issues/4978"
reactions: 14
comments: 7
---

# Dev tools memory leak in prod builds - consider make devtools opt-in?

### What happened?

Hi we have recently had a major memory leak in our production Nuxt SSR application and after many hours debugging the culprit turned out to be vee-validate. See our application memory usage before and after fixing the vee-validate issue below.

<img width="810" alt="Image" src="https://github.com/user-attachments/assets/a41081a9-b5cb-4827-a371-cbed38d43802" />

I have seen a few other issues related to this such as  https://github.com/logaretm/vee-validate/issues/4963 and https://github.com/logaretm/vee-validate/issues/4972 which seem to suggest the issue was fixed in the latest 4.15 but it doesn't seem to be the case. 

In our specific case we did not have the environment variable NODE_ENV=production set at runtime so vee-validate was still running it's devtools specific code creating the DEVTOOLS_FORMS object that references thousands of components causing the leak. 

For anyone else experiencing this issue, **make sure you have NODE_ENV=production** set at runtime. 

Personally I think the dev tools integration should be opt-in to avoid this. We didn't have NODE_ENV=production set because doing so causes `pnpm i` to skip installing dev dependencies when Railway builds our Nuxt app, and its not clear from the documentation that this is very important env var to set if you don't want issues.

I think a better solution would be to only instantiate the devtools integration if NODE_ENV=dev or something similar. What do you think?




### Reproduction steps

...

---

## Top Comments

**@logaretm** [maintainer]:

AFAIK `NODE_ENV!=production` check is a standard across the JS ecosystem, you can find it in most packages like Pinia. 

> DEVTOOLS_FORMS object that references thousands of components causing the leak.

Perhaps we can drop the registration logic when the app is running in SSR since it is not useful there anyways. I will see what I can do.

**@fs-public**:

@logaretm Adding my two cents here, this vee-validate issue completely breaks builds on Netlify with latest Nuxt. See https://github.com/nuxt/nuxt/issues/30798 and related. Adding `NODE_ENV` to environment variables on a serverless SaaS is non-standard to fix IMHO.

**@PatrikBird** (+1):

Dear @logaretm 

There is a workaround, but a release that fixes the memory leak would be very helpful for users, if it’s not too much trouble. Thanks for all your work 