describe('Escenario 1 - Intento de compra con carrito vacío', () => {
  it('Debe impedir la compra sin productos', () => {
    cy.visit('/');
    cy.contains('Cart').click();
    cy.contains('Place Order').click();

    cy.get('#name').type('Abraham Romo');
    cy.get('#country').type('Ecuador');
    cy.get('#city').type('Quito');
    cy.get('#card').type('36950562615702');
    cy.get('#month').type('12');
    cy.get('#year').type('2025');

    cy.contains('Purchase').click();

    cy.contains('Thank you for your purchase!').should('not.exist');
  });
});