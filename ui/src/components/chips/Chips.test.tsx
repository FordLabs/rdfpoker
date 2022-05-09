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

import { render, screen } from '@testing-library/react';
import React from 'react';
import Chips from './Chips';

describe('Chips', () => {
    test('will show one chip and no multiplier for a card with one chip', async () => {
        render(<Chips numChips={1} />);

        await screen.findByAltText('poker chip');
        expect(screen.queryByTestId('chipMultiplier')).not.toBeInTheDocument();
    });

    test('will show no chips and no multiplier for a card with no chips', () => {
        render(<Chips numChips={0} />);

        expect(screen.queryByAltText('poker chip')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chipMultiplier')).not.toBeInTheDocument();
    });

    test('will show one chip a multiplier for a card with many chips', async () => {
        render(<Chips numChips={8} />);

        await screen.findByAltText('poker chip');
        await screen.findByText('X8');
    });
});
