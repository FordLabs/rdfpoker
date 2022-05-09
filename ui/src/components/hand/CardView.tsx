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

import React, { useState } from 'react';
import './CardView.scss';
import Phase from '../../models/Phase';
import CardUpdateRequest from '../../services/Card/CardUpdateRequest';
import Card from '../../models/Card';
import CardStatus from '../../models/CardStatus';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { playerState } from '../../state/PlayerAtom';
import { cardInHandSelector } from '../../state/CardsInHandAtom';
import { currentPhaseState } from '../../state/CurrentPhaseAtom';
import { whoseTurnState } from '../../state/WhoseTurnAtom';
import CardClient from '../../services/Card/CardClient';
import Player from '../../models/Player';
import PlayerClient from '../../services/Player/PlayerClient';
import Chips from '../chips/Chips';
import { cardsOnTableState } from '../../state/CardsOnTableAtom';
import CardPlayRequest from '../../services/Card/CardPlayRequest';

interface CardViewProperties {
    card: Card;
}

function CardView({ card }: CardViewProperties) {
    const currentPhase = useRecoilValue(currentPhaseState);
    const [player, setPlayer] = useRecoilState(playerState);
    const whoseTurn = useRecoilValue(whoseTurnState);
    const setCardInHand = useSetRecoilState(cardInHandSelector(card.id));
    const setCardsOnTable = useSetRecoilState(cardsOnTableState);

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>(card.content);

    async function discard() {
        try {
            await CardClient.deleteCard(card.id);
            setCardInHand(undefined);
        } catch (e) {
            console.log(`Error deleting card: ${e}`);
        }
    }

    async function makeBet(event: React.MouseEvent<HTMLElement>) {
        if (
            currentPhase === Phase.BETTING &&
            (card.cardStatus === CardStatus.ONTABLE ||
                card.cardStatus === CardStatus.ONDISPLAY)
        ) {
            event.stopPropagation();
            try {
                const updatedPlayer: Player = await PlayerClient.makeBet(
                    player.id,
                    card.id,
                );
                setPlayer(updatedPlayer);
                addAChipToThisCard();
            } catch (e) {
                console.log('Unable to make bet', e);
            }
        }
    }

    function addAChipToThisCard() {
        setCardsOnTable((cardsCurrentlyOnTable) =>
            cardsCurrentlyOnTable.map((cardOnTable) =>
                cardOnTable.id === card.id
                    ? {
                          ...cardOnTable,
                          numChips: cardOnTable.numChips + 1,
                      }
                    : cardOnTable,
            ),
        );
    }

    function shouldShowChips(): boolean {
        const correctPhase =
            currentPhase === Phase.BETTING || currentPhase === Phase.POSTGAME;
        const cardIsOnTable = card.cardStatus === CardStatus.ONTABLE;
        return correctPhase && cardIsOnTable;
    }

    function shouldShowPlayCardButton(): boolean {
        const correctPhase = currentPhase === Phase.TURN;
        const isMyCard = card.playerId === player.id;
        const isMyTurn = whoseTurn.playerId === player.id;
        const isNotOnTable = card.cardStatus === CardStatus.INHAND;
        return correctPhase && isMyCard && isMyTurn && isNotOnTable;
    }

    function shouldShowDiscardButton(): boolean {
        const correctPhase = currentPhase === Phase.PREPARATION;
        const isMyCard = card.playerId === player.id;
        const isNotOnTable = card.cardStatus === CardStatus.INHAND;
        return correctPhase && isMyCard && isNotOnTable;
    }

    async function updateCard() {
        const cardUpdateRequest: CardUpdateRequest = {
            id: card.id,
            content: inputText,
        };
        try {
            await CardClient.updateCard(cardUpdateRequest);
            const updatedCard: Card = {
                ...card,
                content: inputText,
            };

            setCardInHand(updatedCard);
            setIsEditing(false);
        } catch (e) {
            console.log(`Error updating card: ${e}`);
        }
    }

    async function playCard() {
        const cardPlayRequest: CardPlayRequest = {
            id: card.id,
        };

        try {
            await CardClient.playCard(cardPlayRequest);
            setCardInHand(undefined);
        } catch (e) {
            console.log(`Error updating card: ${e}`);
        }
    }

    function cancelEdit() {
        setIsEditing(false);
        setInputText(card.content);
    }

    return (
        <>
            <div
                className={`cardTemplate card ${
                    currentPhase === Phase.BETTING ? 'bettableCard' : ''
                } ${
                    card.cardStatus === CardStatus.ONDISPLAY ? 'onDisplay' : ''
                }`}
                data-testid="card"
                onClick={makeBet}
            >
                {shouldShowDiscardButton() && (
                    <div
                        className="cardActionButton discardButton"
                        onClick={discard}
                        data-testid="discardButton"
                    />
                )}
                {shouldShowPlayCardButton() && (
                    <div
                        className="cardActionButton playCardButton"
                        onClick={playCard}
                        data-testid="playCardButton"
                    />
                )}
                <textarea
                    className="cardTextArea"
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setIsEditing(true)}
                    data-testid="cardTextArea"
                    disabled={currentPhase !== Phase.PREPARATION}
                    value={inputText}
                />
                {isEditing && (
                    <div className="editButtons">
                        <button
                            className="saveCardButton"
                            data-testid="saveCardButton"
                            onClick={updateCard}
                        >
                            ✔
                        </button>
                        <button
                            className="cancelCardButton"
                            data-testid="cancelCardButton"
                            onClick={cancelEdit}
                        >
                            ✘
                        </button>
                    </div>
                )}
            </div>
            {shouldShowChips() && <Chips numChips={card.numChips} />}
        </>
    );
}

export default CardView;
