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
import Phase from '../../models/Phase';
import TurnResponse from '../../services/Sse/TurnResponse';
import { RecoilRoot } from 'recoil';
import Prompter from './Prompter';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import React from 'react';
import { rulesState } from '../../state/RulesAtom';
import Rules, { initialRules } from '../../models/Rules';
import { whoseTurnState } from '../../state/WhoseTurnAtom';
import { initialPlayer } from '../../state/PlayerAtom';

describe('Prompter', () => {
    test('shows correct prompt on load', async () => {
        const expectedPrompt = 'Helllo?';
        const mockRules: Rules = {
            ...initialRules,
            prompt: expectedPrompt,
        };

        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(rulesState, mockRules);
                }}
            >
                <Prompter />
            </RecoilRoot>,
        );
        await screen.findByText(expectedPrompt);
    });

    test('shows "My Turn" when phase is TURN and it is my turn', async () => {
        const mockTurnResponse: TurnResponse = {
            playerId: initialPlayer.id,
            playerNickName: null,
        };
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.TURN);
                    snap.set(whoseTurnState, mockTurnResponse);
                }}
            >
                <Prompter />
            </RecoilRoot>,
        );

        await screen.findByText('My Turn');
    });

    test('shows other players id when they have no nickName when phase is TURN and it is not my turn', async () => {
        const mockTurnResponse: TurnResponse = {
            playerId: '1999',
            playerNickName: null,
        };
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.TURN);
                    snap.set(whoseTurnState, mockTurnResponse);
                }}
            >
                <Prompter />
            </RecoilRoot>,
        );

        await screen.findByText(`Player 1999's Turn`);
    });

    test('shows other players nickName when available when phase is TURN and it is not my turn', async () => {
        const mockTurnResponse: TurnResponse = {
            playerId: '1999',
            playerNickName: 'Bob',
        };
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.TURN);
                    snap.set(whoseTurnState, mockTurnResponse);
                }}
            >
                <Prompter />
            </RecoilRoot>,
        );

        await screen.findByText(`${mockTurnResponse.playerNickName}'s Turn`);
    });

    test('indicates when in TURN phase and all cards are played', async () => {
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(currentPhaseState, Phase.TURN);
                }}
            >
                <Prompter />
            </RecoilRoot>,
        );

        await screen.findByText('Waiting on Dealer');
    });
});
