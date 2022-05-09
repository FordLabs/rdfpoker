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
import './Tabled.scss';
import { useRecoilValue } from 'recoil';
import { cardsOnTableState } from '../../state/CardsOnTableAtom';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import { rulesState } from '../../state/RulesAtom';
import Phase from '../../models/Phase';
import Card from '../../models/Card';
import CardView from '../hand/CardView';
import CardStatus from '../../models/CardStatus';

function Tabled() {
    const cardsOnTable = useRecoilValue(cardsOnTableState);
    const currentPhase = useRecoilValue(currentPhaseState);
    const rules = useRecoilValue(rulesState);

    function cardsProcessedForPostGame(): Array<Card> {
        return cardsOnTable
            .filter(
                (card) =>
                    card.numChips >= rules.minChipsForCardPostGameDiscussion,
            )
            .sort((card1, card2) => card2.numChips - card1.numChips);
    }

    function putCardOnDisplayFirst(): Array<Card> {
        return [...cardsOnTable].sort((card1, card2) => {
            if (card1.cardStatus === CardStatus.ONDISPLAY) {
                return -1;
            } else if (card2.cardStatus === CardStatus.ONDISPLAY) {
                return 1;
            }
            return 0;
        });
    }

    function putCardsOnTable(card: Card): JSX.Element {
        return (
            <div className="tabledCard" key={`tabledcard${card.id}`}>
                <CardView card={card} />
            </div>
        );
    }

    return (
        <div className="tabled" data-testid="tabled">
            {currentPhase === Phase.POSTGAME
                ? cardsProcessedForPostGame().map(putCardsOnTable)
                : putCardOnDisplayFirst().map(putCardsOnTable)}
        </div>
    );
}

export default Tabled;
