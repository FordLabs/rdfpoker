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

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement } from 'react';

axios.defaults.proxy = false;

export const mockedAxios = new MockAdapter(axios);

export const renderWithRouter = (ui: ReactElement, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);

    return render(ui, { wrapper: BrowserRouter });
};

// Sse
export const createMockEventSource = () => mockEventSourceFn(jest.fn());
export const createMockEventSourceAndNotify = (
    mockNotificationData: any,
    mockNotificationName: string,
) => {
    const messageEvent: MessageEvent = {
        data: JSON.stringify(mockNotificationData),
        type: mockNotificationName,
    } as MessageEvent;

    const mockAddEventListener = jest
        .fn()
        .mockImplementationOnce((event, callback) => {
            setTimeout(() => callback(messageEvent), 100);
        });
    mockEventSourceFn(mockAddEventListener);
};

function mockEventSourceFn(mockAddEventListener: Function) {
    const mockEventSource: EventSource = {
        addEventListener: mockAddEventListener,
    } as unknown as EventSource;
    // @ts-ignore
    global.EventSource = jest.fn(() => mockEventSource);
}
