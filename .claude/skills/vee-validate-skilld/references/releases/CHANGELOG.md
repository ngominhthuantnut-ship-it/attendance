# Change Log

## 4.15.1

### Patch Changes

- 721e980: Align FormErrors type with its actual structure at runtime.
- 546d82e: fix: normalize objects before equality checks closes #5006

## 4.15.0

### Patch Changes

- 30281f5: fix: lazy load the devtools dep to force it out of production bundle
- ec121b1: fix: skip loading devtools if in SSR

## 4.14.7

### Patch Changes

- be994b4: fix: show uncontrolled field info in devtools closes #4914

## 4.14.6

## 4.14.5

### Patch Changes

- e9f8c88: fix: force loading the mjs module when using nuxt

## 4.14.4

### Patch Changes

- f33974c: fix(types): expose field and form slot prop types closes #4900
- 0991c01: fix: devtools crashing when a field name is defined as getter
- ecb540a: fix: handle getter field names properly closes #4877
- 4f88d85: fix: specify module type on package.json

## 4.14.3

### Patch Changes

- 07c27d5: fix: remove rogue console.log

## 4.14.2

### Patch Changes

- f0d4e24: fix: upgrade vue devtools dependency version closes #4863

## 4.14.1

## 4.14.0

### Minor Changes

- 404cf57: chore: bump release

### Patch Changes

- f7a4929: feat: expose useFormContext closes #4490
- 97cebd8: chore: add 'exports' field in package.json for all packages
- 421ae69: "fix(types): export component internal types"

## 4.13.2

### Patch Changes

- afbd0e5: feat: support valibot 0.33.0

## 4.13.1

## 4.13.0

### Minor Changes

- 454bc45: fix: force resetForm should not merge values closes #4680 closes #4729
- 27fe5c8: feat: provide form values as context for yup closes #4753

### Patch Changes

- ae3772a: feat: expose setValue on Field instance and slot props closes #4755
- fd008c1: feat: added ResetFormOpts arg to useResetForm closes #4707

## 4.12.8

### Patch Changes

- f8bab9c: "fix: field-level validation not working with typed scheams closes #4744"

## 4.12.7

### Patch Changes

- 1376794: fix: handle meta.required for single field schemas closes #4738
- 1376794: fix: add try-catch for schema description logic across all major schema providers
- c4415f8: fix: ensure meta.required is reactive whenever the schema changes closes #4738

## 4.12.6

### Patch Changes

- 07d01fd: fix: re-apply errors to avoid race conditions

## 4.12.5

### Patch Changes

- d779980: fix: make sure removePathState removes the correct path state
- 9eda544: "fix: remove event arg from define field handlers for component compat closes #4637"

## 4.12.4

### Patch Changes

- 2a09a58: "fix: check if both source and target objects are POJOs"

## 4.12.3

### Patch Changes

- 72e4379: fix: remove deep data mutation warning closes #4597
- a18c19f: feat: allow path meta querying for nested fields closes #4575
- e2171f8: feat: expose some state on form instance

## 4.12.2

### Patch Changes

- b2203c8e: fix: apply schema casts when submitting closes #4565
- ec8a4d7e: fix: defineField should respect global validateOnModelUpdate closes #4567

## 4.12.1

### Patch Changes

- 36f6b9e6: fix: reset form and field behaviors for unspecified values closes #4564
- c1c6f399: fix: unref initial values when initializing the form closes #4563

## 4.12.0

### Minor Changes

- bbecc973: feat: deprecate reactive initial values closes #4402

### Patch Changes

- f9a95843: feat: add label support to defineField closes #4530
- f688896f: fix: avoid overriding paths and destroy path on remove closes #4476 closes #4557
- 2abb8966: fix: clone values before reset closes #4536
- e370413b: fix: handle hoisted paths overriding one another
- 95b701f7: feat: allow getters for field arrays

## 4.11.8

### Patch Changes

- d1b5b855: fix: avoid triggering extra model value events closes #4461
- 78c4668e: feat: allow null as a valid Form prop type closes #4483

## 4.11.7

### Patch Changes

- a1414f6a: fix: export ModelessBinds type closes #4478

## 4.11.6

### Patch Changes

- f683e909: fix(types): infer the model value prop name correctly

## 4.11.5

### Patch Changes

- 27c9ef24: feat(types): stronger define component bind types closes #4421
- 804ec6fa: fix: use flags to avoid validating during reset #4404 #4467

## 4.11.4

### Patch Changes

- 4d8ed7eb: feat: added reset opts to force values closes #4440
- b53400e2: fix: silent validation should not mark a field as validated
- 8f680bf1: fix: clone the schema object before validating closes #4459
- 5231f439: fix: respect validate on model update configuration closes #4451, closes #4467

