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

package com.ford.rdfpoker.card

import com.ford.rdfpoker.card.exceptions.CardDoesNotExistException
import com.ford.rdfpoker.card.exceptions.ForbiddenToPlayCardException
import com.ford.rdfpoker.card.requests.CardAddRequest
import com.ford.rdfpoker.card.requests.CardPlayRequest
import com.ford.rdfpoker.card.requests.CardUpdateRequest
import com.ford.rdfpoker.card.responses.CardAddResponse
import com.ford.rdfpoker.gamestate.GameState
import com.ford.rdfpoker.gamestate.exceptions.GameStateDoesNotExistException
import com.ford.rdfpoker.gamestate.responses.TurnResponse
import com.ford.rdfpoker.player.Player
import com.ford.rdfpoker.player.PlayerRepository
import com.ford.rdfpoker.player.exceptions.PlayerDoesNotExistException
import com.ford.rdfpoker.sse.SseNotificationType
import com.ford.rdfpoker.sse.SseService
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Tag
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.*

@Service
class CardService(
    private val cardRepository: CardRepository,
    private val playerRepository: PlayerRepository,
    private val sseService: SseService,
    private val meterRegistry: MeterRegistry
) {

    fun addCard(cardAddRequest: CardAddRequest): CardAddResponse {
        val player = playerRepository.findByIdOrNull(cardAddRequest.playerId)
            ?: throw PlayerDoesNotExistException()

        val addedCard = cardRepository.save(Card(player = player))
        return CardAddResponse(
            id = addedCard.id,
            content = addedCard.content,
            cardStatus = addedCard.cardStatus,
            numChips = addedCard.numChips,
            playerId = player.id
        )
    }

    @Transactional
    fun updateCard(cardUpdateRequest: CardUpdateRequest): Card {
        val cardToUpdate = cardRepository.findByIdOrNull(cardUpdateRequest.id)
            ?: throw CardDoesNotExistException()
        val gameState = cardToUpdate.player?.gameState
            ?: throw GameStateDoesNotExistException()

        cardUpdateRequest.content?.let {
            cardToUpdate.content = it
        }

        var shouldNotifyListenersWhoseTurnIsNext = false
        cardUpdateRequest.cardStatus?.let {
            if (it == CardStatus.ONTABLE && cardToUpdate.cardStatus == CardStatus.INHAND) {
                cardToUpdate.player?.let { player ->
                    updateTimePlayerLastHadATurn(player)
                    shouldNotifyListenersWhoseTurnIsNext = true
                }
            }
            cardToUpdate.cardStatus = it
        }
        cardUpdateRequest.numChips?.let {
            cardToUpdate.numChips = it
        }

        val updatedCard = cardRepository.save(cardToUpdate)
        if (shouldNotifyListenersWhoseTurnIsNext) {
            notifyListenersWhoseTurnIsNext(gameState)
            addCardPlayedMetric(gameState)
        }
        return updatedCard
    }

    fun deleteCard(cardId: UUID) {
        if (!cardRepository.existsById(cardId)) {
            throw CardDoesNotExistException()
        }

        cardRepository.deleteById(cardId)
    }

    @Transactional
    fun playCard(cardPlayRequest: CardPlayRequest) {
        val cardToPlay = cardRepository.findByIdOrNull(cardPlayRequest.id)
            ?: throw CardDoesNotExistException()
        val player = cardToPlay.player
            ?: throw PlayerDoesNotExistException()
        val gameState = player.gameState
            ?: throw GameStateDoesNotExistException()

        makeSureItIsOurTurnToPlay(cardToPlay, gameState)
        moveCardAlreadyOnDisplayToTable()
        putOurCardOnDisplay(cardToPlay)
        updateTimePlayerLastHadATurn(player)
        notifyListenersWhoseTurnIsNext(gameState)
        addCardPlayedMetric(gameState)
    }

    private fun updateTimePlayerLastHadATurn(player: Player) {
        player.lastTurnCompletedTimestamp = OffsetDateTime.now()
        playerRepository.save(player)
    }

    private fun addCardPlayedMetric(gameState: GameState) {
        meterRegistry
            .counter(
                "rdfpoker.card.played",
                listOf(Tag.of("game", gameState.id.toString()))
            )
            .increment()
    }

    private fun putOurCardOnDisplay(cardToPlay: Card) {
        cardToPlay.cardStatus = CardStatus.ONDISPLAY
        cardRepository.save(cardToPlay)
    }

    private fun moveCardAlreadyOnDisplayToTable() {
        cardRepository.findByCardStatus(CardStatus.ONDISPLAY)?.let {
            it.cardStatus = CardStatus.ONTABLE
            cardRepository.save(it)
        }
    }

    private fun makeSureItIsOurTurnToPlay(cardToPlay: Card, gameState: GameState) {
        val whoseTurn = gameState.whichPlayersTurn() ?: throw ForbiddenToPlayCardException()
        if (whoseTurn.id != cardToPlay.player?.id) {
            throw ForbiddenToPlayCardException()
        }
    }

    private fun notifyListenersWhoseTurnIsNext(gameState: GameState) {
        val whoseTurnNext = gameState.whichPlayersTurn()
        val newPlayerTurn = TurnResponse(playerId = whoseTurnNext?.id, playerNickName = whoseTurnNext?.nickName)
        sseService.sendNotificationToClients(gameState.id, newPlayerTurn, SseNotificationType.TURN)
    }
}