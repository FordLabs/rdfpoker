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
import RulesUpdateRequest from './RulesUpdateRequest';
import Rules, { initialRules } from '../../models/Rules';
import RulesClient from './RulesClient';

describe('RulesClient', () => {
    const gameStateId = '1234';

    afterEach(() => {
        mockedAxios.reset();
    });

    test('should update rules', async () => {
        const mockRulesUpdateRequest: RulesUpdateRequest = {
            gameStateId,
            prompt: 'herp',
        };
        mockedAxios
            .onPut('/api/rules', mockRulesUpdateRequest)
            .replyOnce(200, initialRules);

        const updatedRules: Rules = await RulesClient.updateRules(
            mockRulesUpdateRequest,
        );
        expect(updatedRules).toEqual(initialRules);
    });

    test('should get rules for game', async () => {
        mockedAxios
            .onGet(`/api/rules/${gameStateId}`)
            .replyOnce(200, initialRules);

        const rules: Rules = await RulesClient.getRules(gameStateId);
        expect(rules).toEqual(initialRules);
    });
});
