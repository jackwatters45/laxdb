---
title: Effect Form
description: Type-safe form library built on Effect Schema and @effect-atom
---

# Effect Form

A type-safe form library for React built on Effect Schema and `@effect-atom` state management.

## Architecture Overview

### Core Modules

| Module | Purpose |
|--------|---------|
| `FormBuilder` | Fluent builder API for defining form fields |
| `Field` | Scalar and array field definitions |
| `FormAtoms` | State management via @effect-atom |
| `Validation` | Error routing with source tracking |
| `Mode` | Validation timing configuration |

### FormBuilder

Fluent API for building type-safe forms:

```ts
import { FormBuilder, Field } from "@lucas-barake/effect-form"
import * as Schema from "effect/Schema"

const EmailField = Field.makeField("email", Schema.String.pipe(
  Schema.nonEmptyString({ message: () => "Email is required" })
))

const PasswordField = Field.makeField("password", Schema.String.pipe(
  Schema.minLength(8, { message: () => "Min 8 characters" })
))

const loginForm = FormBuilder.empty
  .addField(EmailField)
  .addField(PasswordField)
  .refine((values) => {
    // Cross-field validation
    if (values.password.includes(values.email)) {
      return { path: ["password"], message: "Password cannot contain email" }
    }
  })
```

### Field Types

**Scalar Fields** - Single values:

```ts
const NameField = Field.makeField("name", Schema.String)
```

**Array Fields** - Dynamic lists:

```ts
const TodosField = Field.makeArrayField("todos", Schema.Struct({
  text: Schema.String,
  completed: Schema.Boolean
}))
```

### Validation Modes

| Mode | When Validated |
|------|----------------|
| `"onSubmit"` | Only on form submission (default) |
| `"onBlur"` | When field loses focus |
| `"onChange"` | Every keystroke (sync) |
| `{ onChange: { debounce: "300 millis" } }` | Debounced validation |
| `{ onChange: { debounce: "500 millis", autoSubmit: true } }` | Auto-save |

## React Integration

### Basic Form

```tsx
import { FormReact } from "@lucas-barake/effect-form-react"
import { useAtomSet, useAtomValue } from "@effect-atom/atom-react"

const EmailInput = ({ field }) => (
  <div>
    <label>Email</label>
    <input
      value={field.value}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
    />
    {Option.isSome(field.error) && <span>{field.error.value}</span>}
  </div>
)

const loginForm = FormReact.make(loginFormBuilder, {
  mode: "onBlur",
  fields: {
    email: EmailInput,
    password: PasswordInput,
  },
  onSubmit: (_, { decoded }) =>
    Effect.gen(function* () {
      yield* Effect.log(`Login: ${decoded.email}`)
      return { success: true }
    }),
})

function LoginPage() {
  const submit = useAtomSet(loginForm.submit)

  return (
    <loginForm.Initialize defaultValues={{ email: "", password: "" }}>
      <form onSubmit={(e) => { e.preventDefault(); submit() }}>
        <loginForm.email />
        <loginForm.password />
        <button type="submit">Login</button>
      </form>
    </loginForm.Initialize>
  )
}
```

### Array Fields

```tsx
const TodosField = Field.makeArrayField("todos", Schema.Struct({
  text: Schema.String,
  completed: Schema.Boolean
}))

const todoForm = FormReact.make(FormBuilder.empty.addField(TodosField), {
  fields: {
    todos: {
      text: ({ field }) => <input value={field.value} onChange={...} />,
      completed: ({ field }) => <input type="checkbox" checked={field.value} />,
    },
  },
  onSubmit: (_, { decoded }) => Effect.succeed(decoded),
})

function TodoList() {
  return (
    <todoForm.todos>
      {({ append, items, remove, swap, move }) => (
        <>
          {items.map((_, index) => (
            <todoForm.todos.Item key={index} index={index}>
              {({ remove: removeItem }) => (
                <div>
                  <todoForm.todos.completed />
                  <todoForm.todos.text />
                  <button onClick={removeItem}>Remove</button>
                </div>
              )}
            </todoForm.todos.Item>
          ))}
          <button onClick={() => append({ text: "", completed: false })}>
            Add Todo
          </button>
        </>
      )}
    </todoForm.todos>
  )
}
```

### Cross-Field Validation

**Synchronous** with `.refine()`:

