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

import PlayerClient from './PlayerClient';
import { mockedAxios } from '../../setupTests';
import Player from '../../models/Player';
import PlayerCreateRequest from './PlayerCreateRequest';
import PlayerBetRequest from './PlayerBetRequest';
import PlayerUpdateRequest from './PlayerUpdateRequest';

describe('PlayerClient', () => {
    const playerId = '7890';
    const mockPlayer: Player = {
        cards: [],
        id: playerId,
        nickName: 'derp',
        numChips: 0,
        isDealer: false,
    };
    const gameStateId = '1234';

    afterEach(() => {
        mockedAxios.reset();
    });

    test('should get a player', async () => {
        mockedAxios.onGet(`/api/player/${playerId}`).replyOnce(200, mockPlayer);

        const player: Player = await PlayerClient.getPlayer(playerId);
        expect(player).toEqual(mockPlayer);
    });

    test('should create a new player', async () => {
        const mockPlayerCreateRequest: PlayerCreateRequest = {
            gameStateId: gameStateId,
            nickName: 'derp',
            isDealer: true,
        };
        mockedAxios
            .onPost('/api/player', mockPlayerCreateRequest)
            .replyOnce(200, mockPlayer);

        const createdPlayer: Player = await PlayerClient.createPlayer(
            gameStateId,
            'derp',
            true,
        );
        expect(createdPlayer).toEqual(mockPlayer);
    });

    test('should request to bet a chip', async () => {
        const cardId = '4567';
        const mockPlayerBetRequest: PlayerBetRequest = {
            cardId,
            playerId,
        };
        mockedAxios
            .onPost('/api/player/bet', mockPlayerBetRequest)
            .replyOnce(200, mockPlayer);

        const updatedPlayer: Player = await PlayerClient.makeBet(
            playerId,
            cardId,
        );
        expect(updatedPlayer).toEqual(mockPlayer);
    });

    test('should request to update player', async () => {
        const mockPlayerUpdateRequest: PlayerUpdateRequest = {
            id: playerId,
            nickName: 'zeeb',
        };
        mockedAxios
            .onPut('/api/player', mockPlayerUpdateRequest)
            .replyOnce(200, mockPlayer);

        const updatedPlayer: Player = await PlayerClient.updatePlayer(
            playerId,
            'zeeb',
        );
        expect(updatedPlayer).toEqual(mockPlayer);
    });
});
