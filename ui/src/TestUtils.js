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

import { render } from '@testing-library/react';
import { Route, Router, Routes } from 'react-router-dom';
import { createMemoryHistory } from 'history';

export function renderWithRouterMatch(
    ui,
    {
        path = '/',
        route = '/',
        history = createMemoryHistory({ initialEntries: [route] }),
    } = {},
) {
    const Wrapper = ({ children }) => (
        <Router location={history.location} navigator={history}>
            <Routes>
                <Route path={path} element={children} />
            </Routes>
        </Router>
    );
    return {
        ...render(ui, { wrapper: Wrapper }),
    };
}

export const TestVariables = {
    gameStateId: '0906a3a4-dc04-4c91-8238-5f3a0e87f236',
    player: {
        id: '0906a3a4-dc04-4c91-8238-5f3a0e87f235',
        cards: [],
        numChips: 1,
        isDealer: false,
        nickName: 'Woody',
    },
};