```ts
FormBuilder.empty
  .addField(PasswordField)
  .addField(ConfirmPasswordField)
  .refine((values) => {
    if (values.password !== values.confirmPassword) {
      return { path: ["confirmPassword"], message: "Passwords must match" }
    }
  })
```

**Asynchronous** with `.refineEffect()`:

```ts
class UsernameValidator extends Context.Tag("UsernameValidator")<
  UsernameValidator,
  { readonly isTaken: (username: string) => Effect.Effect<boolean> }
>() {}

const runtime = Atom.runtime(UsernameValidatorLive)

const formBuilder = FormBuilder.empty
  .addField(UsernameField)
  .refineEffect((values) =>
    Effect.gen(function* () {
      const validator = yield* UsernameValidator
      const isTaken = yield* validator.isTaken(values.username)
      if (isTaken) {
        return { path: ["username"], message: "Username taken" }
      }
    })
  )
```

### Multi-Step Wizard

Merge form builders and preserve state across steps:

```tsx
const step1Builder = FormBuilder.empty
  .addField(FirstNameField)
  .addField(LastNameField)

const step2Builder = FormBuilder.empty
  .addField(StreetField)
  .addField(CityField)

const finalBuilder = FormBuilder.empty
  .merge(step1Builder)
  .merge(step2Builder)

function Wizard() {
  return (
    <>
      {/* Keep state alive when steps unmount */}
      <step1Form.KeepAlive />
      <step2Form.KeepAlive />

      {currentStep === 1 && <Step1 />}
      {currentStep === 2 && <Step2 />}
      {currentStep === 3 && <ReviewStep />}
    </>
  )
}
```

### Dirty Tracking and Revert

```tsx
function UnsavedChangesBanner() {
  const hasChangedSinceSubmit = useAtomValue(form.hasChangedSinceSubmit)
  const revertToLastSubmit = useAtomSet(form.revertToLastSubmit)

  if (!hasChangedSinceSubmit) return null

  return (
    <div>
      You have unsaved changes
      <button onClick={() => revertToLastSubmit()}>Revert</button>
    </div>
  )
}
```

| Atom | Description |
|------|-------------|
| `isDirty` | True if values differ from initial |
| `hasChangedSinceSubmit` | True if values differ from last submit |
| `dirtyFields` | Set of changed field paths |
| `revertToLastSubmit` | Action to restore last submitted values |
| `reset` | Action to restore initial values |

### Typed Error Handling

```ts
import * as Data from "effect/Data"
import * as Result from "@effect-atom/atom/Result"

class InvalidCredentialsError extends Data.TaggedError("InvalidCredentialsError")<{
  readonly email: string
}> {}

class AccountLockedError extends Data.TaggedError("AccountLockedError")<{
  readonly email: string
  readonly unlockAt: Date
}> {}

const form = FormReact.make(builder, {
  onSubmit: (_, { decoded }) =>
    Effect.gen(function* () {
      if (decoded.email === "locked@example.com") {
        return yield* new AccountLockedError({ email: decoded.email, unlockAt: new Date() })
      }
      return { success: true }
    }),
})

function SubmitStatus() {
  const submitResult = useAtomValue(form.submit)

  return Result.builder(submitResult)
    .onWaiting(() => <div>Loading...</div>)
    .onSuccess((value) => <div>Success!</div>)
    .onErrorTag("InvalidCredentialsError", (error) => (
      <div>Invalid credentials for {error.email}</div>
    ))
    .onErrorTag("AccountLockedError", (error) => (
      <div>Account locked until {error.unlockAt.toLocaleTimeString()}</div>
    ))
    .onErrorTag("ParseError", () => <div>Fix validation errors</div>)
    .onDefect((defect) => <div>Unexpected error: {String(defect)}</div>)
    .orNull()
}
```

## State Atoms Reference

| Atom | Type | Description |
|------|------|-------------|
| `stateAtom` | `Option<FormState>` | Complete form state |
| `valuesAtom` | `Option<EncodedValues>` | Current encoded values |
| `errorsAtom` | `Map<string, ErrorEntry>` | Validation errors by path |
| `isDirty` | `boolean` | Changed from initial |
| `submitCount` | `number` | Number of submissions |
| `submit` | `AtomResultFn` | Submit action with Result |
| `reset` | `Writable<void>` | Reset to initial values |
| `setValue(fieldRef)` | `Writable<S>` | Set specific field value |

