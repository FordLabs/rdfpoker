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

import { createMockEventSource } from '../../setupTests';
import { act, screen, waitFor } from '@testing-library/react';
import React from 'react';
import PlayerPage from './PlayerPage';
import Phase from '../../models/Phase';
import { getNewCard } from '../../models/Card';
import { RecoilRoot } from 'recoil';
import Player from '../../models/Player';
import { noPlayerTakingTurn } from '../../state/WhoseTurnAtom';
import userEvent from '@testing-library/user-event';
import { renderWithRouterMatch, TestVariables } from '../../TestUtils';
import StateResponse from '../../services/GameState/StateResponse';
import GameStateClient from '../../services/GameState/GameStateClient';
import PlayerClient from '../../services/Player/PlayerClient';
import { initialRules } from '../../models/Rules';

jest.mock('../../services/GameState/GameStateClient');
jest.mock('../../services/Player/PlayerClient');

describe('The Player Page', () => {
    beforeEach(() => {
        createMockEventSource();
    });

    describe('Player is new to the game', () => {
        beforeEach(async () => {
            await act(async () => {
                renderWithRouterMatch(
                    <RecoilRoot>
                        <PlayerPage />
                    </RecoilRoot>,
                    {
                        path: '/:gameStateId/:playerId',
                        route: `/${TestVariables.gameStateId}/${TestVariables.player.id}`,
                    },
                );
            });
        });

        test(`should show the player's hand`, async () => {
            await screen.findByTestId('deck');
        });

        describe('Settings', () => {
            test('should show settings page when clicking settings button', async () => {
                expect(screen.queryByLabelText('nickname:')).not.toBeVisible();

                const settingsButton = await screen.findByAltText('Settings');
                await userEvent.click(settingsButton);

                await screen.findByLabelText('nickname:');
            });

            test('should prefill nickname when available', async () => {
                const settingsButton = await screen.findByAltText('Settings');
                await userEvent.click(settingsButton);

                const nickNameLabel = await screen.findByLabelText('nickname:');
                expect(nickNameLabel).toHaveValue('Woody');
            });

            test('should show updated nickname in header when changing nickname', async () => {
                const settingsButton = await screen.findByAltText('Settings');
                await userEvent.click(settingsButton);

                const nicknameInputField = await screen.findByLabelText(
                    'nickname:',
                );
                const updatedNickname = 'Herbert';
                await userEvent.clear(nicknameInputField);
                await userEvent.type(nicknameInputField, updatedNickname);

                const updatedPlayer: Player = {
                    ...TestVariables.player,
                    nickName: updatedNickname,
                };
                PlayerClient.updatePlayer = jest
                    .fn()
                    .mockResolvedValue(updatedPlayer);
                const updateNicknameButton = await screen.findByText(
                    'Change Nick Name',
                );
                await userEvent.click(updateNicknameButton);

                await screen.findByText(`Player: ${updatedNickname}`);
            });

            test('should close when clicking somewhere on poker table', async () => {
                const settingsButton = await screen.findByAltText('Settings');
                await userEvent.click(settingsButton);

                const somethingThatIsNotSettingsTab = await screen.findByTestId(
                    'prompter',
                );
                await userEvent.click(somethingThatIsNotSettingsTab);

                expect(screen.queryByLabelText('nickname:')).not.toBeVisible();
            });
        });
    });

    describe('Player was not new to the game', () => {
        const otherPlayerId = '564';
        const card1 = {
            ...getNewCard(),
            content: 'will not see me',
            playerId: otherPlayerId,
        };

        const card2 = {
            ...getNewCard(),
            content: 'hope you see me',
            playerId: TestVariables.player.id,
        };
        const newMePlayer: Player = {
            ...TestVariables.player,
            cards: [card2],
        };

        test('should auto-populate cards for player if already exist', async () => {
            PlayerClient.getPlayer = jest.fn().mockResolvedValue(newMePlayer);

            await act(async () => {
                renderWithRouterMatch(
                    <RecoilRoot>
                        <PlayerPage />
                    </RecoilRoot>,
                    {
                        path: '/:gameStateId/:playerId',
                        route: `/${TestVariables.gameStateId}/${TestVariables.player.id}`,
                    },
                );
            });

            await screen.findByDisplayValue(card2.content);
            expect(
                screen.queryByDisplayValue(card1.content),
            ).not.toBeInTheDocument();
        });
    });

    describe('dealer joined game', () => {
        const dealer: Player = {
            ...TestVariables.player,
            isDealer: true,
        };

        test('should auto open the settings drawer', async () => {
            PlayerClient.getPlayer = jest.fn().mockResolvedValue(dealer);

            await act(async () => {
                renderWithRouterMatch(
                    <RecoilRoot>
                        <PlayerPage />
                    </RecoilRoot>,
                    {
                        path: '/:gameStateId/:playerId',
                        route: `/${TestVariables.gameStateId}/${TestVariables.player.id}`,
                    },
                );
            });
            const nickNameLabel = await screen.findByLabelText('nickname:');
            await waitFor(() => {
                expect(nickNameLabel).toBeVisible();
            });
        });
    });

    test('should not show hand of player in betting phase', async () => {
        const mockStateResponse: StateResponse = {
            cardsOnTable: [],
            phase: Phase.BETTING,
            rules: initialRules,
            whoseTurn: noPlayerTakingTurn,
        };
        GameStateClient.getGameState = jest
            .fn()
            .mockResolvedValue(mockStateResponse);

        await act(async () => {
            renderWithRouterMatch(
                <RecoilRoot>
                    <PlayerPage />
                </RecoilRoot>,
                {
                    path: '/:gameStateId/:playerId',
                    route: `/${TestVariables.gameStateId}/${TestVariables.player.id}`,
                },
            );
        });

        expect(screen.queryByTestId('hand')).not.toBeInTheDocument();
    });
});
