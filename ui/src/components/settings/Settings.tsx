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

import React, { useEffect, useState } from 'react';
import './Settings.scss';
import PlayerClient from '../../services/Player/PlayerClient';
import TextField from '../textfield/TextField';
import { playerState } from '../../state/PlayerAtom';
import DealerInfo from '../dealer/DealerInfo';
import { useRecoilState, useRecoilValue } from 'recoil';
import { settingsOpenState } from '../../state/SettingsOpenAtom';

interface SettingsProps {
    gameStateId: string;
}

function Settings({ gameStateId }: SettingsProps): JSX.Element {
    const [player, setPlayer] = useRecoilState(playerState);
    const [inputNickName, setInputNickName] = useState<string>(
        player.nickName ?? '',
    );
    const settingsOpen = useRecoilValue(settingsOpenState);

    useEffect(() => {
        setInputNickName(player.nickName ?? '');
    }, [player]);

    async function updateNickName() {
        try {
            const updatedPlayer = await PlayerClient.updatePlayer(
                player.id,
                inputNickName,
            );
            setPlayer(updatedPlayer);
        } catch (e) {
            console.log('Unable to update player', e);
        }
    }

    return (
        <div
            hidden={!settingsOpen}
            className={`settings ${settingsOpen ? 'settingsOpen' : ''}`}
        >
            <div className="settingsGroup">
                <TextField
                    labelText="nickname:"
                    labelId="nicknameTextField"
                    value={inputNickName}
                    onChange={setInputNickName}
                    showError={false}
                />
                <button
                    className="updateNickNameButton"
                    onClick={updateNickName}
                >
                    Change Nick Name
                </button>
            </div>

            <div className="separator" />

            {player.isDealer && <DealerInfo gameStateId={gameStateId} />}
        </div>
    );
}

export default Settings;