## Comparison with Other Libraries

### React Hook Form

React Hook Form is the most popular form library for React. Here's how the APIs compare:

#### useForm Hook

```tsx
import { useForm } from "react-hook-form"

const { register, handleSubmit, watch, setValue, getValues, reset, formState } = useForm({
  mode: "onBlur",           // onSubmit | onBlur | onChange
  defaultValues: { email: "", password: "" },
  resolver: zodResolver(schema),  // External schema validation
})

// formState contains:
// { errors, isDirty, dirtyFields, isSubmitting, isValid, touchedFields, submitCount }
```

#### Field Registration

```tsx
// React Hook Form - spreads props onto native input
<input {...register("email", {
  required: "Email is required",
  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" }
})} />

// Effect Form - component-based with field prop
<form.email />  // Renders EmailInput component with field props
```

#### Dynamic Arrays

```tsx
// React Hook Form
const { fields, append, remove, swap, move } = useFieldArray({
  control,
  name: "items"
})

{fields.map((field, index) => (
  <input key={field.id} {...register(`items.${index}.name`)} />
))}

// Effect Form
<form.items>
  {({ items, append, remove, swap, move }) => (
    items.map((_, index) => (
      <form.items.Item key={index} index={index}>
        <form.items.name />
      </form.items.Item>
    ))
  )}
</form.items>
```

#### Schema Validation

```tsx
// React Hook Form - resolver pattern
import { zodResolver } from "@hookform/resolvers/zod"

useForm({ resolver: zodResolver(schema) })

// Effect Form - built-in Effect Schema
const field = Field.makeField("email", Schema.String.pipe(
  Schema.nonEmptyString({ message: () => "Required" })
))
```

#### Async Validation

```tsx
// React Hook Form - validate function returns Promise
register("username", {
  validate: async (value) => {
    const taken = await checkUsername(value)
    return !taken || "Username taken"
  }
})

// Effect Form - refineEffect with Effect services
formBuilder.refineEffect((values) =>
  Effect.gen(function* () {
    const validator = yield* UsernameValidator
    const taken = yield* validator.isTaken(values.username)
    if (taken) return { path: ["username"], message: "Username taken" }
  })
)
```

### API Comparison Matrix

| Feature | Effect Form | React Hook Form |
|---------|-------------|-----------------|
| **Type Safety** | Full inference from Schema | Generic types, manual typing |
| **Schema** | Effect Schema (built-in) | External (Zod, Yup via resolver) |
| **State Management** | @effect-atom | Internal subscription |
| **Field Components** | Component-based | Spread props via register() |
| **Async Validation** | Effect services + refineEffect | Promise-based validate fn |
| **Error Typing** | Discriminated unions | String messages |
| **Cross-field** | refine() / refineEffect() | resolver or validate |
| **Array Fields** | Render prop pattern | useFieldArray hook |
| **Dirty Tracking** | isDirty + hasChangedSinceSubmit | isDirty + dirtyFields |
| **Auto-submit** | Built-in mode option | Manual implementation |
| **Wizard/Multi-step** | merge() + KeepAlive | Manual state management |

### Key Differences

**Effect Form advantages:**
- Full type inference from Effect Schema
- Typed errors with `Data.TaggedError` + `Result.builder()`
- Effect services for async validation (dependency injection)
- Built-in auto-submit modes
- `hasChangedSinceSubmit` for revert-to-last-save UX
- `KeepAlive` for wizard state preservation

**React Hook Form advantages:**
- Smaller bundle size
- Larger ecosystem and community
- Works with any validation library
- Simpler mental model for basic forms
- Native input integration via register()
- Better focus management built-in

### TanStack Form

TanStack Form is a headless, type-safe form library supporting multiple frameworks.

#### Basic Usage

```tsx
import { useForm } from '@tanstack/react-form'

function LoginForm() {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      console.log('Submit:', value)
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="email"
        children={(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

#### Field Validation

```tsx
<form.Field
  name="age"
  validators={{
    // Sync validation
    onChange: ({ value }) => value < 13 ? 'Must be 13+' : undefined,
    // Async validation with debounce
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      const currentAge = await fetchCurrentAge()
      return value < currentAge ? 'Cannot decrease age' : undefined
    },
  }}
  children={(field) => (
    <div>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(Number(e.target.value))}
      />
      {field.state.meta.errors[0] && <span>{field.state.meta.errors[0]}</span>}
    </div>
  )}
