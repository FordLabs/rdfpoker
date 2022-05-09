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
import Phase from '../../models/Phase';
import { rulesState } from '../../state/RulesAtom';
import { render, screen } from '@testing-library/react';
import RulesUpdateRequest from '../../services/Rules/RulesUpdateRequest';
import selectEvent from 'react-select-event';
import GameStateAdvanceRequest from '../../services/GameState/GameStateAdvanceRequest';
import DealerInfo from './DealerInfo';
import { RecoilRoot } from 'recoil';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import userEvent from '@testing-library/user-event';
import { initialRules } from '../../models/Rules';
import RulesClient from '../../services/Rules/RulesClient';
import GameStateClient from '../../services/GameState/GameStateClient';

jest.mock('../../services/Rules/RulesClient');
jest.mock('../../services/GameState/GameStateClient');

describe('Dealer Info', () => {
    const gameStateId = '1234';
    const rules = {
        ...initialRules,
        prompt: 'supadoopa',
    };

    describe('PREGAME phase', () => {
        beforeEach(() => {
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(currentPhaseState, Phase.PREGAME);
                        snap.set(rulesState, rules);
                    }}
                >
                    <DealerInfo gameStateId={gameStateId} />
                </RecoilRoot>,
            );
        });

        test('should show the current rules on load', async () => {
            // prompt
            const promptInputField = await screen.findByLabelText(
                'Game Prompt:',
            );
            expect(promptInputField).toHaveValue('supadoopa');
            // max cards
            const maxCardsInputField = await screen.findByLabelText(
                'Max Cards Per Player:',
            );
            expect(maxCardsInputField).toHaveValue(
                initialRules.maxCardsInHand.toString(),
            );
            // chips allotted per player
            const chipsAllottedInputField = await screen.findByLabelText(
                'Chips Allotted Per Player:',
            );
            expect(chipsAllottedInputField).toHaveValue(
                initialRules.chipsAllottedPerPlayer.toString(),
            );
            // preparation timer
            const preparationTimerInputField = await screen.findByLabelText(
                'Time For Preparation:',
            );
            expect(preparationTimerInputField).toHaveValue(
                initialRules.preparationTimerDuration.toString(),
            );
            // turn timer
            const turnTimerInputField = await screen.findByLabelText(
                `Time For Each Player's Turn:`,
            );
            expect(turnTimerInputField).toHaveValue(
                initialRules.turnTimerDuration.toString(),
            );
            // betting timer
            const bettingTimerInputField = await screen.findByLabelText(
                'Time For Players to Bet:',
            );
            expect(bettingTimerInputField).toHaveValue(
                initialRules.bettingTimerDuration.toString(),
            );
            // min chips to discuss
            const minChipsToDiscussInputField = await screen.findByLabelText(
                'Min Chips Required For Discussion:',
            );
            expect(minChipsToDiscussInputField).toHaveValue(
                initialRules.minChipsForCardPostGameDiscussion.toString(),
            );
            // min card contribution
            const minCardContributionInputField = await screen.findByLabelText(
                'Min Number of Cards Each Player Must Contribute:',
            );
            expect(minCardContributionInputField).toHaveValue(
                initialRules.minCardContribution.toString(),
            );
        });

        test('should make post to update rules when clicking update rules button', async () => {
            // prompt
            const promptInputField = await screen.findByLabelText(
                'Game Prompt:',
            );
            const updatedPrompt = 'derp';
            await userEvent.clear(promptInputField);
            await userEvent.type(promptInputField, updatedPrompt);
            // max cards
            const maxCardsInputField = await screen.findByLabelText(
                'Max Cards Per Player:',
            );
            const updatedMaxCards = '3';
            await userEvent.clear(maxCardsInputField);
            await userEvent.type(maxCardsInputField, updatedMaxCards);
            // chips allotted per player
            const chipsPerPlayer = await screen.findByLabelText(
                'Chips Allotted Per Player:',
            );
            const updatedChipsPerPlayer = '4';
            await userEvent.clear(chipsPerPlayer);
            await userEvent.type(chipsPerPlayer, updatedChipsPerPlayer);
            // preparation timer
            const preparationTimerInputField = await screen.findByLabelText(
                'Time For Preparation:',
            );
            const updatedPreparationTimer = '5';
            await userEvent.clear(preparationTimerInputField);
            await userEvent.type(
                preparationTimerInputField,
                updatedPreparationTimer,
            );
            // turn timer
            const updatedTurnTimer = '6';
            const turnTimerInputField = await screen.findByLabelText(
                `Time For Each Player's Turn:`,
            );
            await userEvent.clear(turnTimerInputField);
            await userEvent.type(turnTimerInputField, updatedTurnTimer);
            // betting timer
            const updatedBettingTimer = '7';
            const bettingTimerInputField = await screen.findByLabelText(
                'Time For Players to Bet:',
            );
            await userEvent.clear(bettingTimerInputField);
            await userEvent.type(bettingTimerInputField, updatedBettingTimer);
            // min chips to discuss
            const updatedMinChipsToDiscuss = '8';
            const minChipsToDiscussInputField = await screen.findByLabelText(
                'Min Chips Required For Discussion:',
            );
            await userEvent.clear(minChipsToDiscussInputField);
            await userEvent.type(
                minChipsToDiscussInputField,
                updatedMinChipsToDiscuss,
            );
            // min card contribution
            const updatedMinCardContribution = '9';
            const minCardContributionInputField = await screen.findByLabelText(
                'Min Number of Cards Each Player Must Contribute:',
            );
            await userEvent.clear(minCardContributionInputField);
            await userEvent.type(
                minCardContributionInputField,
                updatedMinCardContribution,
            );

            const updatePromptButton = await screen.findByText('Update Rules');
            await userEvent.click(updatePromptButton);

            const expectedRulesUpdateRequest: RulesUpdateRequest = {
                gameStateId,
                prompt: updatedPrompt,
                maxCardsInHand: parseInt(updatedMaxCards),
                chipsAllottedPerPlayer: parseInt(updatedChipsPerPlayer),
                preparationTimerDuration: parseInt(updatedPreparationTimer),
                turnTimerDuration: parseInt(updatedTurnTimer),
                bettingTimerDuration: parseInt(updatedBettingTimer),
                minChipsForCardPostGameDiscussion: parseInt(
                    updatedMinChipsToDiscuss,
                ),
                minCardContribution: parseInt(updatedMinCardContribution),
            };
            expect(RulesClient.updateRules).toHaveBeenCalledWith(
                expectedRulesUpdateRequest,
            );
        });

        test('should show current phase of game', async () => {
            await screen.findByText(Phase.PREGAME);
        });

        test('should make post to update phase of game when clicking update phase button', async () => {
            const currentPhaseSelect = await screen.findByLabelText(
                'Current Game Phase:',
            );
            await userEvent.click(currentPhaseSelect);
            await selectEvent.select(currentPhaseSelect, Phase.BETTING);

            const updatePhaseButton = await screen.findByText('Update Phase');
            await userEvent.click(updatePhaseButton);

            const gameStateAdvanceRequest: GameStateAdvanceRequest = {
                id: gameStateId,
                phaseString: Phase.BETTING,
            };
            expect(GameStateClient.advanceGameState).toHaveBeenCalledWith(
                gameStateAdvanceRequest,
            );
        });

        test('should show an error if trying to set invalid rules', async () => {
            expect(
                screen.queryByText('Invalid Rules Provided'),
            ).not.toBeInTheDocument();

            // max cards
            const maxCardsInputField = await screen.findByLabelText(
                'Max Cards Per Player:',
            );
            const updatedMaxCards = '-3';
            await userEvent.type(maxCardsInputField, updatedMaxCards);

            RulesClient.updateRules = jest.fn().mockRejectedValue(null);

            const updatePromptButton = await screen.findByText('Update Rules');
            await userEvent.click(updatePromptButton);

            await screen.findByText('Invalid Rules Provided');
        });
    });

    describe('Different phase', () => {
        test('should only show phase shifter, not rules', async () => {
            render(
                <RecoilRoot
                    initializeState={(snap) => {
                        snap.set(currentPhaseState, Phase.POSTGAME);
                        snap.set(rulesState, rules);
                    }}
                >
                    <DealerInfo gameStateId={gameStateId} />
                </RecoilRoot>,
            );

            await screen.findByLabelText('Current Game Phase:');
            expect(screen.queryByText('Game Prompt:')).not.toBeInTheDocument();
        });
    });
});
