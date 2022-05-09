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

import { atom, RecoilState, selectorFamily } from 'recoil';
import Card from '../models/Card';

export const cardsInHandState = atom<Array<Card>>({
    key: 'cardsInHandState',
    default: [],
});

export const cardInHandSelector: (
    cardId: string,
) => RecoilState<Card | undefined> = selectorFamily({
    key: 'cardInHandSelector',
    get:
        (cardId: string) =>
        ({ get }) => {
            const cardsInHand = get(cardsInHandState);
            return cardsInHand.find((card) => card.id === cardId);
        },
    set:
        (cardId: string) =>
        ({ set, get }, updatedCard) => {
            const cardsInHand = get(cardsInHandState);
            const updatedCardsInHand = cardsInHand.flatMap((card) => {
                if (card.id === cardId) {
                    if (updatedCard === undefined) {
                        return [];
                    } else {
                        return updatedCard;
                    }
                }
                return card;
            }) as Array<Card>;
            set(cardsInHandState, updatedCardsInHand);
        },
});
