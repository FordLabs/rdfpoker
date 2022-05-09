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
import './Hand.scss';
import Card from '../../models/Card';
import CardView from './CardView';
import Phase from '../../models/Phase';
import { useRecoilState, useRecoilValue } from 'recoil';
import { playerState } from '../../state/PlayerAtom';
import { rulesState } from '../../state/RulesAtom';
import { cardsInHandState } from '../../state/CardsInHandAtom';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import CardClient from '../../services/Card/CardClient';
import CardStatus from '../../models/CardStatus';

function Hand(): JSX.Element {
    const currentPhase = useRecoilValue(currentPhaseState);
    const rules = useRecoilValue(rulesState);
    const player = useRecoilValue(playerState);
    const [cardsInHand, setCardsInHand] = useRecoilState(cardsInHandState);

    useEffect(() => {
        if (currentPhase === Phase.TURN) {
            const nonBlankCardsInHand = cardsInHand.filter((card) => {
                const isInHand = card.cardStatus === CardStatus.INHAND;
                const isNotBlank = card.content.length > 0;
                return isInHand && isNotBlank;
            });
            if (nonBlankCardsInHand.length < cardsInHand.length) {
                setCardsInHand(nonBlankCardsInHand);
            }
        }
    }, [currentPhase, cardsInHand, setCardsInHand]);

    function showCardPlaceholder(): Array<JSX.Element> {
        const cardPlaceholders: Array<JSX.Element> = [];
        for (let i = 0; i < rules.maxCardsInHand - cardsInHand.length; ++i) {
            cardPlaceholders.push(
                <React.Fragment key={'cardPlaceholder' + i}>
                    <div className="cardTemplate cardPlaceholder" />
                </React.Fragment>,
            );
        }
        return cardPlaceholders;
    }

    function showCards(): Array<JSX.Element> {
        const cards: Array<JSX.Element> = [];
        cardsInHand.forEach((card) => {
            cards.push(
                <React.Fragment key={`card${card.id}`}>
                    <CardView card={card} />
                </React.Fragment>,
            );
        });
        return cards;
    }

    async function addNewCard() {
        if (canAddCards() && cardsInHand.length < rules.maxCardsInHand) {
            const createdCard: Card = await CardClient.createCard(player.id);
            setCardsInHand((cards) => [...cards, createdCard]);
        }
    }

    function canAddCards(): boolean {
        return currentPhase === Phase.PREPARATION;
    }

    return (
        <div className="hand" data-testid="hand">
            <div className="cards">
                <div
                    className={`deck cardTemplate ${
                        canAddCards() ? 'full' : 'empty'
                    }`}
                    onClick={addNewCard}
                    data-testid="deck"
                />
                <div className="cardArea">
                    <div className="cardsInHand">
                        {showCards()} {showCardPlaceholder()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Hand;
