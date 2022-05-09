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

import com.ford.rdfpoker.player.requests.DealerSwapRequest
import com.ford.rdfpoker.player.requests.PlayerBetRequest
import com.ford.rdfpoker.player.requests.PlayerCreateRequest
import com.ford.rdfpoker.player.requests.PlayerUpdateRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping(value = ["/api/player"])
class PlayerController(private val playerService: PlayerService) {

    @GetMapping("/{playerId}")
    fun getPlayer(@PathVariable playerId: UUID): ResponseEntity<Player> {
        val player = playerService.getPlayer(playerId)
        return ResponseEntity.ok(player)
    }

    @PostMapping
    fun createPlayer(@RequestBody playerCreateRequest: PlayerCreateRequest): ResponseEntity<Player> {
        val updatedPlayer = playerService.createPlayer(playerCreateRequest)
        return ResponseEntity.ok(updatedPlayer)
    }

    @PutMapping
    fun updatePlayer(@RequestBody playerUpdateRequest: PlayerUpdateRequest): ResponseEntity<Player> {
        val updatedPlayer = playerService.updatePlayer(playerUpdateRequest)
        return ResponseEntity.ok(updatedPlayer)
    }

    @PostMapping("/bet")
    fun betChip(@RequestBody playerBetRequest: PlayerBetRequest): ResponseEntity<Player> {
        val updatedPlayer = playerService.betChip(playerBetRequest)
        return ResponseEntity.ok(updatedPlayer)
    }

    @PostMapping("/dealer-swap")
    fun swapDealers(@RequestBody dealerSwapRequest: DealerSwapRequest): ResponseEntity<Void> {
        playerService.swapDealers(dealerSwapRequest)
        return ResponseEntity.ok().build()
    }
}