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

package com.ford.rdfpoker.player

import com.ford.rdfpoker.card.CardRepository
import com.ford.rdfpoker.card.exceptions.CardDoesNotExistException
import com.ford.rdfpoker.gamestate.GameState
import com.ford.rdfpoker.gamestate.GameStateRepository
import com.ford.rdfpoker.gamestate.exceptions.GameStateDoesNotExistException
import com.ford.rdfpoker.player.exceptions.*
import com.ford.rdfpoker.player.requests.DealerSwapRequest
import com.ford.rdfpoker.player.requests.PlayerBetRequest
import com.ford.rdfpoker.player.requests.PlayerCreateRequest
import com.ford.rdfpoker.player.requests.PlayerUpdateRequest
import com.ford.rdfpoker.rules.RulesRepository
import com.ford.rdfpoker.rules.exceptions.RulesDoNotExistException
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Tag
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class PlayerService(
    private val playerRepository: PlayerRepository,
    private val gameStateRepository: GameStateRepository,
    private val cardRepository: CardRepository,
    private val rulesRepository: RulesRepository,
    private val meterRegistry: MeterRegistry
) {

    fun getPlayer(playerId: UUID): Player {
        return playerRepository.findByIdOrNull(playerId)
            ?: throw PlayerDoesNotExistException()
    }

    fun createPlayer(playerCreateRequest: PlayerCreateRequest): Player {
        val gameState = gameStateRepository.findByIdOrNull(playerCreateRequest.gameStateId)
            ?: throw GameStateDoesNotExistException()
        val rules = rulesRepository.findByGameState(gameState)
            ?: throw RulesDoNotExistException()

        val nickName = playerCreateRequest.nickName
        if (nickName != null && playerRepository.existsByGameStateAndNickName(gameState, nickName)) {
            throw PlayerAlreadyExistsException()
        }

        if (playerCreateRequest.isDealer && dealerAlreadyExists(gameState)) {
            throw DealerAlreadyExistsException()
        }

        val newPlayer = Player(
            nickName = nickName,
            gameState = gameState,
            isDealer = playerCreateRequest.isDealer,
            numChips = rules.chipsAllottedPerPlayer
        )
        val createdPlayer = playerRepository.save(newPlayer)

        meterRegistry
            .counter(
                "rdfpoker.player.created",
                listOf(Tag.of("game", gameState.id.toString()))
            )
            .increment()

        return createdPlayer
    }

    fun updatePlayer(playerUpdateRequest: PlayerUpdateRequest): Player {
        val player = playerRepository.findByIdOrNull(playerUpdateRequest.id)
            ?: throw PlayerDoesNotExistException()

        val gameState = player.gameState
            ?: throw GameStateDoesNotExistException()
        val rules = gameState.rules
            ?: throw RulesDoNotExistException()

        playerUpdateRequest.numChips?.let {
            val acceptableNumChipsUpdate = it >= 0 && it <= rules.chipsAllottedPerPlayer
            if (acceptableNumChipsUpdate) {
                player.numChips = it
            } else {
                throw PlayerCannotHaveRequestedNumChipsException()
            }
        }

        playerUpdateRequest.nickName?.let {
            player.nickName = it
        }

        return playerRepository.save(player)
    }

    @Transactional
    fun betChip(playerBetRequest: PlayerBetRequest): Player {
        val player = playerRepository.findByIdOrNull(playerBetRequest.playerId)
            ?: throw PlayerDoesNotExistException()
        val card = cardRepository.findByIdOrNull(playerBetRequest.cardId)
            ?: throw CardDoesNotExistException()

        if (player.numChips > 0) {
            player.numChips -= 1
            playerRepository.save(player)

            card.numChips += 1
            cardRepository.save(card)
        } else {
            throw NotEnoughChipsLeftException()
        }
        return player
    }

    fun swapDealers(dealerSwapRequest: DealerSwapRequest) {
        val currentDealer = playerRepository.findByIdOrNull(dealerSwapRequest.currentDealerId)
            ?: throw PlayerDoesNotExistException()

        val futureDealer = playerRepository.findByIdOrNull(dealerSwapRequest.futureDealerId)
            ?: throw PlayerDoesNotExistException()

        if (currentDealer.gameState?.id != futureDealer.gameState?.id) {
            throw InvalidDealerSwapException()
        }

        if (!currentDealer.isDealer) {
            throw InvalidDealerSwapException()
        }

        currentDealer.isDealer = false
        futureDealer.isDealer = true

        playerRepository.save(currentDealer)
        playerRepository.save(futureDealer)
    }

    private fun dealerAlreadyExists(gameState: GameState) = playerRepository
        .findAllByGameState(gameState)
        .any { it.isDealer }
}
