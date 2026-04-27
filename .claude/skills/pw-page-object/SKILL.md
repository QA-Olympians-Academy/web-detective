---
name: pw-page-object
description: Generate a new Playwright page object class for a given page, following the project's existing pattern.
argument-hint: "<PageName> [/route]"
allowed-tools: Read Bash(find *)
---

Create a page object for: `$ARGUMENTS`

## Project conventions to follow

Reference `tests/pages/ProductsPage.ts` as the canonical example:
- Class name: PascalCase + `Page` suffix (e.g. `CheckoutPage`), or `Component` suffix for shared UI (e.g. `NavbarComponent`).
- Constructor takes `private readonly page: Page` and defines all `readonly` locators using the most stable selector available (ARIA role > label > placeholder > CSS class > test-id).
- Expose async action methods (`goto()`, `search()`, `submit()`, etc.) — never put assertions inside page objects.
- Export the type for the stock status union pattern if the page has status/badge variants.
- File location: `tests/pages/<ClassName>.ts`.

## Steps

1. **Parse `$ARGUMENTS`**:
   - First token = class name (e.g. `Checkout` → `CheckoutPage`)
   - Optional second token = route hint (e.g. `/checkout`) — navigate there to inspect elements if the dev server is running.

2. **Read the React source** for the target page under `src/pages/` (or `src/components/`) to catalogue:
   - All interactive elements (inputs, buttons, links) and their labels/placeholders.
   - All meaningful display elements (headings, stat cards, table rows, badges) and their CSS classes.
   - Any dynamic content that needs search/filter/clear methods.

3. **Generate the page object** at `tests/pages/<ClassName>.ts`:
   - One `readonly` locator per meaningful element.
   - Action methods for every user interaction the page supports.
   - Exported class with no test framework imports — only `@playwright/test` types (`Page`, `Locator`).

4. **Show the generated file** and explain each locator choice. Do not create the file until the user confirms, unless the skill was invoked from another skill (e.g. `pw-new-test`).
