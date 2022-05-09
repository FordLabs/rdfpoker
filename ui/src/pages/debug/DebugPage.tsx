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
import { Link } from 'react-router-dom';
import GameState from '../../models/GameState';
import axios from 'axios';

function DebugPage(): JSX.Element {
    const [debugInfo, setDebugInfo] = useState<Array<GameState>>([]);
    const [isForbidden, setIsForbidden] = useState<boolean>(false);

    useEffect(fetchDebugInfo, []);

    function fetchDebugInfo() {
        axios
            .get('/api/admin/states')
            .then((gameStates) => {
                setDebugInfo(gameStates.data);
            })
            .catch((e) => {
                setIsForbidden(true);
                console.log(e);
            });
    }

    function showLinks(gameDebugInfo: GameState): JSX.Element {
        return (
            <React.Fragment key={gameDebugInfo.id}>
                Game {gameDebugInfo.id}:
                {gameDebugInfo.players.map((player, index) => (
                    <React.Fragment key={player.id}>
                        <div>
                            <Link to={`${gameDebugInfo.id}/${player.id}`}>
                                Player {index} Page
                            </Link>
                        </div>
                    </React.Fragment>
                ))}
            </React.Fragment>
        );
    }

    return (
        <>
            {debugInfo.map(showLinks)}
            <br />
            {isForbidden && <div>FORBIDDEN</div>}
        </>
    );
}

export default DebugPage;
