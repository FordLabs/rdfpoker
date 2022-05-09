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

import SseClient from './SseClient';
import Phase from '../../models/Phase';
import { createMockEventSourceAndNotify } from '../../setupTests';
import CurrentPhaseNotification from './CurrentPhaseNotification';
import TurnResponse from './TurnResponse';
import { SseNotificationType } from './SseNotificationType';
import Rules, { initialRules } from '../../models/Rules';

describe('Sse Client', () => {
    const gameStateId = '1234';
    let phaseSubscriberCallbackFn: (data: CurrentPhaseNotification) => void;
    let turnSubscriberCallbackFn: (data: TurnResponse) => void;
    let rulesSubscriberCallbackFn: (data: Rules) => void;

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should subscribe to phase sse', (done) => {
        const mockCurrentPhaseNotification: CurrentPhaseNotification = {
            phase: Phase.PREPARATION,
        };
        createMockEventSourceAndNotify(
            mockCurrentPhaseNotification,
            SseNotificationType.PHASE,
        );

        phaseSubscriberCallbackFn = (data: CurrentPhaseNotification) => {
            expect(data).toEqual(mockCurrentPhaseNotification);
            done();
        };

        SseClient.shared().connect(gameStateId);
        SseClient.shared().subscribe(
            SseNotificationType.PHASE,
            phaseSubscriberCallbackFn,
        );
    });

    test('should subscribe to whoseTurn sse', (done) => {
        const mockTurnResponse: TurnResponse = {
            playerId: '5678',
            playerNickName: 'John',
        };
        createMockEventSourceAndNotify(
            mockTurnResponse,
            SseNotificationType.TURN,
        );

        turnSubscriberCallbackFn = (data: TurnResponse) => {
            expect(data).toEqual(mockTurnResponse);
            done();
        };

        SseClient.shared().connect(gameStateId);
        SseClient.shared().subscribe(
            SseNotificationType.TURN,
            turnSubscriberCallbackFn,
        );
    });

    test('should subscribe to rules sse', (done) => {
        createMockEventSourceAndNotify(initialRules, SseNotificationType.RULES);

        rulesSubscriberCallbackFn = (data: Rules) => {
            expect(data).toEqual(initialRules);
            done();
        };

        SseClient.shared().connect(gameStateId);
        SseClient.shared().subscribe(
            SseNotificationType.RULES,
            rulesSubscriberCallbackFn,
        );
    });
});