## 4.11.3

## 4.11.2

### Patch Changes

- 2ff045c1: fix: do not warn if a form or a field was resolved closes #4399
- 73219b40: feat: expose all internal types
- 4947e88f: feat: expose BaseInputBinds and BaseComponentBinds interfaces #4409
- ecbb690d: feat: query fields meta state

## 4.11.1

### Patch Changes

- 5e23dcb9: fix: add support for parsing range inputs

## 4.11.0

### Minor Changes

- 2d8143f9: feat: added composition setter functions

## 4.10.9

### Patch Changes

- c02337f3: fix: correct the setErrors type to allow for string[]

## 4.10.8

### Patch Changes

- a9a473b4: feat(perf): improve performance setFieldError and setFieldValue closes #4382

## 4.10.7

### Patch Changes

- 9290f5a9: fix: clone values inserted into field arrays closes #4372
- 93f8001a: fix: do not warn if the validation is for removed paths closes #4368

## 4.10.6

### Patch Changes

- 40ce7a91: feat: expose normalizeRules closes #4348
- e9b215a7: fix: resetForm should cast typed schema values closes #4347
- 4e11ff95: fix: validate form values on setValues by default closes #4359
- e354a13a: fix: Normalize error paths to use brackets for indices closes #4211
- 68080d28: feat: use silent validation when field is initialized closes #4312

## 4.10.5

### Patch Changes

- 6a1dc9bd: fix: component blur event and respect model update config closes #4346

## 4.10.4

### Patch Changes

- 2f9ca91c: fix(types): remove deep readonly type for now

## 4.10.3

### Patch Changes

- 32537e14: fix: less strict object checks for undefined and missing keys closes #4341
- c3698f07: fix: respect model modifiers when emitting the value closes #4333

## 4.10.2

### Patch Changes

- 1660048e: fix: define binds not respecting config events

## 4.10.1

### Patch Changes

- fc416918: fix: handle NaN when parsing number inputs closes #4328
- 435e7857: fix: reset present values after all path mutation
- 273cca74: fix: reset field should not validate closes #4323

## 4.10.0

### Minor Changes

- 7a548f42: chore: require vue 3.3 and refactor types
- 7ce9d671: feat(breaking): disable v-model support by default closes #4283
- bfd6b00a: "feat: allow custom models for defineComponentBinds"
- d4fafc95: "feat: allow handleBlur to run validations"
- 05d957ec: feat: mark form values as readonly closes #4282

### Patch Changes

- 77345c42: fix: reset form should merge values closes #4320
- f1dc1359: fix: use event value if no checked value for checkbox/radio closes #4308
- 3e4a7c13: feat(dx): make `syncVModel` accept the model propName
- 2cf0eec9: feat: allow multiple messages in a validator fn closes #4322 #4318
- ed208918: fix: trigger validation with setFieldValue by default closes #4314
- 6a3f9f15: fix: parse native number fields closes #4313

## 4.9.6

### Patch Changes

- b138282a: fix(types): export SetFieldValueOptions interface closes #4290
- 6e074f77: fix: handleBlur should respect blur validate config closes #4285

## 4.9.5

### Patch Changes

- 7356c102: fix: setFieldError should set meta.valid closes #4274

## 4.9.4

### Patch Changes

- f4ea2c05: fix: exclude undefined and null from initial values closes #4139

## 4.9.3

### Patch Changes

- 09d5596b: fix: run validation on value change closes #4251
- 9bfbfaaf: feat: added isValidating to useForm
- 48b45d91: fix: hoist nested errors path to the deepest direct parent closes #4063

## 4.9.2

### Patch Changes

- 31090e0d: avoid double unset path with field array remove
- 9046308b: fixed validations running for unmounted fields
- fe322a07: batch unsets and sort paths unset order for safer unsets closes #4115

## 4.9.1

### Patch Changes

- 681bbab4: Added type-fest to core package dependencies

## 4.9.0

### Minor Changes

- 41b5d39b: Implemented path types into various form API functions
- 95409080: Added component and input binds helpers

### Patch Changes

- 7554d4a6: fix field array triggering validation when an item is removed
- 298577b7: setValues does not delete unspecified fields values

## 4.8.6

### Patch Changes

- 6e0b0557: Introduced official nuxt module package

## 4.8.5

### Patch Changes

- 9048a238: fixed zod union issues not showing up as errors closes #4204

All notable changes to this project will be documented in this file.
See Conventional Commits for commit guidelines.

## 4.8.4 (2023-03-24)

### Bug Fixes

- make initial values partial closes #4195 (eeccd0c)
- properly unref the schema before checking for default values closes #4196 (8e3663d)

### Features

- allow name ref to be a lazy function (8fb543a)

## 4.8.3 (2023-03-15)

