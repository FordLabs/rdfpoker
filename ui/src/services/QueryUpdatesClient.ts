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

import GameStateClient from './GameState/GameStateClient';
import RulesClient from './Rules/RulesClient';
import Rules from '../models/Rules';
import Card from '../models/Card';
import StateResponse from './GameState/StateResponse';

type QueryUpdatesCallbackFunction = Function | undefined;

class QueryUpdatesClient {
    private rulesChangedCallback?: QueryUpdatesCallbackFunction;
    private currentPhaseChangedCallback?: QueryUpdatesCallbackFunction;
    private whoseTurnChangedCallback?: QueryUpdatesCallbackFunction;
    private cardsOnTableChangedCallback?: QueryUpdatesCallbackFunction;
    private pollPlayedCardsHandler?: NodeJS.Timeout;

    private static instance: QueryUpdatesClient;

    private constructor() {}

    static shared(): QueryUpdatesClient {
        if (!QueryUpdatesClient.instance) {
            QueryUpdatesClient.instance = new QueryUpdatesClient();
        }

        return QueryUpdatesClient.instance;
    }

    async queryRules(gameStateId: string) {
        const rules: Rules = await RulesClient.getRules(gameStateId);
        this.rulesChangedCallback?.(rules);
    }

    async queryPlayedCards(gameStateId: string) {
        const playedCards: Array<Card> = await GameStateClient.getPlayedCards(
            gameStateId,
        );
        this.cardsOnTableChangedCallback?.(playedCards);
    }

    async queryAll(gameStateId: string) {
        const stateResponse: StateResponse = await GameStateClient.getGameState(
            gameStateId,
        );
        this.currentPhaseChangedCallback?.(stateResponse.phase);
        this.whoseTurnChangedCallback?.(stateResponse.whoseTurn);
        this.rulesChangedCallback?.(stateResponse.rules);
        this.cardsOnTableChangedCallback?.(stateResponse.cardsOnTable);
    }

    startPollingPlayedCards(gameStateId: string) {
        this.pollPlayedCardsHandler = setInterval(
            () => this.queryPlayedCards(gameStateId),
            2500,
        );
    }

    stopPollingPlayedCards() {
        if (this.pollPlayedCardsHandler) {
            clearInterval(this.pollPlayedCardsHandler);
        }
        this.pollPlayedCardsHandler = undefined;
    }

    setRulesChangedCallback(callback: QueryUpdatesCallbackFunction) {
        this.rulesChangedCallback = callback;
    }

    setCurrentPhaseChangedCallback(callback: QueryUpdatesCallbackFunction) {
        this.currentPhaseChangedCallback = callback;
    }

    setWhoseTurnChangedCallback(callback: QueryUpdatesCallbackFunction) {
        this.whoseTurnChangedCallback = callback;
    }

    setCardsOnTableChangedCallback(callback: QueryUpdatesCallbackFunction) {
        this.cardsOnTableChangedCallback = callback;
    }
}

export default QueryUpdatesClient;
