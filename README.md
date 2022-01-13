# tab-until
Cypress keyboard only tests

## Installation

```sh
npm i -D cypress-tab-until
# or
yarn add -D cypress-tab-until
```

## Usage

`cypress-tab-until` extends the `cy` command.

Add the following to your project's `cypress/support/commands.js` :
```js
import 'cypress-tab-until';
```

You can then start writing tests that just use the keyboard

```js
cy.tabUntil({ accessibleTextIs: 'Username' });
cy.focused().type('some-username');

cy.tabUntil({accessibleTextIs: 'Password'}});
cy.focused().type('some-password');

cy.tabUntil({accessibleTextIs: 'Something up the page', direction: 'backwards'});
```

### Accessible text

The accessible text for an element is calculated by fetching the node from the Accessibility Tree (using [`getPartialTree`](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/#method-getPartialAXTree)) and looking at the names within that node. 

This means that the following all have the same accessible text:
```html

<a href="#">Something</a>
<button>Something</a>
<input aria-label="Something">
```

This pushes us as developers to write tests that _must_ consider the content being surfaced to a screen reader.
