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

import CreatedGameResponse from '../CreatedGameResponse';
import { TestVariables } from '../../../TestUtils';
import StateResponse from '../StateResponse';
import Phase from '../../../models/Phase';
import { noPlayerTakingTurn } from '../../../state/WhoseTurnAtom';
import { initialRules } from '../../../models/Rules';

const mockedCreatedGameResponse: CreatedGameResponse = {
    gameStateId: TestVariables.gameStateId,
};
const mockedStateResponse: StateResponse = {
    cardsOnTable: [],
    phase: Phase.PREGAME,
    rules: initialRules,
    whoseTurn: noPlayerTakingTurn,
};

const GameStateClient = {
    createGame: jest.fn().mockResolvedValue(mockedCreatedGameResponse),
    advanceGameState: jest.fn().mockResolvedValue(null),
    getGameState: jest.fn().mockResolvedValue(mockedStateResponse),
    getWhoseTurn: jest.fn().mockResolvedValue(noPlayerTakingTurn),
    getPlayedCards: jest.fn().mockResolvedValue([]),
    getCurrentPhase: jest.fn().mockResolvedValue(Phase.PREGAME),
};

export default GameStateClient;
