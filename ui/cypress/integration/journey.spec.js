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

/// <reference types="cypress" />

describe('Journey', () => {
    it('should play a full game', () => {
        cy.visit('/');
        cy.contains('Create New Game').click();
        updateNickname();

        cy.updatePhase('PREPARATION');
        drawAndWriteOnCards();
        discardOne();

        cy.updatePhase('TURN');
        playACard();

        cy.updatePhase('BETTING');
        makeABet();

        cy.updatePhase('POSTGAME');

        function updateNickname() {
            cy.get('.settings').should('be.visible');
            cy.get('[data-testid="header-playerId"]').contains('Dealer');
            cy.getByLabel('nickname:').clear().type('cypress');
            cy.contains('Change Nick Name').click();
            cy.get('[data-testid="header-playerId"]').contains('cypress');
        }

        function drawAndWriteOnCards() {
            cy.get('[data-testid="card"]').should('not.exist');
            // draw 3 cards
            cy.get('[data-testid="deck"]').click().click().click();
            cy.get('[data-testid="card"]').should('have.length', 3);

            cy.get('[data-testid="card"]')
                .first()
                .as('firstCard')
                .within(() => {
                    // Update A Card
                    cy.writeOnCardAndSave('blah');
                    // Revert A Card Change
                    cy.get('[data-testid="cardTextArea"]')
                        .as('firstCardTextArea')
                        .type('nope');
                    cy.get('[data-testid="cancelCardButton"]').click();
                    cy.get('@firstCardTextArea').should('have.text', 'blah');
                });

            cy.get('[data-testid="card"]')
                .eq(1)
                .within(() => {
                    // Update A Card
                    cy.writeOnCardAndSave('keep');
                });
        }

        function discardOne() {
            cy.get('[data-testid="discardButton"]').first().click();
            cy.get('[data-testid="card"]').should('have.length', 2);
        }

        function playACard() {
            cy.get('[data-testid="card"]').should('have.length', 1);
            cy.get('[data-testid="tabled"]').within(() => {
                cy.get('[data-testid="card"]').should('have.length', 0);
            });
            cy.get('[data-testid="hand"]').within(() => {
                cy.get('[data-testid="card"]').should('have.length', 1);
                cy.get('[data-testid="playCardButton"]').should(
                    'have.length',
                    1,
                );
            });

            cy.get('[data-testid="playCardButton"]').click();

            cy.get('[data-testid="tabled"]').within(() => {
                cy.get('[data-testid="card"]').should('have.length', 1);
                cy.get('[data-testid="playCardButton"]').should(
                    'have.length',
                    0,
                );
            });
            cy.get('[data-testid="hand"]').within(() => {
                cy.get('[data-testid="card"]').should('have.length', 0);
            });
        }

        function makeABet() {
            cy.get('[data-testid="card"]')
                .as('bettableCard')
                .siblings()
                .should('have.length', 0);

            cy.get('@bettableCard').click();

            cy.get('@bettableCard')
                .siblings('.pokerChip')
                .should('have.length', 1);

            cy.get('@bettableCard').click();

            cy.get('@bettableCard')
                .siblings('.pokerChip')
                .within(() => {
                    cy.contains('X2');
                });
        }
    });
});
