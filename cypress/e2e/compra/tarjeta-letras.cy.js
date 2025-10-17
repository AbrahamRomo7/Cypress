describe('Escenario 4 - Tarjeta con letras', () => {
  it('Debe impedir la compra si la tarjeta contiene letras', () => {
    cy.visit('/');
    cy.contains('Samsung galaxy s6').click();
    cy.contains('Add to cart').click();
    cy.contains('PRODUCT STORE').click();
    cy.contains('Nokia lumia 1520').click();
    cy.contains('Add to cart').click();
    cy.contains('Cart').click();
    cy.contains('Place Order').click();

    cy.get('#name').type('Abraham Romo');
    cy.get('#country').type('Ecuador');
    cy.get('#city').type('Quito');
    cy.get('#card').type('abcd1234');
    cy.get('#month').type('12');
    cy.get('#year').type('2025');

    cy.contains('Purchase').click();
    cy.contains('Thank you for your purchase!').should('not.exist');
  });
});