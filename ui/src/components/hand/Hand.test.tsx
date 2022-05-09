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

import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import Hand from './Hand';
import Card, { getNewCard } from '../../models/Card';
import Phase from '../../models/Phase';
import CardUpdateRequest from '../../services/Card/CardUpdateRequest';
import CardAddRequest from '../../services/Card/CardAddRequest';
import { RecoilRoot } from 'recoil';
import { cardsInHandState } from '../../state/CardsInHandAtom';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import Player from '../../models/Player';
import { initialPlayer, playerState } from '../../state/PlayerAtom';
import { whoseTurnState } from '../../state/WhoseTurnAtom';
import TurnResponse from '../../services/Sse/TurnResponse';
import userEvent from '@testing-library/user-event';
import CardPlayRequest from '../../services/Card/CardPlayRequest';
import CardClient from '../../services/Card/CardClient';
import { TestVariables } from '../../TestUtils';

jest.mock('../../services/Card/CardClient');

describe(`The Player's Hand`, () => {
    describe('during PREPARATION phase', () => {
        beforeEach(() => {
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(currentPhaseState, Phase.PREPARATION);
                        snap.set(playerState, TestVariables.player);
                    }}
                >
                    <Hand />
                </RecoilRoot>,
            );
        });

        test('clicking deck adds a new card', async () => {
            expect(screen.queryAllByTestId('card').length).toEqual(0);

            const deck = await screen.findByTestId('deck');
            await userEvent.click(deck);

            const addCardRequest: CardAddRequest = {
                playerId: TestVariables.player.id,
            };

            expect(CardClient.createCard).toHaveBeenCalledWith(
                addCardRequest.playerId,
            );

            await screen.findByTestId('card');
        });

        test('can edit a card', async () => {
            const deck = await screen.findByTestId('deck');
            await userEvent.click(deck);

            const addedCard = await screen.findByTestId('card');

            const textToInput = 'hello world';
            await writeTextOnCard(addedCard, textToInput);

            const saveButton = await within(addedCard).findByTestId(
                'saveCardButton',
            );
            await userEvent.click(saveButton);

            const expectedCardUpdateRequest: CardUpdateRequest = {
                id: '1',
                content: textToInput,
            };

            expect(CardClient.updateCard).toHaveBeenCalledWith(
                expectedCardUpdateRequest,
            );
            await waitFor(() => {
                expect(
                    screen.queryByTestId('saveCardButton'),
                ).not.toBeInTheDocument();
            });
        });

        test('cancel edit should revert text', async () => {
            const deck = await screen.findByTestId('deck');
            await userEvent.click(deck);

            const addedCard = await screen.findByTestId('card');

            const textToInput = 'hello world';
            await writeTextOnCard(addedCard, textToInput);

            const cancelButton = await within(addedCard).findByTestId(
                'cancelCardButton',
            );
            await userEvent.click(cancelButton);

            const cardTextArea = await within(addedCard).findByTestId(
                'cardTextArea',
            );
            expect(cardTextArea).toHaveTextContent('');
        });

        test('can discard', async () => {
            const deck = await screen.findByTestId('deck');
            await userEvent.click(deck);

            const mockCard2: Card = {
                ...getNewCard(),
                id: '2',
                playerId: TestVariables.player.id,
            };
            CardClient.createCard = jest.fn().mockResolvedValue(mockCard2);
            await userEvent.click(deck);

            const cards = await screen.findAllByTestId('card');
            expect(cards.length).toEqual(2);

            const firstCard = cards[0];
            await writeTextOnCard(firstCard, 'hello world');

            const secondCard = cards[1];
            const secondCardText = 'I am here';
            await writeTextOnCard(secondCard, secondCardText);

            const firstCardDiscardButton = await within(firstCard).findByTestId(
                'discardButton',
            );
            await userEvent.click(firstCardDiscardButton);

            expect(CardClient.deleteCard).toHaveBeenCalledWith('1');
            await waitFor(() => {
                expect(screen.getAllByTestId('card').length).toEqual(1);
            });

            await screen.findByDisplayValue(secondCardText);
        });
    });

    describe('during phases other than PREPARATION', () => {
        for (const phase of Object.values(Phase)) {
            if (phase === Phase.PREPARATION) {
                continue;
            }
            const mockCurrentPhase = phase;

            test('cannot add cards', async () => {
                render(
                    <RecoilRoot
                        initializeState={(snap) =>
                            snap.set(currentPhaseState, mockCurrentPhase)
                        }
                    >
                        <Hand />
                    </RecoilRoot>,
                );

                const deck = await screen.findByTestId('deck');
                await userEvent.click(deck);

                expect(screen.queryByTestId('card')).not.toBeInTheDocument();
            });

            test('cannot edit/delete cards', () => {
                const newCard: Card = {
                    ...getNewCard(),
                    content: 'ME',
                };
                render(
                    <RecoilRoot
                        initializeState={(snap) => {
                            snap.set(currentPhaseState, mockCurrentPhase);
                            snap.set(cardsInHandState, [newCard]);
                        }}
                    >
                        <Hand />
                    </RecoilRoot>,
                );

                expect(
                    screen.queryByTestId('discardButton'),
                ).not.toBeInTheDocument();
                expect(screen.getByTestId('cardTextArea')).toBeDisabled();
            });
        }

        test('can play a card during TURN when our turn', async () => {
            const playerId = TestVariables.player.id;
            const newCard: Card = {
                ...getNewCard(),
                content: 'ME',
                playerId,
            };
            const player: Player = {
                ...TestVariables.player,
                cards: [newCard],
                id: playerId,
            };
            const mockPlayerTakingTurn: TurnResponse = {
                playerId,
                playerNickName: null,
            };
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(currentPhaseState, Phase.TURN);
                        snap.set(cardsInHandState, [newCard]);
                        snap.set(playerState, player);
                        snap.set(whoseTurnState, mockPlayerTakingTurn);
                    }}
                >
                    <Hand />
                </RecoilRoot>,
            );

            const playCardButton = await screen.findByTestId('playCardButton');
            await userEvent.click(playCardButton);

            const expectedCardPlayRequest: CardPlayRequest = {
                id: newCard.id,
            };
            expect(CardClient.playCard).toHaveBeenCalledWith(
                expectedCardPlayRequest,
            );
            expect(screen.queryByTestId('card')).not.toBeInTheDocument();
        });

        test('cannot play a card during TURN when not our turn', async () => {
            const newCard = getNewCard();
            const cardsInHand = [newCard];
            const player: Player = {
                ...TestVariables.player,
                cards: cardsInHand,
            };
            const mockPlayerTakingTurn: TurnResponse = {
                playerId: TestVariables.player.id,
                playerNickName: null,
            };
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(currentPhaseState, Phase.TURN);
                        snap.set(cardsInHandState, cardsInHand);
                        snap.set(playerState, player);
                        snap.set(whoseTurnState, mockPlayerTakingTurn);
                    }}
                >
                    <Hand />
                </RecoilRoot>,
            );

            expect(
                screen.queryByTestId('playCardButton'),
            ).not.toBeInTheDocument();
        });

        test('should auto discard any blank cards when entering TURN phase', async () => {
            const blankCard = getNewCard();
            const cardWithContent: Card = {
                ...getNewCard(),
                id: 'A',
                content: 'ME',
            };
            const cardsInHand = [blankCard, cardWithContent];
            const player: Player = {
                ...initialPlayer,
                cards: cardsInHand,
            };
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(currentPhaseState, Phase.TURN);
                        snap.set(cardsInHandState, cardsInHand);
                        snap.set(playerState, player);
                    }}
                >
                    <Hand />
                </RecoilRoot>,
            );
            const cardsOnScreen = await screen.findAllByTestId('card');
            expect(cardsOnScreen.length).toEqual(1);
            await screen.findByText('ME');
        });
    });

    async function writeTextOnCard(card: HTMLElement, cardText: string) {
        expect(
            within(card).queryByTestId('saveCardButton'),
        ).not.toBeInTheDocument();

        const cardTextArea = await within(card).findByTestId('cardTextArea');
        cardTextArea.focus();
        await userEvent.clear(cardTextArea);
        await userEvent.type(cardTextArea, cardText);
    }
});
