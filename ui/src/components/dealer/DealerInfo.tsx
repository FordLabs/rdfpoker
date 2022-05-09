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

import React, { useEffect, useRef, useState } from 'react';
import './DealerInfo.scss';
import GameStateAdvanceRequest from '../../services/GameState/GameStateAdvanceRequest';
import RulesUpdateRequest from '../../services/Rules/RulesUpdateRequest';
import RulesClient from '../../services/Rules/RulesClient';
import GameStateClient from '../../services/GameState/GameStateClient';
import Phase from '../../models/Phase';
import Select, { OnChangeValue } from 'react-select';
import RulesList, { RuleHandlers } from './RulesList';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import Rules from '../../models/Rules';
import { rulesState } from '../../state/RulesAtom';

export interface DealerInfoProps {
    gameStateId: string;
}

type DealerInfoStringOptionProps = { value: string; label: string };
const phaseOptions: Array<DealerInfoStringOptionProps> = Object.keys(Phase).map(
    (phase) => ({ value: phase, label: phase }),
);

function DealerInfo({ gameStateId }: DealerInfoProps) {
    const rulesListRef = useRef<RuleHandlers>(null);

    const [currentPhase, setCurrentPhase] = useRecoilState(currentPhaseState);
    const setRules = useSetRecoilState(rulesState);

    const [rulesUpdateError, setRulesUpdateError] = useState<boolean>(false);
    const [currentPhaseOption, setCurrentPhaseOption] = useState<
        OnChangeValue<DealerInfoStringOptionProps, false>
    >(phaseOptions[0]);

    useEffect(() => {
        setCurrentPhaseOption({
            value: currentPhase,
            label: currentPhase,
        });
    }, [currentPhase]);

    async function updateRules() {
        setRulesUpdateError(false);
        if (rulesListRef.current) {
            const rulesUpdateRequest: RulesUpdateRequest =
                rulesListRef.current.buildRulesUpdateRequest();

            try {
                const updatedRules: Rules = await RulesClient.updateRules(
                    rulesUpdateRequest,
                );
                setRules(updatedRules);
            } catch (e) {
                setRulesUpdateError(true);
            }
        } else {
            console.log('attempt to update prompt failed');
        }
    }

    async function advanceGameState() {
        if (currentPhaseOption) {
            const gameStateAdvanceRequest: GameStateAdvanceRequest = {
                id: gameStateId,
                phaseString: currentPhaseOption.label,
            };
            await GameStateClient.advanceGameState(gameStateAdvanceRequest);
            setCurrentPhase(currentPhaseOption.label as Phase);
        } else {
            console.log('attempt to update state failed');
        }
    }

    return (
        <div className="dealer">
            <div className="phase">
                <div className="dealerElement phaseDropDown">
                    <label htmlFor="currentPhase">Current Game Phase:</label>
                    <Select
                        defaultValue={currentPhaseOption}
                        value={currentPhaseOption}
                        onChange={setCurrentPhaseOption}
                        options={phaseOptions}
                        name="currentPhase"
                        inputId="currentPhase"
                        isSearchable={false}
                    />
                    <button onClick={advanceGameState}>Update Phase</button>
                </div>
            </div>

            {currentPhase === Phase.PREGAME && (
                <>
                    <div className="separator" />

                    <div className="rules">
                        <RulesList
                            ref={rulesListRef}
                            gameStateId={gameStateId}
                            showRulesUpdateError={rulesUpdateError}
                        />
                        <button onClick={updateRules}>Update Rules</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default DealerInfo;
