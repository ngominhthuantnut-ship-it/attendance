---
number: 5027
title: Support for Zod 4
type: other
state: closed
created: 2025-04-18
url: "https://github.com/logaretm/vee-validate/issues/5027"
reactions: 25
comments: 5
---

# Support for Zod 4

> I'm posting this issue to all the libraries currently listed in the Ecosystem section of Zod's README. Apologies for the spam! Zod 4 is a big release and it's important to get as much of the ecosystem migrated as possible! 

## Zod 4 is now in beta

Hello! Colin here, creator of Zod. Thank you for contributing this package to the Zod ecosystem! 

FYI, the first beta of Zod 4 has been released. It will be in beta for 4 weeks to allow time for ecosystem libraries (such as yours) to implement support before the first stable version is released. The first stable release will be in mid-May. Keep an eye on this PR to track progress: https://github.com/colinhacks/zod/pull/4074 

Announcement post: https://v4.zod.dev/v4
Migration guide: https://v4.zod.dev/v4/changelog

 **Note** — To avoid confusion and outdated information, the Ecosystem page for Zod 4 is starting from scratch. You'll need to implement support for Zod 4 (guidance below). Once you've done that, submit a PR adding yourself to this file: https://github.com/colinhacks/zod/blob/v4/packages/docs/components/ecosystem.tsx

### Migration 

There have been some significant changes.

- A new library `@zod/mini` has been released with a treeshakable/functional API that mirrors Zod's
- To facilitate code sharing between `zod` and `@zod/mini`, they both have a dependency on a new common core library `@zod/core`. 
- This new package implements the schema subclasses that are then extended by `zod` and `@zod/mini` (and potentially future libraries). It makes it easy to support all these libraries simultaneously, with just one peerDependency on your end. There is little reason for any framework/library to depend directly on `zod` anymore. 

```
pnpm install @zod/core@^0.0.1
```

This page is intended as a jumping-off point with some guidance for library authors: `@zod/core` docs

Don't hesitate to reach out for help/guidance! 

...

---

## Top Comments

**@awacode21** (+39):

We would like to update to zod 4 but we are using vee validate which currently is preventing us from updating as it does not support zod 4. When will the support be available?

**@colinhacks** (+17):

Here's a dedicated guide for library authors that answers some common questions: https://v4.zod.dev/library-authors

1. Best practices around peer dependencies
2. How to support Zod v3 and Zod v4 simultaneously
3. How to support Zod & Zod Mini without extra work

Note that the `@zod/core` package has been abandoned in favor of a subpath: `zod/v4/core`. This makes it much easier for libraries with build on top of Zod with a single peer dependency on `"zod"`. The reasons for this change are explained in more detail in the beta announcement: https://v4.zod.dev/v4 

...

**@hyshka** (+17):

Zod 4 is now stable. We can update the title of this issue to reflect that.