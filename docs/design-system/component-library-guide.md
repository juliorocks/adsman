# Component Library Guide

## Philosophy
We follow a **"Token-First"** approach combined with **Atomic Design** principles.
- **Tokens:** Single source of truth for values (colors, spacing).
- **Atoms:** Smallest units (Button, Input, Icon).
- **Molecules:** Groups of atoms (SearchBar, FormField).
- **Organisms:** Complex sections (CampaignCard, NavBar).

## Core Components

### 1. Button
**Usage:** seamless interactions.
- **Variants:** `primary` (blue-600), `secondary` (slate-200), `danger` (red-500), `ghost`.
- **Sizes:** `sm`, `md` (default), `lg`.
- **States:** `default`, `hover`, `active`, `disabled`, `loading` (spinner).

```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Create Campaign
</Button>
```

### 2. Input Field
**Usage:** Forms and data entry.
- **Features:** Label support, error message display, helper text.
- **Style:** `border-slate-300`, `focus:ring-2`, `focus:ring-blue-500`.

### 3. Card
**Usage:** Grouping related content (e.g., Campaign overview).
- **Style:** `bg-white`, `shadow-sm`, `rounded-lg`, `border-slate-100`.
- **Padding:** `p-4` or `p-6` based on density.

### 4. Data Table
**Usage:** Listing campaigns, ad sets, ads.
- **Features:** Pagination, Sortable headers, Row selection.
- **Style:** Striped rows option, steady header.

### 5. Status Badge
**Usage:** Visual indicator of entity state.
- **Colors:** Green (Active), Gray (Draft), Red (Error/Rejected), Yellow (Processing).

## Development Rules
1. **Always use Tokens:** Never hardcode hex values. Use Tailwind classes that map to our tokens (e.g., `text-primary-600` instead of `color: #2563eb`).
2. **Accessibility:** All interactive elements must have `aria-label` if no text is present. Focus states must be visible.
3. **Composition:** Build complex views by composing smaller components.
