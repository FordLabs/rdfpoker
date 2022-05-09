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

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import Card, { getNewCard } from '../../models/Card';
import Phase from '../../models/Phase';
import { RecoilRoot } from 'recoil';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import PlayerBetRequest from '../../services/Player/PlayerBetRequest';
import { initialPlayer } from '../../state/PlayerAtom';
import { cardsOnTableState } from '../../state/CardsOnTableAtom';
import CardStatus from '../../models/CardStatus';
import { whoseTurnState } from '../../state/WhoseTurnAtom';
import TurnResponse from '../../services/Sse/TurnResponse';
import Tabled from './Tabled';
import Rules, { initialRules } from '../../models/Rules';
import { rulesState } from '../../state/RulesAtom';
import userEvent from '@testing-library/user-event';
import PlayerClient from '../../services/Player/PlayerClient';

jest.mock('../../services/Player/PlayerClient');

describe('Tabled Cards', () => {
    const mockCard: Card = {
        ...getNewCard(),
        cardStatus: CardStatus.ONTABLE,
        playerId: initialPlayer.id,
        numChips: 1,
    };

    test('cards on table should not have a play card button', () => {
        const mockCurrentPhase = Phase.TURN;
        const mockWhoseTurn: TurnResponse = {
            playerId: initialPlayer.id,
            playerNickName: null,
        };
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, mockCurrentPhase);
                    snap.set(cardsOnTableState, [mockCard]);
                    snap.set(whoseTurnState, mockWhoseTurn);
                }}
            >
                <Tabled />
            </RecoilRoot>,
        );

        expect(screen.queryByTestId('playCardButton')).not.toBeInTheDocument();
        expect(screen.queryByTestId('discardButton')).not.toBeInTheDocument();
    });

    test('should show ONDISPLAY card before ONTABLE cards', async () => {
        const cardOnDisplay: Card = {
            ...mockCard,
            id: '3333',
            cardStatus: CardStatus.ONDISPLAY,
            content: 'IAMONDISPLAY',
        };
        const cardOnTable: Card = {
            ...mockCard,
            content: 'IAMONTABLE',
        };
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(cardsOnTableState, [cardOnTable, cardOnDisplay]);
                }}
            >
                <Tabled />
            </RecoilRoot>,
        );

        const cardsOnTable = await screen.findAllByTestId('card');
        await within(cardsOnTable[0]).findByText(cardOnDisplay.content);
        await within(cardsOnTable[1]).findByText(cardOnTable.content);
    });

    test('cards on table should not have a discard button', () => {
        const mockCurrentPhase = Phase.PREPARATION;
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, mockCurrentPhase);
                    snap.set(cardsOnTableState, [mockCard]);
                }}
            >
                <Tabled />
            </RecoilRoot>,
        );

        expect(screen.queryByTestId('playCardButton')).not.toBeInTheDocument();
        expect(screen.queryByTestId('discardButton')).not.toBeInTheDocument();
    });

    test('can bet a chip to a card on the table during BETTING phase', async () => {
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.BETTING);
                    snap.set(cardsOnTableState, [mockCard]);
                }}
            >
                <Tabled />
            </RecoilRoot>,
        );

        expect(screen.queryByText('X2')).not.toBeInTheDocument();

        const tabledCard = await screen.findByTestId('card');
        await userEvent.click(tabledCard);

        const mockPlayerBetRequest: PlayerBetRequest = {
            playerId: '1',
            cardId: '1',
        };
        expect(PlayerClient.makeBet).toHaveBeenCalledWith(
            mockPlayerBetRequest.playerId,
            mockPlayerBetRequest.cardId,
        );

        await screen.findByText('X2');
    });

    test('should only show cards equal or above threshold in rules in POSTGAME', async () => {
        const manyChipsCard: Card = {
            ...mockCard,
            numChips: 5,
            content: 'can see me',
        };
        const noChipsCard: Card = {
            ...mockCard,
            numChips: 0,
            content: 'will not see me',
        };
        const rulesWithHighThreshold: Rules = {
            ...initialRules,
            minChipsForCardPostGameDiscussion: 5,
        };

        const mockCurrentPhase = Phase.POSTGAME;
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, mockCurrentPhase);
                    snap.set(rulesState, rulesWithHighThreshold);
                    snap.set(cardsOnTableState, [manyChipsCard, noChipsCard]);
                }}
            >
                <Tabled />
            </RecoilRoot>,
        );

        await screen.findByText('can see me');
        expect(screen.queryByText('will not see me')).not.toBeInTheDocument();
    });

    test('should show cards sorted by num chips in POSTGAME', async () => {
        const manyChipsCard: Card = {
            ...mockCard,
            numChips: 5,
            content: 'A',
            id: 'A',
        };
        const someChipsCard: Card = {
            ...mockCard,
            numChips: 2,
            content: 'B',
            id: 'B',
        };
        const oneChipCard: Card = {
            ...mockCard,
            numChips: 1,
            content: 'C',
            id: 'C',
        };

        const mockCurrentPhase = Phase.POSTGAME;
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, mockCurrentPhase);
                    snap.set(cardsOnTableState, [
                        manyChipsCard,
                        oneChipCard,
                        someChipsCard,
                    ]);
                }}
            >
                <Tabled />
            </RecoilRoot>,
        );

        const cardsOnTable = await screen.findAllByTestId('card');
        await within(cardsOnTable[0]).findByText('A');
        await within(cardsOnTable[1]).findByText('B');
        await within(cardsOnTable[2]).findByText('C');
    });

    for (const phase of Object.values(Phase)) {
        if (phase === Phase.BETTING) {
            continue;
        }
        const mockCurrentPhase = phase;

        test('cannot bet chips during other phases', async () => {
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(currentPhaseState, mockCurrentPhase);
                        snap.set(cardsOnTableState, [mockCard]);
                    }}
                >
                    <Tabled />
                </RecoilRoot>,
            );
            jest.clearAllMocks();
            const tabledCard = await screen.findByTestId('card');
            await userEvent.click(tabledCard);

            expect(PlayerClient.makeBet).not.toHaveBeenCalled();
        });
    }
});
