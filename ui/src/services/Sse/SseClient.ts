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

type SseCallbacks = Array<(data: any) => void>;
type CallbacksForEventType = Map<string, SseCallbacks>;

class SseClient {
    private static instance: SseClient;
    private phaseSseBase = '/api/receive';
    private eventSource?: EventSource;
    private callbacks: CallbacksForEventType = new Map();

    private constructor() {}

    static shared(): SseClient {
        if (!SseClient.instance) {
            SseClient.instance = new SseClient();
        }

        return SseClient.instance;
    }

    connect(gameStateId: string) {
        const url = this.buildSseServerUrl(gameStateId);
        try {
            this.eventSource = new EventSource(url);
            this.eventSource.onerror = () => {
                this.unsubscribe();
                this.connect(gameStateId);
            };
            this.subscribeIfCallbacksCreatedWhileNotConnected();
        } catch (e) {
            console.log('Browser does not support Server-Sent Events');
        }
    }

    subscribe(eventName: string, callbackFn: (data: any) => void) {
        const existingCallbacksForThisEvent = this.callbacks.get(eventName);
        if (existingCallbacksForThisEvent) {
            existingCallbacksForThisEvent.push(callbackFn);
        } else {
            const callbacksForThisEvent: SseCallbacks = [callbackFn];
            this.callbacks.set(eventName, callbacksForThisEvent);
            this.eventSource?.addEventListener(eventName, (e) =>
                this.handleNotification(e, this.callbacks),
            );
        }
    }

    unsubscribe() {
        try {
            this.eventSource?.close?.();
            this.eventSource = undefined;
        } catch (e) {}
    }

    private buildSseServerUrl(gameStateId: string) {
        let url = `${this.phaseSseBase}/${gameStateId}`;
        const isLocalHost = window.location.origin.includes('localhost');
        if (isLocalHost) {
            url = window.location.origin.replace('3000', '8080') + url;
        }
        return url;
    }

    private handleNotification(e: Event, callbacks: CallbacksForEventType) {
        const event: MessageEvent = e as MessageEvent;

        const eventName: string = event.type.toString();
        const callbacksForThisEvent: SseCallbacks =
            callbacks.get(eventName) ?? [];
        const notification = JSON.parse(event.data);
        callbacksForThisEvent.map((callbackFn) => callbackFn(notification));
    }

    private subscribeIfCallbacksCreatedWhileNotConnected() {
        const callbackKeys = Array.from(this.callbacks.keys());
        callbackKeys.forEach((eventName) =>
            this.eventSource?.addEventListener(eventName, (e) =>
                this.handleNotification(e, this.callbacks),
            ),
        );
    }
}

export default SseClient;
