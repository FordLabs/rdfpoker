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
import CardClient from './CardClient';
import Card from '../../models/Card';
import CardStatus from '../../models/CardStatus';
import CardUpdateRequest from './CardUpdateRequest';
import CardAddRequest from './CardAddRequest';
import CardPlayRequest from './CardPlayRequest';

describe('PlayerClient', () => {
    const playerId = '5678';
    const mockCard: Card = {
        cardStatus: CardStatus.INHAND,
        content: 'words',
        id: '1234',
        numChips: 0,
        playerId: playerId,
    };

    afterEach(() => {
        mockedAxios.reset();
    });

    test('should create a card', async () => {
        const mockCardAddRequest: CardAddRequest = {
            playerId: playerId,
        };
        mockedAxios
            .onPost('/api/card', mockCardAddRequest)
            .replyOnce(200, mockCard);

        const createdCard: Card = await CardClient.createCard(playerId);
        expect(createdCard).toEqual(mockCard);
    });

    test('should update a card', async () => {
        const mockCardUpdateRequest: CardUpdateRequest = {
            cardStatus: CardStatus.INHAND,
            content: 'words',
            id: '1234',
            numChips: 0,
        };
        mockedAxios
            .onPut('/api/card', mockCardUpdateRequest)
            .replyOnce(200, mockCard);

        const updatedCard: Card = await CardClient.updateCard(
            mockCardUpdateRequest,
        );
        expect(updatedCard).toEqual(mockCard);
    });

    test('should delete a card', async () => {
        mockedAxios.onDelete('/api/card/1234').replyOnce(200);

        // will fail if any error is thrown
        await CardClient.deleteCard('1234');
    });

    test('should request to play a card', async () => {
        const cardId = '4567';
        const mockCardPlayRequest: CardPlayRequest = {
            id: cardId,
        };
        mockedAxios
            .onPost('/api/card/play', mockCardPlayRequest)
            .replyOnce(200);

        await CardClient.playCard(mockCardPlayRequest);
    });
});
