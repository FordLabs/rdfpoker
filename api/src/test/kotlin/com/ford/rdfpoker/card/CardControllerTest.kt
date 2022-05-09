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

import com.fasterxml.jackson.databind.ObjectMapper
import com.ford.rdfpoker.card.exceptions.CardDoesNotExistException
import com.ford.rdfpoker.card.requests.CardAddRequest
import com.ford.rdfpoker.card.requests.CardPlayRequest
import com.ford.rdfpoker.card.requests.CardUpdateRequest
import com.ford.rdfpoker.card.responses.CardAddResponse
import com.ford.rdfpoker.gamestate.GameState
import com.ford.rdfpoker.gamestate.GameStateRepository
import com.ford.rdfpoker.gamestate.exceptions.GameStateDoesNotExistException
import com.ford.rdfpoker.player.Player
import com.ford.rdfpoker.player.PlayerRepository
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.search.MeterNotFoundException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.*

@SpringBootTest(properties = ["spring.jpa.properties.hibernate.enable_lazy_load_no_trans=true"])
@AutoConfigureMockMvc
class CardControllerTest {

    @Autowired
    private lateinit var cardRepository: CardRepository

    @Autowired
    private lateinit var playerRepository: PlayerRepository

    @Autowired
    private lateinit var gameStateRepository: GameStateRepository

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var meterRegistry: MeterRegistry

    @Autowired
    private lateinit var mockMvc: MockMvc

    private lateinit var player1: Player
    private lateinit var gameState: GameState

    @BeforeEach
    fun setUp() {
        gameState = gameStateRepository.save(GameState())
        player1 = playerRepository.save(Player(gameState = gameState))
    }

    @AfterEach
    fun tearDown() {
        cardRepository.deleteAllInBatch()
        playerRepository.deleteAllInBatch()
        gameStateRepository.deleteAllInBatch()
    }

    @Test
    fun `can add a new card for a player`() {
        assertThat(cardRepository.count()).isZero()

        val cardAddRequest = CardAddRequest(playerId = player1.id)

        val mvcResult = mockMvc.perform(post("/api/card")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(cardAddRequest)))
            .andExpect(status().isOk)
            .andReturn()

        val actualCardAddResponse: CardAddResponse = objectMapper.readValue(
            mvcResult.response.contentAsString,
            CardAddResponse::class.java
        )
        assertThat(actualCardAddResponse.playerId).isEqualTo(player1.id)

        val allCardsInDB = cardRepository.findAll()
        assertThat(allCardsInDB.count()).isOne
        val actualCardInDB: Card = allCardsInDB.first()

