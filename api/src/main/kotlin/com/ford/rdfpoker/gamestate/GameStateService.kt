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

package com.ford.rdfpoker.gamestate

import com.ford.rdfpoker.card.Card
import com.ford.rdfpoker.card.CardRepository
import com.ford.rdfpoker.card.CardStatus
import com.ford.rdfpoker.gamestate.exceptions.GameStateDoesNotExistException
import com.ford.rdfpoker.gamestate.responses.StateResponse
import com.ford.rdfpoker.gamestate.responses.TurnResponse
import com.ford.rdfpoker.phase.Phase
import com.ford.rdfpoker.phase.notifications.CurrentPhaseNotification
import com.ford.rdfpoker.player.Player
import com.ford.rdfpoker.rules.Rules
import com.ford.rdfpoker.rules.RulesRepository
import com.ford.rdfpoker.rules.exceptions.RulesDoNotExistException
import com.ford.rdfpoker.sse.SseNotificationType
import com.ford.rdfpoker.sse.SseService
import io.micrometer.core.instrument.MeterRegistry
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.util.*

@Service
class GameStateService(
    private val gameStateRepository: GameStateRepository,
    private val rulesRepository: RulesRepository,
    private val cardRepository: CardRepository,
    private val sseService: SseService,
    private val meterRegistry: MeterRegistry
) {

    fun buildStateResponse(gameStateId: UUID): StateResponse {
        val gameState = gameStateRepository.findByIdOrNull(gameStateId)
            ?: throw GameStateDoesNotExistException()
        val rules = gameState.rules
            ?: throw RulesDoNotExistException()

        val players = gameState.players
        val cardsInGame = cardRepository.findByPlayerIn(players.toList())
        val cardsOnTable = cardsInGame.filter { it.cardStatus == CardStatus.ONTABLE }
        val cardDisplayed = cardsInGame.find { it.cardStatus == CardStatus.ONDISPLAY }

        val whichPlayersTurn: Player? = gameState.whichPlayersTurn()
        val whoseTurn = TurnResponse(playerId = whichPlayersTurn?.id, playerNickName = whichPlayersTurn?.nickName)

        return StateResponse(
            cardsOnTable = cardsOnTable,
            cardDisplayed = cardDisplayed,
            phase = gameState.phase,
            rules = rules,
            whoseTurn = whoseTurn
        )
    }

    fun advanceState(gameStateId: UUID, newPhase: Phase) {
        val gameState = gameStateRepository.findByIdOrNull(gameStateId)
            ?: throw GameStateDoesNotExistException()

        gameState.phase = newPhase

        gameStateRepository.save(gameState)

        notifyPlayersOfNewPhase(gameStateId, newPhase)
        if (newPhase == Phase.TURN) {
            notifyPlayersWhoseTurnItIs(gameState)
            clearAllBlankCardsFromPlayers(gameState.players)
        } else if (newPhase == Phase.BETTING) {
            moveCardOnDisplayToTable()
        }
    }

    fun getTurn(gameStateId: UUID): Player? {
        val gameState = gameStateRepository.findByIdOrNull(gameStateId)
            ?: throw GameStateDoesNotExistException()
        return gameState.whichPlayersTurn()
    }

    fun createGame(): GameState {
        val createdGameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = createdGameState))

        meterRegistry.counter("rdfpoker.game.created").increment()

        return createdGameState
    }

    fun getPlayedCards(gameStateId: UUID): List<Card> {
        val gameState = gameStateRepository.findByIdOrNull(gameStateId)
            ?: throw GameStateDoesNotExistException()
        val playersInGame = gameState.players
        val cardsInGame = cardRepository.findByPlayerIn(playersInGame.toList())
        return cardsInGame.filter { it.cardStatus != CardStatus.INHAND }
    }

    fun getPhase(gameStateId: UUID): Phase {
        val gameState = gameStateRepository.findByIdOrNull(gameStateId)
            ?: throw GameStateDoesNotExistException()
        return gameState.phase
    }

    private fun moveCardOnDisplayToTable() {
        cardRepository.findByCardStatus(CardStatus.ONDISPLAY)?.let {
            it.cardStatus = CardStatus.ONTABLE
            cardRepository.save(it)
        }
    }

    private fun clearAllBlankCardsFromPlayers(players: Set<Player>) {
        players.forEach { player ->
            player.cards.forEach { card ->
                if (card.content.isBlank()) {
                    cardRepository.delete(card)
                }
            }
        }
    }

    private fun notifyPlayersWhoseTurnItIs(currentState: GameState) {
        val whoseTurnNext = currentState.whichPlayersTurn()
        val newPlayerTurn = TurnResponse(
            playerId = whoseTurnNext?.id,
            playerNickName = whoseTurnNext?.nickName
        )
        sseService.sendNotificationToClients(currentState.id, newPlayerTurn, SseNotificationType.TURN)
    }

    private fun notifyPlayersOfNewPhase(gameStateId: UUID, newPhase: Phase) {
        val currentPhaseNotification = CurrentPhaseNotification(newPhase)
        sseService.sendNotificationToClients(
            gameStateId,
            currentPhaseNotification,
            SseNotificationType.PHASE
        )
    }
}