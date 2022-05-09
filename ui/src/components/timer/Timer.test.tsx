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

import { render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import React from 'react';
import Timer from './Timer';
import Rules, { initialRules } from '../../models/Rules';
import { rulesState } from '../../state/RulesAtom';
import Phase from '../../models/Phase';

describe('Timer component', () => {
    test('should show the right time during PREPARATION phase', async () => {
        const rulesWithTimersSet: Rules = {
            ...initialRules,
            turnTimerDuration: 1,
        };

        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.PREPARATION);
                    snap.set(rulesState, rulesWithTimersSet);
                }}
            >
                <Timer />
            </RecoilRoot>,
        );

        await screen.findByText('1:00');
    });

    test('should show the right time during TURN phase', async () => {
        const rulesWithTimersSet: Rules = {
            ...initialRules,
            turnTimerDuration: 2,
        };

        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.TURN);
                    snap.set(rulesState, rulesWithTimersSet);
                }}
            >
                <Timer />
            </RecoilRoot>,
        );

        await screen.findByText('2:00');
    });

    test('should show the right time during BETTING phase', async () => {
        const rulesWithTimersSet: Rules = {
            ...initialRules,
            bettingTimerDuration: 3,
        };

        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.BETTING);
                    snap.set(rulesState, rulesWithTimersSet);
                }}
            >
                <Timer />
            </RecoilRoot>,
        );

        await screen.findByText('3:00');
    });

    test('should not show timer during PRE/POSTGAME phases', async () => {
        const { rerender } = render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.PREGAME);
                }}
            >
                <Timer />
            </RecoilRoot>,
        );
        expect(screen.queryByText('0')).not.toBeInTheDocument();

        rerender(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.POSTGAME);
                }}
            >
                <Timer />
            </RecoilRoot>,
        );
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
});
