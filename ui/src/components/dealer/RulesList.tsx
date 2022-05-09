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

import TextField from '../textfield/TextField';
import React, {
    forwardRef,
    Ref,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import RulesUpdateRequest from '../../services/Rules/RulesUpdateRequest';
import { useRecoilValue } from 'recoil';
import { rulesState } from '../../state/RulesAtom';

interface RulesListProps {
    gameStateId: string;
    showRulesUpdateError: boolean;
}

export type RuleHandlers = {
    buildRulesUpdateRequest: () => RulesUpdateRequest;
};

const RulesList = forwardRef(
    (
        { gameStateId, showRulesUpdateError }: RulesListProps,
        ref: Ref<RuleHandlers>,
    ) => {
        const rules = useRecoilValue(rulesState);
        const [inputPrompt, setInputPrompt] = useState<string>('');
        const [inputMaxCards, setInputMaxCards] = useState<string>('');
        const [inputChipsPerPlayer, setInputChipsPerPlayer] =
            useState<string>('');
        const [inputPreparationTimer, setInputPreparationTimer] =
            useState<string>('');
        const [inputTurnTimer, setInputTurnTimer] = useState<string>('');
        const [inputBettingTimer, setInputBettingTimer] = useState<string>('');
        const [inputMinChipsForDiscussion, setInputMinChipsForDiscussion] =
            useState<string>('');
        const [inputMinCardContribution, setInputMinCardContribution] =
            useState<string>('');

        useEffect(() => {
            setInputPrompt(rules.prompt);
            setInputMaxCards(rules.maxCardsInHand.toString());
            setInputChipsPerPlayer(rules.chipsAllottedPerPlayer.toString());
            setInputPreparationTimer(rules.preparationTimerDuration.toString());
            setInputTurnTimer(rules.turnTimerDuration.toString());
            setInputBettingTimer(rules.bettingTimerDuration.toString());
            setInputMinChipsForDiscussion(
                rules.minChipsForCardPostGameDiscussion.toString(),
            );
            setInputMinCardContribution(rules.minCardContribution.toString());
        }, [rules]);

        useImperativeHandle(ref, () => ({
            buildRulesUpdateRequest(): RulesUpdateRequest {
                return {
                    gameStateId,
                    prompt: inputPrompt,
                    maxCardsInHand: parseInt(inputMaxCards),
                    chipsAllottedPerPlayer: parseInt(inputChipsPerPlayer),
                    preparationTimerDuration: parseInt(inputPreparationTimer),
                    turnTimerDuration: parseInt(inputTurnTimer),
                    bettingTimerDuration: parseInt(inputBettingTimer),
                    minChipsForCardPostGameDiscussion: parseInt(
                        inputMinChipsForDiscussion,
                    ),
                    minCardContribution: parseInt(inputMinCardContribution),
                };
            },
        }));

        return (
            <>
                <div className="dealerElement textRule">
                    <TextField
                        labelText="Game Prompt:"
                        labelId="promptInputField"
                        value={inputPrompt}
                        onChange={setInputPrompt}
                        showError={false}
                    />
                </div>
                <div className="dealerElement smallNumberRule">
                    <TextField
                        labelText="Max Cards Per Player:"
                        labelId="maxCardsInputField"
                        value={inputMaxCards}
                        onChange={setInputMaxCards}
                        showError={false}
                    />
                </div>
                <div className="dealerElement smallNumberRule">
                    <TextField
                        labelText="Chips Allotted Per Player:"
                        labelId="chipsPerPlayerInputField"
                        value={inputChipsPerPlayer}
                        onChange={setInputChipsPerPlayer}
                        showError={false}
                    />
                </div>
                <div className="dealerElement smallNumberRule">
                    <TextField
                        labelText="Time For Preparation:"
                        labelId="preparationTimerInputField"
                        value={inputPreparationTimer}
                        onChange={setInputPreparationTimer}
                        showError={false}
                    />
                </div>
                <div className="dealerElement smallNumberRule">
                    <TextField
                        labelText={`Time For Each Player's Turn:`}
                        labelId="turnTimerInputField"
                        value={inputTurnTimer}
                        onChange={setInputTurnTimer}
                        showError={false}
                    />
                </div>
                <div className="dealerElement smallNumberRule">
                    <TextField
                        labelText="Time For Players to Bet:"
                        labelId="bettingTimerInputField"
                        value={inputBettingTimer}
                        onChange={setInputBettingTimer}
                        showError={false}
                    />
                </div>
                <div className="dealerElement smallNumberRule">
                    <TextField
                        labelText="Min Chips Required For Discussion:"
                        labelId="minChipsToDiscussInputField"
                        value={inputMinChipsForDiscussion}
                        onChange={setInputMinChipsForDiscussion}
                        showError={false}
                    />
                </div>
                <div className="dealerElement smallNumberRule">
                    <TextField
                        labelText="Min Number of Cards Each Player Must Contribute:"
                        labelId="minCardContributionInputField"
                        value={inputMinCardContribution}
                        onChange={setInputMinCardContribution}
                        showError={showRulesUpdateError}
                        errorText="Invalid Rules Provided"
                    />
                </div>
            </>
        );
    },
);

export default RulesList;
