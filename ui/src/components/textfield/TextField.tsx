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

import React from 'react';
import './TextField.scss';

interface TextFieldProps {
    labelText: string;
    labelId: string;
    value: string;
    onChange: Function;
    showError: boolean;
    errorText?: string;
    autoFocus?: boolean;
}

function TextField({
    labelText,
    labelId,
    value,
    onChange,
    showError,
    errorText,
    autoFocus = false,
}: TextFieldProps): JSX.Element {
    return (
        <>
            <div className="textEntry">
                <label htmlFor={`${labelId}`}>{labelText}</label>
                <input
                    type="text"
                    id={`${labelId}`}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoFocus={autoFocus}
                />
            </div>
            {showError && <div className="notFoundError">{errorText}</div>}
        </>
    );
}

export default TextField;
