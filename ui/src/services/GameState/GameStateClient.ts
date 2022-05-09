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

import axios, { AxiosResponse } from 'axios';
import CreatedGameResponse from './CreatedGameResponse';
import StateResponse from './StateResponse';
import GameStateAdvanceRequest from './GameStateAdvanceRequest';
import Card from '../../models/Card';
import Phase from '../../models/Phase';
import CurrentPhaseResponse from './CurrentPhaseResponse';
import TurnResponse from '../Sse/TurnResponse';

const stateApiBase = '/api/state';

class GameStateClient {
    static async createGame(): Promise<CreatedGameResponse> {
        const axiosResponse: AxiosResponse<CreatedGameResponse> =
            await axios.post(stateApiBase);
        return axiosResponse.data;
    }

    static async getGameState(gameStateId: string): Promise<StateResponse> {
        const axiosResponse: AxiosResponse<StateResponse> = await axios.get(
            `${stateApiBase}/${gameStateId}`,
        );
        return axiosResponse.data;
    }

    static async advanceGameState(
        gameStateAdvanceRequest: GameStateAdvanceRequest,
    ) {
        await axios.put('/api/state', gameStateAdvanceRequest);
    }

    static async getWhoseTurn(gameStateId: string): Promise<TurnResponse> {
        const axiosResponse: AxiosResponse<TurnResponse> = await axios.get(
            `${stateApiBase}/turn/${gameStateId}`,
        );
        return axiosResponse.data;
    }

    static async getPlayedCards(gameStateId: string): Promise<Array<Card>> {
        const axiosResponse: AxiosResponse<Array<Card>> = await axios.get(
            `${stateApiBase}/playedCards/${gameStateId}`,
        );
        return axiosResponse.data;
    }

    static async getCurrentPhase(gameStateId: string): Promise<Phase> {
        const axiosResponse: AxiosResponse<CurrentPhaseResponse> =
            await axios.get(`${stateApiBase}/phase/${gameStateId}`);
        return axiosResponse.data.phase;
    }
}

export default GameStateClient;
