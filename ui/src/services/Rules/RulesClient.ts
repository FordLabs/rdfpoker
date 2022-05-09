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

import RulesUpdateRequest from './RulesUpdateRequest';
import Rules from '../../models/Rules';
import axios, { AxiosResponse } from 'axios';

const rulesApiBase = '/api/rules';

class RulesClient {
    static async updateRules(
        rulesUpdateRequest: RulesUpdateRequest,
    ): Promise<Rules> {
        const axiosResponse: AxiosResponse<Rules> = await axios.put(
            rulesApiBase,
            rulesUpdateRequest,
        );
        return axiosResponse.data;
    }

    static async getRules(gameStateId: string): Promise<Rules> {
        const axiosResponse: AxiosResponse<Rules> = await axios.get(
            `${rulesApiBase}/${gameStateId}`,
        );
        return axiosResponse.data;
    }
}

export default RulesClient;
