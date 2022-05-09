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

import React from 'react';
import { render, screen } from '@testing-library/react';
import Settings from './Settings';
import Player from '../../models/Player';
import { playerState } from '../../state/PlayerAtom';
import { RecoilRoot } from 'recoil';
import userEvent from '@testing-library/user-event';
import { settingsOpenState } from '../../state/SettingsOpenAtom';
import { TestVariables } from '../../TestUtils';
import PlayerClient from '../../services/Player/PlayerClient';

jest.mock('../../services/Player/PlayerClient');

describe('Settings', () => {
    describe('not a dealer', () => {
        beforeEach(() => {
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(playerState, TestVariables.player);
                        snap.set(settingsOpenState, true);
                    }}
                >
                    <Settings gameStateId={TestVariables.gameStateId} />
                </RecoilRoot>,
            );
        });

        test('should not show any rules', () => {
            expect(
                screen.queryByText('Current Game Phase:'),
            ).not.toBeInTheDocument();
        });

        test('should show player nickname', async () => {
            const nickNameTextField = await screen.findByLabelText('nickname:');
            expect(nickNameTextField).toHaveValue(
                TestVariables.player.nickName,
            );
        });

        test('should send post when updating nickname', async () => {
            const nickNameTextField = await screen.findByLabelText('nickname:');
            await userEvent.clear(nickNameTextField);
            await userEvent.type(nickNameTextField, 'Robert');

            const updateNickNameButton = await screen.findByText(
                'Change Nick Name',
            );
            await userEvent.click(updateNickNameButton);

            expect(PlayerClient.updatePlayer).toHaveBeenCalledWith(
                TestVariables.player.id,
                'Robert',
            );
        });
    });

    describe('is a dealer', () => {
        beforeEach(() => {
            const mockDealer: Player = {
                ...TestVariables.player,
                isDealer: true,
            };

            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(playerState, mockDealer);
                        snap.set(settingsOpenState, true);
                    }}
                >
                    <Settings gameStateId={TestVariables.gameStateId} />
                </RecoilRoot>,
            );
        });

        test('should show rules', async () => {
            await screen.findByText('Current Game Phase:');
        });
    });
});
