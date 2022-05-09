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
import { render, screen, waitFor } from '@testing-library/react';
import PlayerPageHeader from './PlayerPageHeader';
import { initialPlayer, playerState } from '../../state/PlayerAtom';
import { RecoilRoot } from 'recoil';
import Player from '../../models/Player';
import userEvent from '@testing-library/user-event';
import { settingsOpenState } from '../../state/SettingsOpenAtom';

describe('PlayerPageHeader', () => {
    const gameStateId = '1234';

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should show correct game id', async () => {
        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(settingsOpenState, true);
                }}
            >
                <PlayerPageHeader gameStateId={gameStateId} />
            </RecoilRoot>,
        );
        await screen.findByText(gameStateId, { exact: false });
    });

    test('should show correct player id if no nickname', async () => {
        const mockPlayer: Player = {
            ...initialPlayer,
            id: '4567',
        };

        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(playerState, mockPlayer);
                    snap.set(settingsOpenState, true);
                }}
            >
                <PlayerPageHeader gameStateId={gameStateId} />
            </RecoilRoot>,
        );
        await screen.findByText(`Player: ${mockPlayer.id}`);
    });

    test('should show correct player nickname if available', async () => {
        const mockPlayer: Player = {
            ...initialPlayer,
            id: '4567',
            nickName: 'Peter Parker',
        };

        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(playerState, mockPlayer);
                    snap.set(settingsOpenState, true);
                }}
            >
                <PlayerPageHeader gameStateId={gameStateId} />
            </RecoilRoot>,
        );
        await screen.findByText(`Player: ${mockPlayer.nickName}`);
    });

    test('should put url in clipboard and alert user when clicking share', async () => {
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(),
            },
        });
        jest.spyOn(navigator.clipboard, 'writeText');

        Object.assign(window, {
            alert: jest.fn(),
        });
        jest.spyOn(window, 'alert');

        render(
            <RecoilRoot
                initializeState={(snap) => {
                    snap.set(settingsOpenState, true);
                }}
            >
                <PlayerPageHeader gameStateId={gameStateId} />
            </RecoilRoot>,
        );
        const shareButton = await screen.findByAltText('Share');
        await userEvent.click(shareButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
        const expectedShareUrl = `${window.location.origin}/${gameStateId}`;
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expectedShareUrl,
        );

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledTimes(1);
        });
    });
});