/>
```

#### Array Fields

```tsx
<form.Field name="members" mode="array">
  {(field) => (
    <div>
      {field.state.value.map((_, index) => (
        <div key={index}>
          <form.Field name={`members[${index}].name`}>
            {(subField) => (
              <input
                value={subField.state.value}
                onChange={(e) => subField.handleChange(e.target.value)}
              />
            )}
          </form.Field>
          <button onClick={() => field.removeValue(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => field.pushValue({ name: '' })}>Add</button>
    </div>
  )}
</form.Field>
```

#### Array Field Methods

| Method | Description |
|--------|-------------|
| `pushValue(value)` | Add item to end |
| `removeValue(index)` | Remove at index |
| `swapValues(i, j)` | Swap two items |
| `moveValue(from, to)` | Move item |
| `insertValue(index, value)` | Insert at index |
| `replaceValue(index, value)` | Replace at index |
| `clearValues()` | Remove all items |

### Full Comparison Matrix

| Feature | Effect Form | React Hook Form | TanStack Form |
|---------|-------------|-----------------|---------------|
| **Type Safety** | Full (Effect Schema) | Generic | Full (deep inference) |
| **Schema** | Effect Schema | External resolver | External or inline |
| **State Mgmt** | @effect-atom | Internal | Internal store |
| **Field API** | Component-based | register() spread | render prop |
| **Validation Events** | mode option | mode option | per-field validators |
| **Async Validation** | refineEffect() | validate Promise | onChangeAsync |
| **Debouncing** | Built-in mode | Manual | onChangeAsyncDebounceMs |
| **Error Types** | Discriminated unions | Strings | Strings |
| **Array Methods** | append/remove/swap/move | useFieldArray hook | pushValue/removeValue/etc |
| **Framework** | React only | React only | React, Vue, Solid, etc |
| **Bundle Size** | Larger (Effect dep) | Small | Medium |

### When to Use Each

**Effect Form** - Best for:
- Effect-TS codebases
- Complex typed error handling
- Effect service dependency injection
- Auto-submit / revert-to-last-save patterns

**React Hook Form** - Best for:
- Simple to medium forms
- Maximum ecosystem compatibility
- Smallest bundle size
- Native HTML input focus

**TanStack Form** - Best for:
- Multi-framework projects
- Complex nested/array structures
- Per-field async validation
- Deep type inference needs

## Gap Analysis & Production Readiness

### Effect Form Gaps

| Gap | Impact | Mitigation |
|-----|--------|------------|
| **Focus management** | No built-in focus on error | Manual `ref.focus()` in error handler |
| **Field-level async** | Only form-level refineEffect | Use debounced mode + per-field schema |
| **SSR/Hydration** | @effect-atom behavior unclear | Test with streaming SSR |
| **Bundle size** | Effect dependency overhead | Tree-shaking, code splitting |
| **Ecosystem** | Smaller community | Leverage Effect ecosystem |

### Missing Features vs Competitors

| Feature | RHF | TanStack | Effect Form | Priority |
|---------|-----|----------|-------------|----------|
| Focus first error | Yes | Manual | No | Medium |
| Field-level async debounce | Manual | Yes | Form-level only | Low |
| setFocus() API | Yes | No | No | Medium |
| Form state persistence | Plugin | Manual | KeepAlive | Done |
| DevTools | Yes | Yes | No | Low |
| Controller component | Yes | N/A | N/A | N/A |

### Production Readiness Checklist

- [x] Type-safe field definitions
- [x] Cross-field validation (sync + async)
- [x] Array field operations
- [x] Dirty tracking (initial + last submit)
- [x] Auto-submit modes
- [x] Wizard/multi-step support
- [x] Typed error handling
- [ ] Focus management utilities
- [ ] SSR hydration testing
- [ ] Performance benchmarks
- [ ] Field-level async validation

### Recommendations

1. **For new Effect-TS projects**: Use Effect Form for typed errors and service integration
2. **For existing RHF projects**: Don't migrate unless you need Effect ecosystem benefits
3. **For multi-framework**: Use TanStack Form
4. **For maximum compatibility**: Use React Hook Form
