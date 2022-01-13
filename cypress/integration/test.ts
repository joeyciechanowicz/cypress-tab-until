describe('tabUntil', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('tabs through', () => {
    cy.tabUntil({ accessibleTextIs: 'Password' });
    cy.focused().should('have.id', 'password');
    cy.focused().type('a password');

    cy.tabUntil({ accessibleTextIs: 'Username' });
    cy.focused()
      .type('the username')
      .should('have.id', 'username')
      .and('have.css', 'border');

    cy.tabUntil({ accessibleTextIs: 'Tabable header', direction: 'backwards' });
    cy.focused().should('have.css', 'border');

    cy.tabUntil({ accessibleTextIs: 'Link 2' });

    cy.tabUntil({ accessibleTextIs: 'other login text' });
    cy.focused().should('have.attr', 'type', 'submit');
  });
});
