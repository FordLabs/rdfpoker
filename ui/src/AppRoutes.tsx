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

import { Routes, Route } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import PlayerPage from './pages/player/PlayerPage';
import DebugPage from './pages/debug/DebugPage';
import HomePage from './pages/home/HomePage';
import React from 'react';

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/:gameStateId/:playerId"
                element={
                    <RecoilRoot>
                        <PlayerPage />
                    </RecoilRoot>
                }
            />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/:providedGameStateId" element={<HomePage />} />
            <Route path="/" element={<HomePage />} />
        </Routes>
    );
}

export default AppRoutes;
