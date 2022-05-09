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

import { mockedAxios } from '../../setupTests';
import CreatedGameResponse from './CreatedGameResponse';
import GameStateClient from './GameStateClient';
import StateResponse from './StateResponse';
import Phase from '../../models/Phase';
import GameStateAdvanceRequest from './GameStateAdvanceRequest';
import Card, { getNewCard } from '../../models/Card';
import CurrentPhaseResponse from './CurrentPhaseResponse';
import TurnResponse from '../Sse/TurnResponse';

describe('GameStateClient', () => {
    const gameStateId = '1234';

    afterEach(() => {
        mockedAxios.reset();
    });

    test('should create a new game', async () => {
        const mockCreatedGameResponse: CreatedGameResponse = {
            gameStateId: gameStateId,
        };
        mockedAxios
            .onPost('/api/state')
            .replyOnce(200, mockCreatedGameResponse);

        const actualCreatedGameResponse: CreatedGameResponse =
            await GameStateClient.createGame();
        expect(actualCreatedGameResponse).toEqual(mockCreatedGameResponse);
    });

    test('should advance a GameState', async () => {
        const gameStateAdvanceRequest: GameStateAdvanceRequest = {
            id: gameStateId,
            phaseString: Phase.PREGAME,
        };
        mockedAxios.onPut('/api/state', gameStateAdvanceRequest).replyOnce(200);

        // will fail if error
        await GameStateClient.advanceGameState(gameStateAdvanceRequest);
    });

    test('should get a StateResponse for a specific game', async () => {
        const mockStateResponse: StateResponse = {
            cardDisplayed: undefined,
            cardsOnTable: [],
            phase: Phase.PREGAME,
            rules: {
                id: '1',
                prompt: 'Helllo?',
                maxCardsInHand: 5,
                preparationTimerDuration: 1,
                turnTimerDuration: 1,
                bettingTimerDuration: 1,
                minChipsForCardPostGameDiscussion: 1,
                minCardContribution: 1,
                chipsAllottedPerPlayer: 1,
            },
            whoseTurn: {
                playerId: '1223',
                playerNickName: 'merp',
            },
        };
        mockedAxios
            .onGet(`/api/state/${gameStateId}`)
            .replyOnce(200, mockStateResponse);

        const actualStateResponse: StateResponse =
            await GameStateClient.getGameState(gameStateId);
        expect(actualStateResponse).toEqual(mockStateResponse);
    });

    test('should get whose turn it is in a game', async () => {
        const mockPlayerTakingTurn: TurnResponse = {
            playerId: '444',
            playerNickName: 'James',
        };
        mockedAxios
            .onGet(`/api/state/turn/${gameStateId}`)
            .replyOnce(200, mockPlayerTakingTurn);

        const actualPlayerTakingTurn: TurnResponse =
            await GameStateClient.getWhoseTurn(gameStateId);
        expect(actualPlayerTakingTurn).toEqual(mockPlayerTakingTurn);
    });

    test('should get cards that have been played', async () => {
        const expectedPlayedCards = [getNewCard()];
        mockedAxios
            .onGet(`/api/state/playedCards/${gameStateId}`)
            .replyOnce(200, expectedPlayedCards);
        const playedCards: Array<Card> = await GameStateClient.getPlayedCards(
            gameStateId,
        );
        expect(playedCards).toEqual(expectedPlayedCards);
    });

    test('should get phase of a game', async () => {
        const expectedPhaseResponse: CurrentPhaseResponse = {
            phase: Phase.BETTING,
        };
        mockedAxios
            .onGet(`/api/state/phase/${gameStateId}`)
            .replyOnce(200, expectedPhaseResponse);
        const actualPhase: Phase = await GameStateClient.getCurrentPhase(
            gameStateId,
        );
        expect(actualPhase).toEqual(expectedPhaseResponse.phase);
    });
});
