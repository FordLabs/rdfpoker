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

export interface Rules {
    id: string;
    prompt: string;
    maxCardsInHand: number;
    chipsAllottedPerPlayer: number;
    preparationTimerDuration: number;
    turnTimerDuration: number;
    bettingTimerDuration: number;
    minChipsForCardPostGameDiscussion: number;
    minCardContribution: number;
}

export const initialRules: Rules = {
    id: '1',
    prompt: '',
    maxCardsInHand: 5,
    chipsAllottedPerPlayer: 1,
    preparationTimerDuration: 1,
    turnTimerDuration: 1,
    bettingTimerDuration: 1,
    minChipsForCardPostGameDiscussion: 1,
    minCardContribution: 1,
};

export default Rules;
