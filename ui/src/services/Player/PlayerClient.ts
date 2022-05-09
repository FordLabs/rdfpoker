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
import Player from '../../models/Player';
import PlayerCreateRequest from './PlayerCreateRequest';
import PlayerBetRequest from './PlayerBetRequest';
import PlayerUpdateRequest from './PlayerUpdateRequest';

const playerApiBase = '/api/player';

class PlayerClient {
    static async getPlayer(playerId: string): Promise<Player> {
        const axiosResponse: AxiosResponse<Player> = await axios.get(
            `${playerApiBase}/${playerId}`,
        );
        return axiosResponse.data;
    }

    static async createPlayer(
        gameStateId: string,
        nickName: string | undefined,
        isDealer: boolean,
    ): Promise<Player> {
        const playerCreateRequest: PlayerCreateRequest = {
            gameStateId,
            nickName,
            isDealer,
        };
        const response: AxiosResponse<Player> = await axios.post(
            playerApiBase,
            playerCreateRequest,
        );
        return response.data;
    }

    static async makeBet(playerId: string, cardId: string): Promise<Player> {
        const playerBetRequest: PlayerBetRequest = {
            playerId,
            cardId,
        };
        const axiosResponse: AxiosResponse<Player> = await axios.post(
            `${playerApiBase}/bet`,
            playerBetRequest,
        );
        return axiosResponse.data;
    }

    static async updatePlayer(
        playerId: string,
        nickName: string,
    ): Promise<Player> {
        const playerUpdateRequest: PlayerUpdateRequest = {
            id: playerId,
            nickName,
        };
        const axiosResponse: AxiosResponse<Player> = await axios.put(
            playerApiBase,
            playerUpdateRequest,
        );
        return axiosResponse.data;
    }
}

export default PlayerClient;
