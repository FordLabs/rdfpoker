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

import com.ford.rdfpoker.card.requests.CardAddRequest
import com.ford.rdfpoker.card.requests.CardPlayRequest
import com.ford.rdfpoker.card.requests.CardUpdateRequest
import com.ford.rdfpoker.card.responses.CardAddResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping(value = ["/api/card"])
class CardController(private val cardService: CardService) {

    @PostMapping
    fun addCard(@RequestBody cardAddRequest: CardAddRequest): ResponseEntity<CardAddResponse> {
        return ResponseEntity.ok(cardService.addCard(cardAddRequest))
    }

    @PutMapping
    fun updateCard(@RequestBody cardUpdateRequest: CardUpdateRequest): ResponseEntity<Card> {
        val updatedCard = cardService.updateCard(cardUpdateRequest)
        return ResponseEntity.ok(updatedCard)
    }

    @DeleteMapping("/{cardId}")
    fun deleteCard(@PathVariable cardId: UUID): ResponseEntity<Unit> {
        cardService.deleteCard(cardId)
        return ResponseEntity.ok().build()
    }

    @PostMapping("/play")
    fun playCard(@RequestBody cardPlayRequest: CardPlayRequest): ResponseEntity<Unit> {
        return ResponseEntity.ok(cardService.playCard(cardPlayRequest))
    }
}