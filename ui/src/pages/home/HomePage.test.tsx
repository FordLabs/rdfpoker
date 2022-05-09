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

import { screen } from '@testing-library/react';
import React from 'react';
import HomePage from './HomePage';
import userEvent from '@testing-library/user-event';
import { renderWithRouterMatch, TestVariables } from '../../TestUtils';
import PlayerClient from '../../services/Player/PlayerClient';
import GameStateClient from '../../services/GameState/GameStateClient';

jest.mock('../../services/GameState/GameStateClient');
jest.mock('../../services/Player/PlayerClient');

describe('HomePage', () => {
    describe('UI Elements', () => {
        beforeEach(() => {
            renderWithRouterMatch(<HomePage />);
        });

        test('should disable join game button when no game id entered', async () => {
            const joinGameButton = await screen.findByText('Join Game');
            expect(joinGameButton).toBeDisabled();

            const existingGameTextField = await screen.findByLabelText(
                'Game Id:',
            );
            await userEvent.clear(existingGameTextField);
            await userEvent.type(
                existingGameTextField,
                TestVariables.gameStateId,
            );

            expect(joinGameButton).not.toBeDisabled();
        });

        test('should show field to enter nickname by default', async () => {
            await screen.findByLabelText('Nickname:');
        });

        test('should show field to enter existing player id if choosing existing player radio', async () => {
            const existingPlayerRadioButton = await screen.findByTestId(
                'existingPlayerRadioExisting',
            );
            await userEvent.click(existingPlayerRadioButton);
            await screen.findByLabelText('Player Id:');
        });

        test('should disable join game button if existing player and no player/game id provided', async () => {
            const existingPlayerRadioButton = await screen.findByTestId(
                'existingPlayerRadioExisting',
            );
            await userEvent.click(existingPlayerRadioButton);
            await screen.findByLabelText('Player Id:');

            const rejoinGameButton = await screen.findByText('Rejoin Game');
            expect(rejoinGameButton).toBeDisabled();

            const existingGameTextField = await screen.findByLabelText(
                'Game Id:',
            );
            await userEvent.clear(existingGameTextField);
            await userEvent.type(
                existingGameTextField,
                TestVariables.gameStateId,
            );

            expect(rejoinGameButton).toBeDisabled();

            const existingPlayerTextField = await screen.findByLabelText(
                'Player Id:',
            );
            await userEvent.clear(existingPlayerTextField);
            await userEvent.type(existingPlayerTextField, '5678');

            expect(rejoinGameButton).not.toBeDisabled();
        });
    });

    test('should prefill game id if provided via url', async () => {
        renderWithRouterMatch(<HomePage />, {
            path: '/:providedGameStateId',
            route: `/${TestVariables.gameStateId}`,
        });
        const existingGameTextField = await screen.findByLabelText('Game Id:');
        expect(existingGameTextField).toHaveValue(TestVariables.gameStateId);
    });

    test('should auto focus nickname if game id provided via url', async () => {
        renderWithRouterMatch(<HomePage />, {
            path: '/:providedGameStateId',
            route: `/${TestVariables.gameStateId}`,
        });
        const nicknameTextField = await screen.findByLabelText('Nickname:');
        expect(nicknameTextField).toHaveFocus();
    });

    test('should have link to learn how to play', async () => {
        renderWithRouterMatch(<HomePage />);
        const externalLink = await screen.findByRole('link');
        expect(externalLink.getAttribute('href')).toEqual(
            'https://github.com/FordLabs/RDFPoker#usage',
        );
    });

    describe('Http Requests', () => {
        beforeEach(() => {
            renderWithRouterMatch(<HomePage />);
        });

        test('should create a Player when clicking create new game giving nickName "Dealer"', async () => {
            const createNewGameButton = await screen.findByText(
                'Create New Game',
            );
            await userEvent.click(createNewGameButton);

            expect(PlayerClient.createPlayer).toHaveBeenCalledWith(
                TestVariables.gameStateId,
                'Dealer',
                true,
            );
        });

        test('should create a nicknamed player when clicking join game with provided nickname field', async () => {
            const existingGameTextField = await screen.findByLabelText(
                'Game Id:',
            );
            await userEvent.clear(existingGameTextField);
            await userEvent.type(
                existingGameTextField,
                TestVariables.gameStateId,
            );

            const nickNameTextField = await screen.findByLabelText('Nickname:');
            await userEvent.clear(nickNameTextField);
            await userEvent.type(nickNameTextField, 'Robert');

            const joinGameButton = await screen.findByText('Join Game');
            await userEvent.click(joinGameButton);

            expect(PlayerClient.createPlayer).toHaveBeenCalledWith(
                TestVariables.gameStateId,
                'Robert',
                false,
            );
        });

        test('should validate player and game exist when clicking join game with existing player', async () => {
            const existingGameTextField = await screen.findByLabelText(
                'Game Id:',
            );
            await userEvent.clear(existingGameTextField);
            await userEvent.type(
                existingGameTextField,
                TestVariables.gameStateId,
            );

            const existingPlayerRadioButton = await screen.findByTestId(
                'existingPlayerRadioExisting',
            );
            await userEvent.click(existingPlayerRadioButton);
            await screen.findByLabelText('Player Id:');

            const existingPlayerTextField = await screen.findByLabelText(
                'Player Id:',
            );
            await userEvent.clear(existingPlayerTextField);
            await userEvent.type(existingPlayerTextField, 'fdsa');

            const joinExistingGameButton = await screen.findByText(
                'Rejoin Game',
            );
            await userEvent.click(joinExistingGameButton);

            expect(PlayerClient.getPlayer).toHaveBeenCalledWith('fdsa');
            expect(GameStateClient.getGameState).toHaveBeenCalledWith(
                TestVariables.gameStateId,
            );
        });
    });

    describe('Errors', () => {
        beforeEach(() => {
            renderWithRouterMatch(<HomePage />);
        });

        test('should show error if trying to enter non-existing game', async () => {
            const existingGameTextField = await screen.findByLabelText(
                'Game Id:',
            );
            await userEvent.clear(existingGameTextField);
            await userEvent.type(existingGameTextField, 'merp');

            GameStateClient.getGameState = jest.fn().mockRejectedValue(null);

            const joinExistingGameButton = await screen.findByText('Join Game');
            await userEvent.click(joinExistingGameButton);

            await screen.findByText('Sorry, that game was not found');
        });

        test('should show error if trying to enter non-existing player id', async () => {
            const existingGameTextField = await screen.findByLabelText(
                'Game Id:',
            );
            await userEvent.clear(existingGameTextField);
            await userEvent.type(
                existingGameTextField,
                TestVariables.gameStateId,
            );

            const existingPlayerRadioButton = await screen.findByTestId(
                'existingPlayerRadioExisting',
            );
            await userEvent.click(existingPlayerRadioButton);
            await screen.findByLabelText('Player Id:');

            const existingPlayerTextField = await screen.findByLabelText(
                'Player Id:',
            );
            await userEvent.clear(existingPlayerTextField);
            await userEvent.type(existingPlayerTextField, 'derp');

            GameStateClient.getGameState = jest.fn().mockResolvedValue(null);
            PlayerClient.getPlayer = jest.fn().mockRejectedValue(null);

            const joinExistingGameButton = await screen.findByText(
                'Rejoin Game',
            );
            await userEvent.click(joinExistingGameButton);

            await screen.findByText('Player id provided was not found');
        });
    });
});
