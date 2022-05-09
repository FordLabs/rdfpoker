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
import './PlayerPageHeader.scss';
import ShareIcon from '../../images/ShareIcon.svg';
import SettingsIcon from '../../images/SettingsIcon.svg';
import { useRecoilState, useRecoilValue } from 'recoil';
import { playerState } from '../../state/PlayerAtom';
import { settingsOpenState } from '../../state/SettingsOpenAtom';

interface PlayerPageHeaderProps {
    gameStateId: string;
}

function PlayerPageHeader({ gameStateId }: PlayerPageHeaderProps): JSX.Element {
    const player = useRecoilValue(playerState);
    const [settingsOpen, setSettingsOpen] = useRecoilState(settingsOpenState);

    async function setClipboard() {
        const shareUrl = `${window.location.origin}/${gameStateId}`;
        await navigator.clipboard.writeText(shareUrl);

        window.alert('Share URL copied to clipboard!');
    }

    return (
        <div className="playerPageHeader">
            <div className="headerText">
                <div className="nameText">RDFPoker</div>
                <div className="gameIdText">GameId: {gameStateId}</div>
                <div className="playerIdText" data-testid="header-playerId">
                    Player: {player.nickName ?? player.id}
                </div>
            </div>
            <div className="headerIcons">
                <img src={ShareIcon} alt="Share" onClick={setClipboard} />
                <img
                    className={settingsOpen ? 'settingsOpen' : ''}
                    src={SettingsIcon}
                    alt="Settings"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                />
            </div>
        </div>
    );
}

export default PlayerPageHeader;
