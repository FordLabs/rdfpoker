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

import { atom, AtomEffect } from 'recoil';
import Card from '../models/Card';
import QueryUpdatesClient from '../services/QueryUpdatesClient';

const cardsOnTableSyncEffect: AtomEffect<Array<Card>> = ({ setSelf }) => {
    QueryUpdatesClient.shared().setCardsOnTableChangedCallback(
        (cards: Array<Card>) => {
            setSelf(cards);
        },
    );

    return () => {
        QueryUpdatesClient.shared().setCardsOnTableChangedCallback(undefined);
    };
};

export const cardsOnTableState = atom<Array<Card>>({
    key: 'cardsOnTableState',
    default: [],
    effects: [cardsOnTableSyncEffect],
});