**Note:** Version bump only for package vee-validate

## 4.8.2 (2023-03-14)

### Bug Fixes

- do not use name as a default label for useField closes #4164 (d5acff7)

## 4.8.1 (2023-03-12)

### Bug Fixes

- make sure to have a fallback for undefined casts closes #4186 (9f1c63b)

### Features

- expose errorBag to  slot props (371744e)

# 4.8.0 (2023-03-12)

### Bug Fixes

- finally handicap yup schema resolution (303b1fb)
- initial sync with v-model if enabled closes #4163 (1040643)
- properly aggregrate nested errors for yup (7f90bbc)
- remove console.log from devtools integration (3c2d51c)
- remove yup schema type and rely on assertions (5cbb913)
- render zod multiple errors in nested objects closes #4078 (f74fb69)
- run silent validation after array mutations closes #4096 (044b4b4)
- type inference fix (ac0383f)
- watch and re-init array fields if form data changed closes #4153 (6e784cc)

### Features

- Better Yup and Zod typing with output types and input inference (#4064) (3820a5b)
- export type `FieldState` (#4159) (69c0d12)

## 4.7.4 (2023-02-07)

### Bug Fixes

- pass the field label as a seperate value closes #4097 (89f8689)

### Features

- **#4117:** add resetField on Form/useForm (#4120) (87c4278), closes #4117
- expose state getters on the form instance via template refs (#4121) (7f1c39c)

## 4.7.3 (2022-11-13)

### Bug Fixes

- use cloned value when setting field value closes #3991 (90b61fc)

## 4.7.2 (2022-11-02)

### Bug Fixes

- don't mutate validated meta when silent validation closes #3981 closes #3982 (6652a22)

## 4.7.1 (2022-10-23)

### Bug Fixes

- clean up single group value after unmount closes #3963 (#3972) (8ccfd2b)
- correctly mutate deep field array item and trigger validation (#3974) (267736f)
- mark slot prop field value as any closes #3969 (#3973) (70ddc5b)

# 4.7.0 (2022-10-09)

### Features

- allow passing form control to useField closes #3204 (#3923) (4c59d63)
- expose controlled values on useForm (#3924) (2517319)

## 4.6.10 (2022-09-30)

### Bug Fixes

- use ssr safe file check (56663aa)

## 4.6.9 (2022-09-19)

### Bug Fixes

- perform field reset before all values reset closes #3934 (1c016d9)

## 4.6.8 (2022-09-19)

### Bug Fixes

- ensure validation if we skip checkbox value setting #3927 (#3930) (82d05db)
- extend is equal with file comparison logic #3911 (#3932) (c7c806c)
- handle nested value change validation #3926 (#3929) (771e7f2)

### Features

- expose RuleExpression type closes #3913 (cdaf22d)

## 4.6.7 (2022-08-27)

### Bug Fixes

- allow generics for generic function type (91e97aa)
- handle validation races for async validations (#3908) (8c82079)

## 4.6.6 (2022-08-16)

### Bug Fixes

- return value if no model modifiers are defined closes #3895 (#3896) (6ab40df)

## 4.6.5 (2022-08-11)

### Bug Fixes

- reset the original value when resetField is called #3891 (#3892) (7113dcc)

## 4.6.4 (2022-08-07)

### Bug Fixes

- make sure to deep watch created models by useFieldModel (fbe273c)

## 4.6.3 (2022-08-07)

### Features

- Expose InvalidSubmissionHandler and GenericValidateFunction types (#3853) (3ccf27d)

## 4.6.2 (2022-07-17)

### Bug Fixes

- avoid toggling field array checkboxes values closes #3844 (fffad4b)

### Features

- expose field and form options closes #3843 (7437612)

## 4.6.1 (2022-07-12)

### Bug Fixes

- pass onInvalidSubmit prop to submitForm closes #3841 (b6cf543)

# 4.6.0 (2022-07-11)

### Bug Fixes

- added existing undefined path fallback closes #3801 (fd0500c)
- avoid inserting value binding for file type inputs closes #3760 (3c76bb2)
- avoid validating when field instance exists (3759df2)
- compare form meta.dirty based on original values than staged initials closes #3782 (f3ffd3c)
- expose ValidationOptions type closes #3825 (9854865)
- exposed component APIs to their TS defs with refs closes #3292 (ae59d0f)
- fast equal before deciding value was changed closes #3808 (3d582ec)
- use multiple batch queues for both validation modes closes #3783 (6156603)

### Features

- **4.6:** Allow mutating field array iterable's value property (#3618) (#3759) (c3c40e5)
- add move to FieldArray (a52f133)
- added unsetValueOnUnmount config (#3815) (e6e1c1d)
- added useFieldModel to useForm API (26c828e)
- allow keep values config to be reactive (5009bd8)
- better normalization for native input file events (2751552)
- Remove yup type dependency (#3704) (e772f9a)
- Sync useField with component v-model (#3806) (0ef7582)

## 4.5.11 (2022-04-10)

### Bug Fixes

- ignore validation of removed array elements closes #3748 (3d49faa)

### Features

- chain of GenericValidateFunction in useField (#3725) (#3726) (8db4077)

## 4.5.10 (2022-03-08)

**Note:** Version bump only for package vee-validate

## 4.5.9 (2022-02-22)

### Bug Fixes

- mark fields validated via form validate as validated (ad9fa9d)

## 4.5.8 (2022-01-23)

### Bug Fixes

- clear old error path error when changing field name closes #3664 (f736e62)
- field array swap not working when falsy values are present at paths (40afbd9)

## 4.5.7 (2021-12-07)

### Bug Fixes

- always attach model update event closes #3583 (6a53e80)

## 4.5.6 (2021-11-17)

### Bug Fixes

- corrected the typing for the resetField function closes #3568 (4e9460e)
- new devtools typings (f288ca5)
- use watchEffect to compute form meta closes #3580 (e8729dc)

## 4.5.5 (2021-11-01)

### Bug Fixes

- prevent toggle checkboxes when form resets closes #3551 (cad12ba)

## 4.5.4 (2021-10-20)

**Note:** Version bump only for package vee-validate

## 4.5.3 (2021-10-17)

### Features

- added slot typings for components closes #3534 (#3537) (52a2a38)

## 4.5.2 (2021-09-30)

### Bug Fixes

- use klona/full mode to handle luxon values closes #3508 (048c9c0)

## 4.5.1 (2021-09-29)

**Note:** Version bump only for package vee-validate

# 4.5.0 (2021-09-26)

**Note:** Version bump only for package vee-validate

## 4.4.11 (2021-09-11)

### Bug Fixes

- dynamic rule forcing validation closes #3485 (d3f0fc0)

## 4.4.10 (2021-08-31)

### Bug Fixes

- added silent validation run after reset closes #3463 (a61f7ab)
- handle absent model value closes #3468 (2c4a7ff)
- **types:** remove arguments of PrivateFieldContext.handleReset (2e45d1f)
- ensure option bound value type is preserved closes #3440 (b144615)

## 4.4.9 (2021-08-05)

### Bug Fixes

- ensure to clone user passed values in setters closes #3428 (a720c24)
- prioritize the current value if another field of same name is mounted closes #3429 (cf036ec)

## 4.4.8 (2021-07-31)

**Note:** Version bump only for package vee-validate

## 4.4.7 (2021-07-20)

### Bug Fixes

- avoid watching values at the end of reset calls closes #3407 (86f594f)

### Features

- add standalone prop for fields (#3379) (3689437)
- expose FieldContext type closes #3398 (a6e4c0a)
- expose form and field injection keys (6034e66)

## 4.4.6 (2021-07-08)

### Bug Fixes

- clean error message for singular fields after unmount (#3385) (4e81cce)
- quit unsetting path if its already unset (cfe45ba)
- expose setters in composition API (d79747d)

## 4.4.5 (2021-06-13)

## 4.4.4 (2021-06-05)

### Bug Fixes

- field with pre-register schema errors should be validated on register closes #3342 (61c7359)
- make sure to create the container path if it exists while null or undefined (79d3779)
- make sure to create the container path if it exists while null or undefined (79d3779)

### Features

- expose setters in composition API (61f942f)

## 4.4.3 (2021-06-02)

### Bug Fixes

- respect the Field bails option closes #3332 (6679387)

## 4.4.2 (2021-05-28)

### Bug Fixes

- clean up the old values path when fields exchange names fixes #3325 (fe51c12)

## 4.4.1 (2021-05-24)

### Bug Fixes

- forgot adding errors in useValidationForm (d032d3b)
- re-introduce the errors prop back on the form validation result closes #3317 (b439a73)

# 4.4.0 (2021-05-23)

### Bug Fixes

- seperate model detection from event emitting closes #3312 (5e72852)

# 4.4.0-alpha.2 (2021-05-14)

### Bug Fixes

- avoid clearing all errors before validating schema (51c2e78)

# 4.4.0-alpha.1 (2021-05-14)

### Bug Fixes

- minifier issue when handling await (f206cac)

# 4.4.0-alpha.0 (2021-05-14)

### Bug Fixes

- deprecate handleInput and use handleChange for both events (#3303) (4cb10de)

### Features

- custom values and errors (#3305) (427802b)

## 4.3.6 (2021-05-08)

### Bug Fixes

- added a symbol to detect non passed props with Vue 3.1.x (#3295) (0663539)

## 4.3.5 (2021-05-01)

### Bug Fixes

- priotrize self injections over parent injections closes #3270 (07c1234)

## 4.3.4 (2021-04-27)

### Bug Fixes

- update the valid flag regardless of mode closes #3284 (6594ad1)

## 4.3.3 (2021-04-22)

### Features

- touch all fields on submit (#3278) (fc4e400)

## 4.3.2 (2021-04-21)

### Bug Fixes

- unwrap initial value with useField.resetField fixes #3272 (#3274) (f6e9574)

## 4.3.1 (2021-04-18)

### Bug Fixes

- give error message component a name (b7dcebf)
- minor perf enhancement by lazy evaulation of slot props (a306b1b)

# 4.3.0 (2021-04-07)

### Features

- added support for reactive schemas (#3238) (295d656)
- added support for setting multiple field errors closes #3117 (db0a6a0)
- support v-model.number (#3252) (8f491da)

## 4.2.4 (2021-03-26)

### Bug Fixes

- validation triggered on value change (10549b7)

## 4.2.3 (2021-03-22)

### Bug Fixes

- prevent yup schema from setting non-interacted fields errors closes #3228 (534f8b2)

## 4.2.2 (2021-03-03)

### Bug Fixes

- ensure having a truthy fallback for fields missing in schema (7cd6941)
- handle pending validation runs during field unmounting (ef5a7cc)

## 4.2.1 (2021-02-26)

### Bug Fixes

- added initial check against the field errors (4288fb6)

# 4.2.0 (2021-02-24)

**Note:** Version bump only for package vee-validate

## 4.1.20 (2021-02-24)

### Bug Fixes

- avoid setting checkbox values before registeration closes #3183 (ab5f821)
- change errors source to form closes #3177 (7c13c92)
- use the issues array for zod error aggregation closes #3184 (01b89e4)

## 4.1.19 (2021-02-16)

### Bug Fixes

- use relative imports for shared type (6790545)

### Features

- improve typing for field yup schema (c59f1f0)

## 4.1.18 (2021-02-10)

### Bug Fixes

- avoid unsetting field value if switched with another closes #3166 (f5a79fe)

## 4.1.17 (2021-02-08)

### Bug Fixes

- add a handler for regex object params closes #3073 (7a5e2eb)
- added emits and onSubmit custom prop (#3115) (8f2c110)
- array radio fields not switching value correctly closes #3141 (3d4efef)
- avoid returning undefined for form errors when form does not exist (8cce17a)
- avoid validating dependencies via watcheffect closes #3156 (a7b91f6)
- cast radio buttons value correctly closes #3064 (3e0f9a4)
- clear out initial values for unregistered fields closes #3060 (56206de)
- correctly set the initial value from the v-model closes #3107 (4bed9a8)
- export submission types #3112 (3f35167)
- fill the target rule params for message generators closes #3077 (f5e1bd3)
- handle formless checkboxes value toggling closes #3105 (504f30b)
- handle reactive field names and value swaps (cf8051d)
- missing export for useErrors helpers (28537cc)
- pass down listeners to the input node closes #3048 (2526a63)
- prevent default reset behavior with handleReset (a66df13)
- prevent resetForm from toggling checkbox value #3084 (38778f9)
- react to validation events changes (078e61b)
- reset meta correctly with resetField (012658c)
- resolve component before rendering closes #3014 (f8f481d)
- resolve path values with global rules closes #3157 (beaf316)
- set field initial value on the fid lookup closes #3128 (650d5cf)
- support dynamic labels closes #3053 (31b2238)
- typing issue from #3134 (29e5cff)
- use the custom injection fn for initial field values (38cd32b)

### Features

- add submit count state (#3070) (a7fe71e)
- added context awareness to composition helpers for fields (b59fe88)
- added context information to validation functions (7e6675d)
- added test cases and fallbacks for unresolved cases (71bda03)
- added the useResetForm helper (4c57715)
- added unchecked-value prop to the field component (af910c3)
- added useErrors and useField error helpers (4cda2fe)
- added useIsDirty helpers (6b7e4ab)
- added useIsSubmitting helper (7a58fd8)
- added useIsTouched helpers (fdb2d5a)
- added useIsValid helpers (26fbb29)
- added useSubmitCount helper (c4a6dea)
- added useSubmitForm hook (#3101) (d042882)
- added useValidateField and useValidateForm helpers (62355a8)
- added validate field function to form and useForm (#3133) (926bed1)
- added validate method on the form ref instance closes #3030 (ed0faff)
- added validation trigger config per component closes #3066 (f0e30a2)
- added value change support for native multi select (#3146) (0601586)
- added values helpers (e0f16d6)
- added warnings for non existent fields and allow reactive paths (4182d2f)
- avoid watching rules when passed as functions (539f753)
- dont render any tags when no message exists closes #3118 (92eba41)
- enhance ts typing for form functions (8f7d8e8)
- enhance useField types (dcb8049)
- enrich form validation results (0c84c80)
- export some internal types closes #3065 (b88dffd)
- field.reset() should reset the field to its initial value (a11f1b7)
- implement similar reset API for fields (38c3923)
- new reset API (6983738)
- rename reset methods to be more consistent (3a0dc4d)
- update docs (0f5ac98)
- use internal yup types (#3123) (7554bfc)
- use resolveDynamicComponent instead (f1b5f89)

### Performance Improvements

- cache field props in a computed property (d266878)
- cache form slot props in a computed property (49fa2c1)

## 4.1.16 (2021-02-07)

**Note:** Version bump only for package vee-validate

## 4.1.15 (2021-02-07)

### Bug Fixes

- resolve path values with global rules closes #3157 (beaf316)

## 4.1.14 (2021-02-06)

### Bug Fixes

- avoid validating dependencies via watcheffect closes #3156 (a7b91f6)

## 4.1.13 (2021-02-01)

### Features

- added value change support for native multi select (#3146) (0601586)

## 4.1.12 (2021-01-26)

### Bug Fixes

- array radio fields not switching value correctly closes #3141 (3d4efef)
- clear out initial values for unregistered fields closes #3060 (56206de)
- typing issue from #3134 (29e5cff)

## 4.1.11 (2021-01-19)

### Features

- added validate field function to form and useForm (#3133) (926bed1)

## 4.1.10 (2021-01-17)

### Bug Fixes

- set field initial value on the fid lookup closes #3128 (650d5cf)

## 4.1.9 (2021-01-13)

### Features

- use internal yup types (#3123) (7554bfc)

## 4.1.8 (2021-01-12)

### Features

- dont render any tags when no message exists closes #3118 (92eba41)

## 4.1.7 (2021-01-12)

### Bug Fixes

- export submission types #3112 (3f35167)

## 4.1.6 (2021-01-11)

### Bug Fixes

- added emits and onSubmit custom prop (#3115) (8f2c110)

## 4.1.5 (2021-01-05)

### Bug Fixes

- correctly set the initial value from the v-model closes #3107 (4bed9a8)

## 4.1.4 (2021-01-04)

### Bug Fixes

- handle formless checkboxes value toggling closes #3105 (504f30b)

## 4.1.3 (2021-01-02)

### Features

- enhance useField types (dcb8049)

## 4.1.2 (2020-12-26)

### Features

- added useSubmitForm hook (#3101) (d042882)

## 4.1.1 (2020-12-18)

### Bug Fixes

- missing export for useErrors helpers (28537cc)

# 4.1.0 (2020-12-18)

### Bug Fixes

- avoid returning undefined for form errors when form does not exist (8cce17a)

### Features

- added context awareness to composition helpers for fields (b59fe88)
- added test cases and fallbacks for unresolved cases (71bda03)
- added the useResetForm helper (4c57715)
- added useErrors and useField error helpers (4cda2fe)
- added useIsDirty helpers (6b7e4ab)
- added useIsSubmitting helper (7a58fd8)
- added useIsTouched helpers (fdb2d5a)
- added useIsValid helpers (26fbb29)
- added useSubmitCount helper (c4a6dea)
- added useValidateField and useValidateForm helpers (62355a8)
- added values helpers (e0f16d6)
- added warnings for non existent fields and allow reactive paths (4182d2f)
- enhance ts typing for form functions (8f7d8e8)
- enrich form validation results (0c84c80)
- export some internal types closes #3065 (b88dffd)

## 4.0.7 (2020-12-18)

### Bug Fixes

- react to validation events changes (078e61b)

## 4.0.6 (2020-12-15)

### Bug Fixes

- prevent default reset behavior with handleReset (a66df13)
- prevent resetForm from toggling checkbox value #3084 (38778f9)

### Features

- added unchecked-value prop to the field component (af910c3)

### Performance Improvements

- cache field props in a computed property (d266878)
- cache form slot props in a computed property (49fa2c1)

## 4.0.5 (2020-12-12)

### Features

- added validation trigger config per component closes #3066 (f0e30a2)

## 4.0.4 (2020-12-09)

### Bug Fixes

- add a handler for regex object params closes #3073 (7a5e2eb)
- fill the target rule params for message generators closes #3077 (f5e1bd3)

### Features

- add submit count state (#3070) (a7fe71e)

## 4.0.3 (2020-12-05)

### Bug Fixes

- cast radio buttons value correctly closes #3064 (3e0f9a4)
- reset meta correctly with resetField (012658c)
- use the custom injection fn for initial field values (38cd32b)

## 4.0.2 (2020-11-27)

### Bug Fixes

- support dynamic labels closes #3053 (31b2238)

## 4.0.1 (2020-11-25)

### Bug Fixes

- pass down listeners to the input node closes #3048 (2526a63)

# 4.0.0 (2020-11-16)

### Features

- added validate method on the form ref instance closes #3030 (ed0faff)
- update docs (0f5ac98)

# 4.0.0-beta.19 (2020-11-07)

### Bug Fixes

- resolve component before rendering closes #3014 (f8f481d)

### Features

- field.reset() should reset the field to its initial value (a11f1b7)
- implement similar reset API for fields (38c3923)
- new reset API (6983738)
- rename reset methods to be more consistent (3a0dc4d)
- use resolveDynamicComponent instead (f1b5f89)

# 4.0.0-beta.18 (2020-11-05)

### Bug Fixes

- handle reactive field names and value swaps (cf8051d)

### Features

- avoid watching rules when passed as functions (539f753)

# 4.0.0-beta.17 (2020-11-04)

### Features

- added context information to validation functions (7e6675d)

# 4.0.0-beta.16 (2020-10-29)

### Features

- initial form meta (#3003) (f7fd407)

# 4.0.0-beta.15 (2020-10-28)

### Features

- add `initialErrors` prop (#3002) (9850b3f)

# 4.0.0-beta.14 (2020-10-26)

### Features

- deprecate the disabled prop (29f4dca)
- use injection keys to type inject API (79207b2)

# 4.0.0-beta.13 (2020-10-23)

### Features

- `useForm` Field types (#2996) (727f229)

# 4.0.0-beta.12 (2020-10-21)

### Bug Fixes

- upgrade to Vue 3.0.2 and fix broken cases (ede7214)

# 4.0.0-beta.11 (2020-10-18)

### Bug Fixes

- provide yup object schema type to the useForm closes #2988 (29157f7)

# 4.0.0-beta.10 (2020-10-15)

### Bug Fixes

- properly initialize initial values closes #2978 (c0ba699)
- typos in test descriptions (#2970) (a0132df)

# 4.0.0-beta.9 (2020-10-14)

### Bug Fixes

- improve useForm meta types (#2963) (6b46047)

### Features

- meta setters (#2967) (5036e13)

# 4.0.0-beta.8 (2020-10-12)

### Features

- added handleInput and handleBlur to field scoped slot props (69d5833)
- expose reset() on the form controller object (3229ee7)
- new meta tags API (#2958) (7494bfc)
- remove aria attributes and leave it to userland (365d825)
- remove valid fields from errors mapping (1eee524)

# 4.0.0-beta.7 (2020-10-10)

### Bug Fixes

- avoid accessing properties in form directly to avoid warninings (c5627af)
- update the handleSubmit signature (#2954) (d17517d)

# 4.0.0-beta.6 (2020-10-10)

### Features

- form and fields values setters (#2949) (cc2cb41)
- reactive initial form values (#2946) (ac2c68f)

# 4.0.0-beta.5 (2020-10-08)

### Bug Fixes

- sync model value on input closes #2944 (5f77fa9)

# 4.0.0-beta.4 (2020-10-08)

### Bug Fixes

- prevent recursive re-render model update (#2943) (9fa319f)
- set falsy initial values (4b29e72)
- use validateField instead of onChange handler for blur events (636077a)

# 4.0.0-beta.3 (2020-10-06)

### Bug Fixes

- avoid toggling checkbox `checked` attr in `handleChange` (#2937) (b8dafbd)

### Features

- added `validateOnMount` prop to `Field` and `Form` components (#2938) (3a0d878)

# 4.0.0-beta.2 (2020-10-05)

### Features

- field labels (#2933) (513137f)

# 4.0.0-beta.1 (2020-10-02)

### Bug Fixes

- avoid binding the value to file inputs (02a2745)

# 4.0.0-beta.0 (2020-10-01)

### Bug Fixes

- make sure to unwrap initial value (0298a92)

### Features

- validation triggers (#2927) (e725f43)

# 4.0.0-alpha.14 (2020-09-20)

### Bug Fixes

- **core:** in case of radio or checkbox explicitly set initialValue (#2907) (e45ec82)

### Features

- use symbols to avoid provide/inject conflicts (cc80032)
- workspaces (#2904) (0c05f94)

# 4.0.0-alpha.13 (2020-09-16)

### Features

- nested objects/arrays (#2897) (8d161a1)

# 4.0.0-alpha.12 (2020-09-15)

### Features

- cast single checkboxes values to booleans closes #2889 (7a08184)
- invoke generateMessage handler for local functions closes #2893 (e9fe773)

# 4.0.0-alpha.11 (2020-09-02)

**Note:** Version bump only for package vee-validate

# 4.0.0-alpha.10 (2020-08-29)

### Bug Fixes

- added temporary fix for #2873 with form meta (6e1bf17)

# 4.0.0-alpha.9 (2020-08-28)

### Bug Fixes

- adapt to the breaking changes in #vue-1682 closes #2873 (05f7df3)

# 4.0.0-alpha.8 (2020-08-13)

### Bug Fixes

- detect initial values from v-model (e566302)
- handle unmount issue when removed value is falsy for checkboxes (b6393f4)
- initial array values for checkboxes not populated correctly in form (fb99edc)
- umounting group of checkbox issues (8c77af5)

### Features

- added basic v-model support (c93d125)
- merge ctx.attrs to any rendered root node (5c9979c)
- sync the model value with inner value (57d7923)

# 4.0.0-alpha.7 (2020-08-04)

### Bug Fixes

- avoid removing array value for a non-group field closes #2847 (69f2092)
- bails affects yup non-object validators (a50645b)
- initial values on HTML inputs (c4f4eb9)

### Features

- deprecate the skipOptional config (e62f5ea)

# 4.0.0-alpha.6 (2020-07-27)

### Bug Fixes

- render input tags by default for the field component (858c47b)

# 4.0.0-alpha.5 (2020-07-24)

### Bug Fixes

- unregister fields once they are unmounted (0d601cb)

### Features

- **v4:** add checkbox and radio HTML input support (#2835) (ab3d499)
- render input by default for the field component (81d055d)

# 4.0.0-alpha.4 (2020-07-23)

**Note:** Version bump only for package vee-validate

# 4.0.0-alpha.3 (2020-07-21)

### Features

- automatic injection of the form controller (c039831)
- remove debounce feature and make it userland (b7263ce)

# 4.0.0-alpha.2 (2020-07-19)

### Features

- always render a from by default (402603a)

# 4.0.0-alpha.1 (2020-07-18)

### Bug Fixes

- added check for cross-fields extraction on unsupported schema (0ff1bad)
- added errorMessage prop to the field type (f1553d0)
- added single error message prop to the provider slot props (bc97d0c)
- added unwrap util function (121bffc)
- adjust the useField options to be less strict (7ea8263)
- check if a form is present before accessing its schema (3656181)
- debouncing not working correctly and move it to hoc only (86280a1)
- ensure we unwrap the field id if it was reactive (7f91e93)
- initial validation not respecting the config opts (2443d44)
- localization default fallback not being interpolated correctly (165e89c)
- no clue why this isn't building (0d3e7fd)
- only add novalidate attr if the rendered element is form (3638cea)
- param mapping causing target names to resolve incorrectly (fb77dc6)
- set pending back to false earlier in the cycle (a4237a2)
- temporary fix for the unamed import issue with vue-beta 4 (62d27e9)
- unwrap flags before sending them to the observer slot (19f7886)
- use the proper model event name (5704db8)
- watch target fields once they change (a4184b0)

### Features

- adapt the changes from the v3 master branch (2301c5a)
- add name resolution from v3 (ba77fdd)
- add native submit alternative to handleSubmit (bc00888)
- added 'as' prop to the validation provider (5c8ae9c)
- added alert role to the error message (714abfe)
- added aria and a11y improvements (ca74f16)
- added built-in support for yup validation schema (e436b75)
- added ErrorMessage component (9570412)
- added support for custom components (c661c7e)
- added useField and useForm hooks (c1e9007)
- allow the as prop to be a component definition (29790d4)
- allow the observer to render forms and handle submit events (9e0d59b)
- allow validation schema to accept other expressions (ddeeaea)
- change default field value to undefiend (00c8754)
- deprecate names option on validate API (fe90820)
- deprecate the 'required' flag (283caa0)
- enable interaction modes and localization APIs (8486aaf)
- expose errorMessage prop on useField and Provider (04eecaa)
- expose the form values and pass them to the handleSubmit (de51155)
- hook up the provider with new observer implementation (4d18a65)
- implement bails for useField and ValidationProvider (486babd)
- implement initial values (8239130)
- implement validation debounce (e294409)
- implemented disabled prop (88bf28e)
- make rules watchable (90530cd)
- make the as prop take priority to determine what to render (d5a033f)
- new field binding object (a58a84b)
- new handleSubmit signature (63cbeaf)
- only export the provider for now (0bf3efe)
- remove vid from fields (1b9bded)
- support immediate validation (42cd6ed)
- support inline rules as functions (3c74681)
- support yup validation schemas on field-level (0802512)
- updated vnode utils to handle Vue 3 VNode API (29a4fe8)
- use defineComponent to type Provider and Observer definitions (80980cf)
- validate yup form schemas using object validation (bf216dd)
- validation schema support (523824a)
- working draft for the vprovider with composition api (b830054)
