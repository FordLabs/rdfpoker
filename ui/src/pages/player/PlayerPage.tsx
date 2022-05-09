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

import React, { useEffect } from 'react';
import './PlayerPage.scss';
import Prompter from '../../components/prompter/Prompter';
import Hand from '../../components/hand/Hand';
import Tabled from '../../components/tabled/Tabled';
import { useParams } from 'react-router';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import QueryUpdatesClient from '../../services/QueryUpdatesClient';
import CardStatus from '../../models/CardStatus';
import PlayerClient from '../../services/Player/PlayerClient';
import { playerState } from '../../state/PlayerAtom';
import { cardsInHandState } from '../../state/CardsInHandAtom';
import PlayerPageHeader from '../../components/playerpageheader/PlayerPageHeader';
import Settings from '../../components/settings/Settings';
import { whoseTurnState } from '../../state/WhoseTurnAtom';
import Phase from '../../models/Phase';
import SseClient from '../../services/Sse/SseClient';
import Timer from '../../components/timer/Timer';
import { settingsOpenState } from '../../state/SettingsOpenAtom';
import { rulesState } from '../../state/RulesAtom';
import Chips from '../../components/chips/Chips';

function PlayerPage(): JSX.Element {
    const { playerId = '', gameStateId = '' } = useParams();

    const [player, setPlayer] = useRecoilState(playerState);
    const setCardsInHand = useSetRecoilState(cardsInHandState);
    const setSettingsOpen = useSetRecoilState(settingsOpenState);
    const rules = useRecoilValue(rulesState);
    const whoseTurn = useRecoilValue(whoseTurnState);
    const currentPhase = useRecoilValue(currentPhaseState);

    useEffect(() => {
        QueryUpdatesClient.shared()
            .queryAll(gameStateId)
            .then()
            .catch(console.error);
        SseClient.shared().connect(gameStateId);

        return () => SseClient.shared().unsubscribe();
    }, [gameStateId]);

    useEffect(() => {
        PlayerClient.getPlayer(playerId)
            .then((returnedPlayer) => {
                setPlayer(returnedPlayer);

                const playersExistingCardsInHand = returnedPlayer.cards
                    .filter((card) => card.cardStatus === CardStatus.INHAND)
                    .map((card) => ({
                        ...card,
                        playerId,
                    }));
                setCardsInHand(playersExistingCardsInHand);
            })
            .catch(console.error);
    }, [playerId, setCardsInHand, setPlayer, rules]);

    useEffect(() => {
        if (whoseTurn !== null) {
            QueryUpdatesClient.shared()
                .queryPlayedCards(gameStateId)
                .then()
                .catch(console.error);
        }
    }, [whoseTurn, gameStateId]);

    useEffect(() => {
        if (currentPhase === Phase.BETTING) {
            QueryUpdatesClient.shared().startPollingPlayedCards(gameStateId);
        } else {
            QueryUpdatesClient.shared().stopPollingPlayedCards();
        }

        return () => QueryUpdatesClient.shared().stopPollingPlayedCards();
    }, [currentPhase, gameStateId]);

    useEffect(() => {
        let autoDrawerOpenTimeout: NodeJS.Timeout;
        // delay to pull out settings so it's easier to know it's a drawer
        if (player.isDealer && currentPhase === Phase.PREGAME) {
            autoDrawerOpenTimeout = setTimeout(
                () => setSettingsOpen(true),
                250,
            );
        }
        return () => clearTimeout(autoDrawerOpenTimeout);
    }, [player, currentPhase, setSettingsOpen]);

    return (
        <div className="playerPage">
            <PlayerPageHeader gameStateId={gameStateId} />
            <div className="pokerTable" onClick={() => setSettingsOpen(false)}>
                <div className="info">
                    <Prompter />
                    <Chips numChips={player.numChips} />
                    <Timer />
                </div>
                <Tabled />
                {currentPhase !== Phase.BETTING &&
                    currentPhase !== Phase.POSTGAME && <Hand />}
            </div>
            <Settings gameStateId={gameStateId} />
        </div>
    );
}

export default PlayerPage;
