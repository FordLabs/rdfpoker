/*
 * Copyright © 2018 Ford Motor Company
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add('getByLabel', (label) => {
    // you can disable individual command logging
    // by passing {log: false} option
    cy.contains('label', label)
        .invoke('attr', 'for')
        .then((id) => {
            cy.get('#' + id);
        });
});

Cypress.Commands.add('updatePhase', (phase) => {
    cy.get('[alt="Settings"]').click();

    cy.getByLabel('Current Game Phase:').click({ force: true });
    cy.contains(phase).click();
    cy.contains('Update Phase').click();

    cy.get('[alt="Settings"]').click();
});

Cypress.Commands.add('writeOnCardAndSave', (message) => {
    cy.get('[data-testid="cardTextArea"]').type(message);
    cy.intercept({
        method: 'PUT',
        url: '/card',
        hostname: 'localhost',
    });
    cy.get('[data-testid="saveCardButton"]').click();
});
