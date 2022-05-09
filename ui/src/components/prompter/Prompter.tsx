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
import './Prompter.scss';
import PromptImage from '../../images/Prompt.svg';
import { useRecoilValue } from 'recoil';
import { rulesState } from '../../state/RulesAtom';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import Phase from '../../models/Phase';
import { whoseTurnState } from '../../state/WhoseTurnAtom';
import { playerState } from '../../state/PlayerAtom';

function Prompter() {
    const currentPhase = useRecoilValue(currentPhaseState);
    const rules = useRecoilValue(rulesState);
    const whoseTurn = useRecoilValue(whoseTurnState);
    const player = useRecoilValue(playerState);

    function getPhaseString() {
        if (currentPhase === Phase.TURN) {
            if (whoseTurn.playerId === null) {
                return 'Waiting on Dealer';
            } else if (whoseTurn.playerId === player.id) {
                return 'My Turn';
            } else if (whoseTurn.playerNickName === null) {
                return `Player ${whoseTurn.playerId}'s Turn`;
            } else {
                return `${whoseTurn.playerNickName}'s Turn`;
            }
        } else {
            return currentPhase;
        }
    }

    return (
        <div className="prompter" data-testid="prompter">
            <div className="prompterLabels">
                <div>{rules.prompt}</div>
                <div>{getPhaseString()}</div>
            </div>
            <img src={PromptImage} alt="prompter" />
        </div>
    );
}

export default Prompter;
