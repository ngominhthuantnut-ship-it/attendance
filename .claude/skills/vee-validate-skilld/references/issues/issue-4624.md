---
number: 4624
title: Issue with dynamic validation schema when initial schema is undefined
type: other
state: open
created: 2024-01-03
url: "https://github.com/logaretm/vee-validate/issues/4624"
reactions: 7
comments: 0
---

# Issue with dynamic validation schema when initial schema is undefined

### What happened?

I am encountering a peculiar behavior when using a computed property for the form validation schema. I'm trying to build a form that takes a dynamic validation schema, which is defined as a computed property. This setup generally functions well, with one notable exception.

**Observed Behavior:**

**Functional state with defined initial schema**: When the validation schema is initially defined (i.e., it has an initial value when the form is first rendered), the form and its validation work as expected. 

**Problematic state with undefined initial schema:** When the initial validation schema is not defined (i.e., the schema starts as undefined), the validation behaves differently compared to when the schema is initially set. 

**Non-triggering of validation on schema change:** When the validation schema is changed from an **undefined** state to a **defined** one, the form's validation does not trigger automatically. This is in contrast to the behavior observed when the **initial** schema is **defined**, where validation triggers as expected when the schema changes.

Also, this behavior occurs without any typing errors, warnings, or apparent issues in the console, making it quite difficult to diagnose the problem. It took me some time to figure this out. I assume this is not expected behaviour?

It's probably easier to check the reproduction link:

**Reproduction Link:** I have created a minimal reproduction of this issue: [StackBlitz Repro...