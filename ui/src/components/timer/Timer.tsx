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

import { CountdownCircleTimer, Props } from 'react-countdown-circle-timer';
import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import { rulesState } from '../../state/RulesAtom';
import Phase from '../../models/Phase';
import useWindowDimensions from './useWindowDimensions';

function Timer() {
    const currentPhase = useRecoilValue(currentPhaseState);
    const rules = useRecoilValue(rulesState);

    const { width } = useWindowDimensions();
    const [phaseStartTime, setPhaseStartTime] = useState<number>(0);
    const [timerKey, setTimerKey] = useState<number>(0);

    useEffect(() => {
        setTimerKey((prevKey) => prevKey + 1);

        if (currentPhase === Phase.PREPARATION) {
            setPhaseStartTime(rules.preparationTimerDuration * 60);
        } else if (currentPhase === Phase.TURN) {
            setPhaseStartTime(rules.turnTimerDuration * 60);
        } else if (currentPhase === Phase.BETTING) {
            setPhaseStartTime(rules.bettingTimerDuration * 60);
        }
    }, [currentPhase, rules]);

    const formatTime: Props['children'] = ({ remainingTime }) => {
        if (remainingTime) {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = (remainingTime % 60).toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false,
            });

            return `${minutes}:${seconds}`;
        }
        return '0';
    };

    function getTimerSizeForScreenWidth(): number {
        if (width >= 3440) {
            return 180;
        } else if (width < 768) {
            return 90;
        }
        return 120;
    }

    return (
        <div className="timerArea">
            {currentPhase !== Phase.PREGAME && currentPhase !== Phase.POSTGAME && (
                <CountdownCircleTimer
                    isPlaying
                    key={timerKey}
                    duration={phaseStartTime}
                    size={getTimerSizeForScreenWidth()}
                    colors={['#A6E36E', '#FFFF00', '#F37013', '#F00707']}
                    colorsTime={[
                        phaseStartTime,
                        phaseStartTime / 2,
                        phaseStartTime / 4,
                        0,
                    ]}
                >
                    {formatTime}
                </CountdownCircleTimer>
            )}
        </div>
    );
}

export default Timer;
