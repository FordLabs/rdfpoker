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
import Phase from '../models/Phase';
import CurrentPhaseNotification from '../services/Sse/CurrentPhaseNotification';
import SseClient from '../services/Sse/SseClient';
import { SseNotificationType } from '../services/Sse/SseNotificationType';
import QueryUpdatesClient from '../services/QueryUpdatesClient';

const initialPhase: Phase = Phase.PREGAME;

const currentPhaseSyncEffect: AtomEffect<Phase> = ({ setSelf }) => {
    SseClient.shared().subscribe(
        SseNotificationType.PHASE,
        (currentPhaseNotification: CurrentPhaseNotification) => {
            setSelf(currentPhaseNotification.phase);
        },
    );

    QueryUpdatesClient.shared().setCurrentPhaseChangedCallback(
        (phase: Phase) => {
            setSelf(phase);
        },
    );

    return () => {
        SseClient.shared().unsubscribe();
        QueryUpdatesClient.shared().setCurrentPhaseChangedCallback(undefined);
    };
};

export const currentPhaseState = atom<Phase>({
    key: 'currentPhaseState',
    default: initialPhase,
    effects: [currentPhaseSyncEffect],
});
