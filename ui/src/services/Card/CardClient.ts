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
import CardUpdateRequest from './CardUpdateRequest';
import Card from '../../models/Card';
import CardAddRequest from './CardAddRequest';
import CardPlayRequest from './CardPlayRequest';

const cardApiBase = '/api/card';

class CardClient {
    static async updateCard(
        cardUpdateRequest: CardUpdateRequest,
    ): Promise<Card> {
        const axiosResponse: AxiosResponse<Card> = await axios.put(
            cardApiBase,
            cardUpdateRequest,
        );
        return axiosResponse.data;
    }

    static async createCard(playerId: string): Promise<Card> {
        const cardAddRequest: CardAddRequest = {
            playerId,
        };
        const response: AxiosResponse<Card> = await axios.post(
            cardApiBase,
            cardAddRequest,
        );
        return response.data;
    }

    static async deleteCard(cardId: string) {
        return await axios.delete(`${cardApiBase}/${cardId}`);
    }

    static async playCard(cardPlayRequest: CardPlayRequest) {
        return await axios.post(`${cardApiBase}/play`, cardPlayRequest);
    }
}

export default CardClient;
