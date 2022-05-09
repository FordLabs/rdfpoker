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

import React, { useState } from 'react';
import CreatedGameResponse from '../../services/GameState/CreatedGameResponse';
import GameStateClient from '../../services/GameState/GameStateClient';
import './HomePage.scss';
import PokerChip from '../../images/PokerChip.svg';
import Player from '../../models/Player';
import PlayerClient from '../../services/Player/PlayerClient';
import TextField from '../../components/textfield/TextField';
import { useNavigate, useParams } from 'react-router';

function HomePage(): JSX.Element {
    const { providedGameStateId = '' } = useParams();

    const navigate = useNavigate();
    const [inputNickName, setInputNickName] = useState<string>('');
    const [inputExistingPlayerId, setExistingPlayerId] = useState<string>('');
    const [inputExistingGameStateId, setExistingGameStateId] =
        useState<string>(providedGameStateId);
    const [isNewPlayer, setIsNewPlayer] = useState<boolean>(true);
    const [showNonExistingGameError, setShowNonExistingGameError] =
        useState<boolean>(false);
    const [showNonExistingPlayerError, setShowNonExistingPlayerError] =
        useState<boolean>(false);

    async function createNewGame() {
        try {
            const createdGameResponse: CreatedGameResponse =
                await GameStateClient.createGame();
            const createdGameStateId = createdGameResponse.gameStateId;
            const createdPlayer: Player = await createNewPlayer(
                createdGameStateId,
                true,
            );
            navigate(`/${createdGameStateId}/${createdPlayer.id}`);
        } catch (e) {
            console.log('Error creating a new game: ', e);
            return;
        }
    }

    async function createNewPlayer(
        gameStateId: string,
        isDealer: boolean,
    ): Promise<Player> {
        let nickName: string | undefined;
        if (inputNickName !== '') {
            nickName = inputNickName;
        } else if (isDealer) {
            nickName = 'Dealer';
        } else {
            nickName = undefined;
        }

        return await PlayerClient.createPlayer(gameStateId, nickName, isDealer);
    }

    async function enterGame() {
        setShowNonExistingGameError(false);
        setShowNonExistingPlayerError(false);

        try {
            await GameStateClient.getGameState(inputExistingGameStateId);
        } catch (e) {
            setShowNonExistingGameError(true);
            return;
        }

        if (isNewPlayer) {
            try {
                const createdPlayer: Player = await createNewPlayer(
                    inputExistingGameStateId,
                    false,
                );
                navigate(`/${inputExistingGameStateId}/${createdPlayer.id}`);
            } catch (e) {
                console.log('Error creating new player:', e);
            }
        } else {
            try {
                // make sure player actually exists
                await PlayerClient.getPlayer(inputExistingPlayerId);
                navigate(
                    `/${inputExistingGameStateId}/${inputExistingPlayerId}`,
                );
            } catch (e) {
                setShowNonExistingPlayerError(true);
            }
        }
    }

    function canJoinGame(): boolean {
        if (inputExistingGameStateId === '') {
            return false;
        } else {
            if (!isNewPlayer) {
                return inputExistingPlayerId !== '';
            } else {
                return true;
            }
        }
    }

    return (
        <div className="pokerTable">
            <div className="homeMenu">
                <div className="homeMenuTitle">
                    <img
                        src={PokerChip}
                        alt="pokerChip"
                        className="pokerChip"
                    />
                    <div className="homeTitleText">
                        <div>Welcome To</div>
                        <div>RDFPoker!</div>
                    </div>
                    <img
                        src={PokerChip}
                        alt="pokerChip"
                        className="pokerChip"
                    />
                </div>
                <div className="homeMenuBody">
                    <TextField
                        labelText="Game Id:"
                        labelId="existingGameTextField"
                        value={inputExistingGameStateId}
                        onChange={setExistingGameStateId}
                        showError={showNonExistingGameError}
                        errorText="Sorry, that game was not found"
                    />

                    <div className="existingPlayerRadio">
                        <label>
                            <input
                                type="radio"
                                data-testid="existingPlayerRadioNew"
                                onClick={() => setIsNewPlayer(true)}
                                value="newPlayer"
                                name="existingPlayer"
                                defaultChecked
                            />
                            New Player
                        </label>
                        <label>
                            <input
                                type="radio"
                                data-testid="existingPlayerRadioExisting"
                                onClick={() => setIsNewPlayer(false)}
                                value="existingPlayer"
                                name="existingPlayer"
                            />
                            Existing Player
                        </label>
                    </div>

                    {isNewPlayer ? (
                        <TextField
                            labelText="Nickname:"
                            labelId="newNicknameTextField"
                            value={inputNickName}
                            onChange={setInputNickName}
                            showError={false}
                            autoFocus={providedGameStateId !== ''}
                        />
                    ) : (
                        <TextField
                            labelText="Player Id:"
                            labelId="existingPlayerTextField"
                            value={inputExistingPlayerId}
                            onChange={setExistingPlayerId}
                            showError={showNonExistingPlayerError}
                            errorText="Player id provided was not found"
                        />
                    )}
                    <button
                        className="joinGame"
                        onClick={enterGame}
                        disabled={!canJoinGame()}
                    >
                        {isNewPlayer ? 'Join Game' : 'Rejoin Game'}
                    </button>

                    <div className="separator" />

                    <button className="newGame" onClick={createNewGame}>
                        Create New Game
                    </button>
                </div>
            </div>
            <a
                href="https://github.com/FordLabs/RDFPoker#usage"
                className="howToPlay"
            >
                New to RDFPoker? Learn How to Play
            </a>
        </div>
    );
}

export default HomePage;
