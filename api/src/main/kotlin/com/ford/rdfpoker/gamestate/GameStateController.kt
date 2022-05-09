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
import com.ford.rdfpoker.gamestate.requests.GameStateAdvanceRequest
import com.ford.rdfpoker.gamestate.responses.CreatedGameStateResponse
import com.ford.rdfpoker.gamestate.responses.CurrentPhaseResponse
import com.ford.rdfpoker.gamestate.responses.StateResponse
import com.ford.rdfpoker.gamestate.responses.TurnResponse
import com.ford.rdfpoker.phase.Phase
import com.ford.rdfpoker.phase.exceptions.PhaseDoesNotExistException
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping(value = ["/api/state"])
class GameStateController(
    private val gameStateService: GameStateService
) {

    @PostMapping
    fun createGame(): ResponseEntity<CreatedGameStateResponse> {
        val createdGame: GameState = gameStateService.createGame()
        val createdGameStateResponse = CreatedGameStateResponse(createdGame.id)
        return ResponseEntity.ok(createdGameStateResponse)
    }

    @GetMapping("/{gameStateId}")
    fun getState(@PathVariable gameStateId: UUID): ResponseEntity<StateResponse> {
        return ResponseEntity.ok(gameStateService.buildStateResponse(gameStateId))
    }

    @GetMapping("/phase/{gameStateId}")
    fun getPhase(@PathVariable gameStateId: UUID): ResponseEntity<CurrentPhaseResponse> {
        val currentPhase = gameStateService.getPhase(gameStateId)
        return ResponseEntity.ok(CurrentPhaseResponse(phase = currentPhase))
    }

    @GetMapping("/turn/{gameStateId}")
    fun getTurn(@PathVariable gameStateId: UUID): ResponseEntity<TurnResponse> {
        val player = gameStateService.getTurn(gameStateId)
        val turnResponse = TurnResponse(
            playerId = player?.id,
            playerNickName = player?.nickName
        )
        return ResponseEntity.ok(turnResponse)
    }

    @GetMapping("/playedCards/{gameStateId}")
    fun getPlayedCards(@PathVariable gameStateId: UUID): ResponseEntity<List<Card>> {
        val playedCards: List<Card> = gameStateService.getPlayedCards(gameStateId)
        return ResponseEntity.ok(playedCards)
    }

    @PutMapping
    fun advanceState(@RequestBody gameStateAdvanceRequest: GameStateAdvanceRequest): ResponseEntity<Unit> {
        val newPhase: Phase = try {
            Phase.valueOf(gameStateAdvanceRequest.phaseString)
        } catch (exception: IllegalArgumentException) {
            throw PhaseDoesNotExistException()
        }
        gameStateService.advanceState(gameStateAdvanceRequest.id, newPhase)
        return ResponseEntity.ok().build()
    }
}