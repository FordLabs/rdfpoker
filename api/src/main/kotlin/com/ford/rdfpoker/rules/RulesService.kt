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

package com.ford.rdfpoker.rules

import com.ford.rdfpoker.gamestate.GameStateRepository
import com.ford.rdfpoker.gamestate.exceptions.GameStateDoesNotExistException
import com.ford.rdfpoker.phase.Phase
import com.ford.rdfpoker.player.PlayerRepository
import com.ford.rdfpoker.rules.exceptions.InvalidRulesUpdateRequestException
import com.ford.rdfpoker.rules.exceptions.RulesDoNotExistException
import com.ford.rdfpoker.rules.exceptions.WrongPhaseToUpdateRulesException
import com.ford.rdfpoker.rules.requests.RulesUpdateRequest
import com.ford.rdfpoker.sse.SseNotificationType
import com.ford.rdfpoker.sse.SseService
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.TransactionSystemException
import java.util.*

@Service
class RulesService(
    private val rulesRepository: RulesRepository,
    private val gameStateRepository: GameStateRepository,
    private val playerRepository: PlayerRepository,
    private val sseService: SseService
) {
    fun updateRules(rulesUpdateRequest: RulesUpdateRequest): Rules {
        val gameState = gameStateRepository.findByIdOrNull(rulesUpdateRequest.gameStateId)
            ?: throw GameStateDoesNotExistException()
        val rules = gameState.rules
            ?: throw RulesDoNotExistException()

        if (gameState.phase != Phase.PREGAME) {
            throw WrongPhaseToUpdateRulesException()
        }

        rulesUpdateRequest.prompt?.let {
            rules.prompt = it
        }
        rulesUpdateRequest.maxCardsInHand?.let {
            rules.maxCardsInHand = it
        }
        rulesUpdateRequest.chipsAllottedPerPlayer?.let {
            rules.chipsAllottedPerPlayer = it
            val players = playerRepository.findAllByGameState(gameState)
            players.forEach { player -> player.numChips = it }
        }
        rulesUpdateRequest.preparationTimerDuration?.let {
            rules.preparationTimerDuration = it
        }
        rulesUpdateRequest.turnTimerDuration?.let {
            rules.turnTimerDuration = it
        }
        rulesUpdateRequest.bettingTimerDuration?.let {
            rules.bettingTimerDuration = it
        }
        rulesUpdateRequest.minChipsForCardPostGameDiscussion?.let {
            rules.minChipsForCardPostGameDiscussion = it
        }
        rulesUpdateRequest.minCardContribution?.let {
            rules.minCardContribution = it
        }

        try {
            val updatedRules = rulesRepository.save(rules)
            sseService.sendNotificationToClients(
                rulesUpdateRequest.gameStateId,
                updatedRules,
                SseNotificationType.RULES
            )
            return updatedRules
        } catch (exception: TransactionSystemException) {
            throw InvalidRulesUpdateRequestException()
        }
    }

    fun getRules(gameStateId: UUID): Rules {
        val gameState = gameStateRepository.findByIdOrNull(gameStateId)
            ?: throw GameStateDoesNotExistException()
        return rulesRepository.findByGameState(gameState)
            ?: throw RulesDoNotExistException()
    }
}
