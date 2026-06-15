---
number: 2191
title: VeeValidate v3.0 
type: feature
state: closed
created: 2019-07-29
url: "https://github.com/logaretm/vee-validate/issues/2191"
reactions: 26
comments: 34
labels: "[ feature,  discussion,  breaking]"
---

# VeeValidate v3.0 

# VeeValidate 3.0

This is a draft implementation for version 3.0, which is mostly breaking in many ways but we will try to make it easier to migrate. The changes mostly affect directive usage and will have minimal effects on validation providers.

This document details all the changes done in `v3`.

> You can follow the implementation PR here #2153

> You can test the `v3` release with the `vee-validate-edge` npm package.

## Goals

The goals of this release are as following:

- Rewrite in TypeScript.
- `v-validate` directive deprecation.
- Overhaul the custom-rules/extension API.
- Overhaul the localization API.

### TypeScript

VeeValidate has been TypeScript-friendly for a very long time, but it had its shortcomings. Since it was maintained by contributors - a big shout out to you all - it often wasn't in sync with the actual code. Also, some typings were confusing because they were intended to be internal.

A TypeScript codebase will not only give us more confidence, but it will also communicate the intent of this library APIs clearly to TypeScript/JavaScript users.

Some aspects of vee-validate are impossible to Typecheck properly like the injected `errors` and `fields`. This is touched upon later.

### Directive Deprecation

This is the biggest breaking change and will certainly have some backlash against it, the directive, after all, has been the primary way to use vee-validate since `x.0` releases. Even `vee-validate` name is a pun for the `v-validate` directive.

But to list the directive problems:

- Requires global installation, tightly coupled to the rest of the library.
- Directives do not have props, so to pass stuff around we use `data-vv-*` attributes which aren't reactive, are repetitive and will add clutter your template. 
- Forces injected state `errors` and `fields` to be present.
- `v-if` and `v-for` caveats which aren't apparent to the developer at first glance.
- Validation Scope is limited within a single...

---

## Top Comments

**@logaretm** [maintainer] (+6):

vee-validate is out, looking forward to your feedback!

**@logaretm** [maintainer]:

@fessacchiotto You could use multiple observers and have them under one parent observer, which would give you what you need as you could check the whole state of the forms or individual tabs by checking each observer.

I will include this use-case in the docs as I think its fairly common.

You can use the current Provider/Observer components as they didn't change a lot in `v3`. Probably I will skip a beta version since I'm confident in `v3` production readiness.

**@Loremaster** (+4):

@logaretm is migration guide to version 3 available anywhere? I couldn't find it.