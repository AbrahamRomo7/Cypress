describe('Escenario 5 - Eliminar un producto del carrito', () => {
  it('Debe reflejar solo 2 productos tras eliminar uno', () => {
    cy.visit('/');
    cy.contains('Samsung galaxy s6').click();
    cy.contains('Add to cart').click();
    cy.contains('PRODUCT STORE').click();
    cy.contains('Nokia lumia 1520').click();
    cy.contains('Add to cart').click();
    cy.contains('PRODUCT STORE').click();
    cy.contains('Sony xperia z5').click();
    cy.contains('Add to cart').click();

    cy.contains('Cart').click();
    cy.wait(1000);
    cy.get('tr.success').should('have.length', 3);

    // Elimina el segundo producto
    cy.get('tr.success').eq(1).find('a').contains('Delete').click();
    cy.wait(1000);

    cy.get('tr.success').should('have.length', 2);
  });
});