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
import Rules, { initialRules } from '../models/Rules';
import QueryUpdatesClient from '../services/QueryUpdatesClient';
import SseClient from '../services/Sse/SseClient';
import { SseNotificationType } from '../services/Sse/SseNotificationType';

const rulesSyncEffect: AtomEffect<Rules> = ({ setSelf }) => {
    SseClient.shared().subscribe(SseNotificationType.RULES, (rules: Rules) => {
        setSelf(rules);
    });

    QueryUpdatesClient.shared().setRulesChangedCallback((rules: Rules) => {
        setSelf(rules);
    });

    return () => {
        SseClient.shared().unsubscribe();
        QueryUpdatesClient.shared().setRulesChangedCallback(undefined);
    };
};

export const rulesState = atom<Rules>({
    key: 'rulesState',
    default: initialRules,
    effects: [rulesSyncEffect],
});