        assertThat(actualCardInDB.player).isEqualTo(player1)
    }

    @Test
    fun `can not add a card for a player that does not exist`() {
        val card = CardAddRequest(playerId = UUID.randomUUID())

        mockMvc.perform(post("/api/card")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(card)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `can update an existing card`() {
        val cardToUpdate = cardRepository.save(Card(content = "testCard", player = player1))

        val cardUpdateRequest = CardUpdateRequest(
            id = cardToUpdate.id,
            content = "updatedTestCard",
            cardStatus = CardStatus.ONTABLE,
            numChips = 1337
        )

        val mvcResult = mockMvc.perform(put("/api/card")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(cardUpdateRequest)))
            .andExpect(status().isOk)
            .andReturn()

        val updatedCard: Card = objectMapper.readValue(
            mvcResult.response.contentAsString,
            Card::class.java
        )

        val allCardsInDB = cardRepository.findAll()
        assertThat(allCardsInDB.count()).isOne()
        val actualCardInDB: Card = allCardsInDB.first()

        assertThat(updatedCard.content).isEqualTo(cardUpdateRequest.content)
        assertThat(actualCardInDB.content).isEqualTo(cardUpdateRequest.content)

        assertThat(updatedCard.cardStatus).isEqualTo(cardUpdateRequest.cardStatus)
        assertThat(actualCardInDB.cardStatus).isEqualTo(cardUpdateRequest.cardStatus)

        assertThat(updatedCard.numChips).isEqualTo(cardUpdateRequest.numChips)
        assertThat(actualCardInDB.numChips).isEqualTo(cardUpdateRequest.numChips)
    }

    @Test
    fun `updating a card from INHAND to ONTABLE updates timestamp for when player last played`() {
        val initialTimestamp = player1.lastTurnCompletedTimestamp
        val cardToUpdate = cardRepository.save(Card(content = "testCard", player = player1))

        val cardUpdateRequest = CardUpdateRequest(
            id = cardToUpdate.id,
            cardStatus = CardStatus.ONTABLE,
        )

        mockMvc.perform(put("/api/card")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(cardUpdateRequest)))
            .andExpect(status().isOk)

        val updatedPlayer = playerRepository.findByIdOrNull(player1.id)
        assertThat(updatedPlayer?.lastTurnCompletedTimestamp).isAfter(initialTimestamp)
    }

    @Test
    fun `updating a card from INHAND to ONTABLE logs a metric`() {
        val gameStateId = player1.gameState?.id ?: throw GameStateDoesNotExistException()
        val initialMetricCount = `get number of cards played in a game`(gameStateId)

        val cardToUpdate = cardRepository.save(Card(player = player1))

        val cardUpdateRequest = CardUpdateRequest(
            id = cardToUpdate.id,
            cardStatus = CardStatus.ONTABLE,
        )

        mockMvc.perform(put("/api/card")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(cardUpdateRequest)))
            .andExpect(status().isOk)

        val finalMetricCount = `get number of cards played in a game`(gameStateId)
        assertThat(finalMetricCount).isEqualTo(initialMetricCount + 1)
    }

    @Test
    fun `can play a card when it's your turn`() {
        val cardToPlay = cardRepository.save(Card(player = player1))

        playCard(cardToPlay.id)

        val playedCard = cardRepository.findByIdOrNull(cardToPlay.id) ?: throw CardDoesNotExistException()
        assertThat(playedCard.cardStatus).isEqualTo(CardStatus.ONDISPLAY)
    }

    @Test
    fun `playing a card will move existing card ONDISPLAY to ONTABLE`() {
        val card1 = cardRepository.save(Card(player = player1, cardStatus = CardStatus.ONDISPLAY))
        val card2 = cardRepository.save(Card(player = player1))

        playCard(card2.id)

        val updatedCard1 = cardRepository.findByIdOrNull(card1.id) ?: throw CardDoesNotExistException()
        val updatedCard2 = cardRepository.findByIdOrNull(card2.id) ?: throw CardDoesNotExistException()
        assertThat(updatedCard1.cardStatus).isEqualTo(CardStatus.ONTABLE)
        assertThat(updatedCard2.cardStatus).isEqualTo(CardStatus.ONDISPLAY)
    }

    @Test
    fun `playing a card logs a metric`() {
        val gameStateId = player1.gameState?.id ?: throw GameStateDoesNotExistException()
        val initialMetricCount = `get number of cards played in a game`(gameStateId)
        val cardToPlay = cardRepository.save(Card(player = player1))

        playCard(cardToPlay.id)

        val finalMetricCount = `get number of cards played in a game`(gameStateId)
        assertThat(finalMetricCount).isEqualTo(initialMetricCount + 1)
    }

    @Test
    fun `playing a card updates timestamp for when player last played`() {
        val initialTimestamp = player1.lastTurnCompletedTimestamp
        val cardToPlay = cardRepository.save(Card(player = player1))

        playCard(cardToPlay.id)

        val updatedPlayer = playerRepository.findByIdOrNull(player1.id)
        assertThat(updatedPlayer?.lastTurnCompletedTimestamp).isAfter(initialTimestamp)
    }

    @Test
    fun `throw 403 when trying to play a card when not your turn`() {
        cardRepository.save(Card(player = player1))

        val player2 = playerRepository.save(Player(gameState = gameState))
        val player2Card = cardRepository.save(Card(player = player2))

        val cardPlayRequest = CardPlayRequest(
            id = player2Card.id,
        )

        mockMvc.perform(post("/api/card/play")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(cardPlayRequest)))
            .andExpect(status().isForbidden)
    }

    @Test
    fun `throw 400 if trying to update a card not in db`() {
        val card = Card(content = "testCard", player = player1)

        mockMvc.perform(put("/api/card")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(card)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `can delete an existing card`() {
        val cardToDelete = cardRepository.save(Card(content = "testCard", player = player1))

        mockMvc.perform(delete("/api/card/${cardToDelete.id}"))
            .andExpect(status().isOk)
    }

    @Test
    fun `throw 400 if trying to delete a card not in db`() {
        mockMvc.perform(delete("/api/card/${UUID.randomUUID()}"))
            .andExpect(status().isBadRequest)
    }

    private fun `get number of cards played in a game`(gameStateId: UUID): Double {
        val count: Double = try {
            meterRegistry
                .get("rdfpoker.card.played")
                .tag("game", gameStateId.toString())
                .counter()
                .count()
        } catch (ex: MeterNotFoundException) {
            0.0
        }
        return count
    }

    private fun playCard(cardId: UUID) {
        val cardPlayRequest = CardPlayRequest(
            id = cardId,
        )

        mockMvc.perform(post("/api/card/play")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(cardPlayRequest)))
            .andExpect(status().isOk)
    }
}
