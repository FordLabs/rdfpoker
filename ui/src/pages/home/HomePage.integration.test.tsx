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
import { createMockEventSource, renderWithRouter } from '../../setupTests';
import userEvent from '@testing-library/user-event';
import AppRoutes from '../../AppRoutes';
import { TestVariables } from '../../TestUtils';

jest.mock('../../services/GameState/GameStateClient');
jest.mock('../../services/Player/PlayerClient');

describe('HomePage Integration Tests', () => {
    beforeEach(() => {
        createMockEventSource();

        renderWithRouter(<AppRoutes />);
    });

    test('should auto-navigate to lobby of game created with settings open', async () => {
        const createNewGameButton = await screen.findByText('Create New Game');
        await userEvent.click(createNewGameButton);

        await screen.findByTestId('prompter');
    });

    test('should auto-navigate to provided game for new player', async () => {
        const existingGameTextField = await screen.findByLabelText('Game Id:');
        await userEvent.type(existingGameTextField, TestVariables.gameStateId);

        const nickNameTextField = await screen.findByLabelText('Nickname:');
        await userEvent.type(nickNameTextField, 'bobby');

        const joinExistingGameButton = await screen.findByText('Join Game');
        await userEvent.click(joinExistingGameButton);

        await screen.findByTestId('prompter');
        expect(screen.queryByText('Update Rules')).not.toBeInTheDocument();
    });

    test('should auto-navigate to game provided for existing player', async () => {
        const existingGameTextField = await screen.findByLabelText('Game Id:');
        await userEvent.type(existingGameTextField, TestVariables.gameStateId);

        const existingPlayerRadioButton = await screen.findByTestId(
            'existingPlayerRadioExisting',
        );
        await userEvent.click(existingPlayerRadioButton);
        await screen.findByLabelText('Player Id:');

        const existingPlayerTextField = await screen.findByLabelText(
            'Player Id:',
        );
        await userEvent.type(existingPlayerTextField, TestVariables.player.id);

        const joinExistingGameButton = await screen.findByText('Rejoin Game');
        await userEvent.click(joinExistingGameButton);

        await screen.findByTestId('prompter');
        await screen.findByText('Player: Woody');
    });
});
