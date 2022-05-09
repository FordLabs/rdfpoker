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

import com.fasterxml.jackson.databind.ObjectMapper
import com.ford.rdfpoker.card.Card
import com.ford.rdfpoker.card.CardRepository
import com.ford.rdfpoker.card.CardStatus
import com.ford.rdfpoker.gamestate.GameState
import com.ford.rdfpoker.gamestate.GameStateRepository
import com.ford.rdfpoker.player.requests.DealerSwapRequest
import com.ford.rdfpoker.player.requests.PlayerBetRequest
import com.ford.rdfpoker.player.requests.PlayerCreateRequest
import com.ford.rdfpoker.player.requests.PlayerUpdateRequest
import com.ford.rdfpoker.rules.Rules
import com.ford.rdfpoker.rules.RulesRepository
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.search.MeterNotFoundException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
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

@SpringBootTest
@AutoConfigureMockMvc
class PlayerControllerTest {

    @Autowired
    private lateinit var playerRepository: PlayerRepository

    @Autowired
    private lateinit var cardRepository: CardRepository

    @Autowired
    private lateinit var gameStateRepository: GameStateRepository

    @Autowired
    private lateinit var rulesRepository: RulesRepository

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var meterRegistry: MeterRegistry

    @Autowired
    private lateinit var mockMvc: MockMvc

    @AfterEach
    fun tearDown() {
        cardRepository.deleteAllInBatch()
        playerRepository.deleteAllInBatch()
        rulesRepository.deleteAllInBatch()
        gameStateRepository.deleteAllInBatch()
    }

    @Test
    fun `can get a specific player`() {
        val gameState = gameStateRepository.save(GameState())
        val player = playerRepository.save(Player(gameState = gameState))

        val mvcResult = mockMvc.perform(get("/api/player/${player.id}"))
            .andExpect(status().isOk)
            .andReturn()

        val actualPlayer: Player = objectMapper.readValue(
            mvcResult.response.contentAsString,
            Player::class.java
        )
        assertThat(actualPlayer).isEqualTo(player)
    }

    @Test
    fun `throw 400 if trying to get non-existent player`() {
        mockMvc.perform(get("/api/player/${UUID.randomUUID()}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `can update a player`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState))
        val player = playerRepository.save(Player(gameState = gameState, numChips = 1))

        val playerUpdateRequest = PlayerUpdateRequest(
            id = player.id,
            numChips = 0,
            nickName = "Herbert"
        )

        val mvcResult = mockMvc.perform(put("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerUpdateRequest)))
            .andExpect(status().isOk)
            .andReturn()

        val updatedPlayerFromResponse: Player = objectMapper.readValue(
            mvcResult.response.contentAsString,
            Player::class.java
        )
        val updatedPlayerFromDb = playerRepository.findByIdOrNull(player.id)

        assertThat(updatedPlayerFromResponse.id).isEqualTo(player.id)
        assertThat(updatedPlayerFromDb?.id).isEqualTo(player.id)

        assertThat(updatedPlayerFromResponse.numChips).isEqualTo(playerUpdateRequest.numChips)
        assertThat(updatedPlayerFromResponse.nickName).isEqualTo(playerUpdateRequest.nickName)
        assertThat(updatedPlayerFromDb?.numChips).isEqualTo(playerUpdateRequest.numChips)
        assertThat(updatedPlayerFromDb?.nickName).isEqualTo(playerUpdateRequest.nickName)
    }

    @Test
    fun `can create a player for a game`() {
        val gameState = gameStateRepository.save(GameState())
        val rules = rulesRepository.save(Rules(gameState = gameState, chipsAllottedPerPlayer = 5))

        val playerCreateRequest = PlayerCreateRequest(
            gameStateId = gameState.id,
            nickName = "Herbert",
            isDealer = true
        )

        val mvcResult = mockMvc.perform(post("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerCreateRequest)))
            .andExpect(status().isOk)
            .andReturn()

        val createdPlayerFromResponse: Player = objectMapper.readValue(
            mvcResult.response.contentAsString,
            Player::class.java
        )
        val createdPlayerFromDb = playerRepository.findAll().firstOrNull()

        assertThat(createdPlayerFromResponse.nickName).isEqualTo(playerCreateRequest.nickName)
        assertThat(createdPlayerFromResponse.isDealer).isEqualTo(playerCreateRequest.isDealer)
        assertThat(createdPlayerFromResponse.numChips).isEqualTo(rules.chipsAllottedPerPlayer)
        assertThat(createdPlayerFromDb?.nickName).isEqualTo(playerCreateRequest.nickName)
        assertThat(createdPlayerFromDb?.isDealer).isEqualTo(playerCreateRequest.isDealer)
        assertThat(createdPlayerFromDb?.numChips).isEqualTo(rules.chipsAllottedPerPlayer)
    }

    @Test
    fun `creating a player for a game logs a metric`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState))
        val initialMetricCount = `get number of players created for a game`(gameState.id)

        val playerCreateRequest = PlayerCreateRequest(
            gameStateId = gameState.id,
            nickName = "Herbert",
        )

        mockMvc.perform(post("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerCreateRequest)))
            .andExpect(status().isOk)

        val finalMetricCount = `get number of players created for a game`(gameState.id)
        assertThat(finalMetricCount).isEqualTo(initialMetricCount + 1)
    }

    @Test
    fun `can bet a chip on a card`() {
        val gameState = gameStateRepository.save(GameState())
        val card = cardRepository.save(Card(cardStatus = CardStatus.ONTABLE))
        val player1 = playerRepository.save(Player(gameState = gameState, numChips = 1))
        // some other player
        playerRepository.save(Player(gameState = gameState, numChips = 0, cards = setOf(card)))
        val playerBetRequest = PlayerBetRequest(
            playerId = player1.id,
            cardId = card.id
        )

        val mvcResult = mockMvc.perform(post("/api/player/bet")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerBetRequest)))
            .andExpect(status().isOk)
            .andReturn()

        val updatedPlayerFromResponse: Player = objectMapper.readValue(
            mvcResult.response.contentAsString,
            Player::class.java
        )

        val updatedCard = cardRepository.findByIdOrNull(card.id)
        assertThat(updatedCard?.numChips).isOne()

        val updatedPlayer1 = playerRepository.findByIdOrNull(player1.id)
        assertThat(updatedPlayer1?.numChips).isZero()
        assertThat(updatedPlayer1).isEqualTo(updatedPlayerFromResponse)
    }

    @Test
    fun `can reassign dealer`() {
        val gameState = gameStateRepository.save(GameState())
        val currentDealer = playerRepository.save(Player(gameState = gameState, isDealer = true))
        val futureDealer = playerRepository.save(Player(gameState = gameState, isDealer = false))

        val dealerSwapRequest = DealerSwapRequest(
            currentDealerId = currentDealer.id,
            futureDealerId = futureDealer.id
        )

        mockMvc.perform(post("/api/player/dealer-swap")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dealerSwapRequest)))
            .andExpect(status().isOk)

        val originalDealer = playerRepository.findByIdOrNull(currentDealer.id)
        assertThat(originalDealer?.isDealer).isFalse()
        val newDealer = playerRepository.findByIdOrNull(futureDealer.id)
        assertThat(newDealer?.isDealer).isTrue()
    }

    @Test
    fun `throw 400 if trying to update non-existent player`() {
        val playerUpdateRequest = PlayerUpdateRequest(id = UUID.randomUUID())

        mockMvc.perform(put("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to set more chips than rules allow`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(chipsAllottedPerPlayer = 5, gameState = gameState))
        val player = playerRepository.save(Player(gameState = gameState, numChips = 3))

        val playerUpdateRequest = PlayerUpdateRequest(
            id = player.id,
            numChips = 1337,
        )

        mockMvc.perform(put("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to set negative chips`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(chipsAllottedPerPlayer = 5, gameState = gameState))
        val player = playerRepository.save(Player(gameState = gameState, numChips = 3))

        val playerUpdateRequest = PlayerUpdateRequest(
            id = player.id,
            numChips = -1,
        )

        mockMvc.perform(put("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to create a player for non-existent game`() {
        val playerCreateRequest = PlayerCreateRequest(
            gameStateId = UUID.randomUUID(),
            nickName = "Herbert",
            isDealer = false
        )

        mockMvc.perform(post("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerCreateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to create a player with nickName already in use`() {
        val gameState = gameStateRepository.save(GameState())
        playerRepository.save(Player(nickName = "Herbert", gameState = gameState))

        val playerCreateRequest = PlayerCreateRequest(
            gameStateId = gameState.id,
            nickName = "Herbert",
            isDealer = false
        )

        mockMvc.perform(post("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerCreateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if non-existent player is trying to bet`() {
        gameStateRepository.save(GameState())
        val card = cardRepository.save(Card(cardStatus = CardStatus.ONTABLE))
        val playerBetRequest = PlayerBetRequest(
            playerId = UUID.randomUUID(),
            cardId = card.id
        )

        mockMvc.perform(post("/api/player/bet")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerBetRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to create a player in a game with no rules`() {
        val gameState = gameStateRepository.save(GameState())

        val playerCreateRequest = PlayerCreateRequest(
            gameStateId = gameState.id,
            nickName = null
        )

        mockMvc.perform(post("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerCreateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if player is trying to bet on non-existent card`() {
        val gameState = gameStateRepository.save(GameState())
        val player = playerRepository.save(Player(gameState = gameState, numChips = 1))
        val playerBetRequest = PlayerBetRequest(
            playerId = player.id,
            cardId = UUID.randomUUID()
        )

        mockMvc.perform(post("/api/player/bet")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerBetRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if player is trying to bet with no chips left`() {
        val gameState = gameStateRepository.save(GameState())
        val card = cardRepository.save(Card(cardStatus = CardStatus.ONTABLE))
        val player1 = playerRepository.save(Player(gameState = gameState, numChips = 0))
        val playerBetRequest = PlayerBetRequest(
            playerId = player1.id,
            cardId = card.id
        )

        mockMvc.perform(post("/api/player/bet")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerBetRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to create a second dealer for a game`() {
        val gameState = gameStateRepository.save(GameState())
        playerRepository.save(Player(gameState = gameState, isDealer = true))

        val playerCreateRequest = PlayerCreateRequest(
            gameStateId = gameState.id,
            nickName = "Herbert",
            isDealer = true
        )

        mockMvc.perform(post("/api/player")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(playerCreateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to swap dealers with players not from same game`() {
        val gameState1 = gameStateRepository.save(GameState())
        val gameState2 = gameStateRepository.save(GameState())
        val currentDealer = playerRepository.save(Player(gameState = gameState1, isDealer = true))
        val futureDealer = playerRepository.save(Player(gameState = gameState2, isDealer = false))

        val dealerSwapRequest = DealerSwapRequest(
            currentDealerId = currentDealer.id,
            futureDealerId = futureDealer.id
        )

        mockMvc.perform(post("/api/player/dealer-swap")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dealerSwapRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to swap dealers when currentDealer is not a dealer`() {
        val gameState = gameStateRepository.save(GameState())
        val currentDealer = playerRepository.save(Player(gameState = gameState, isDealer = false))
        val futureDealer = playerRepository.save(Player(gameState = gameState, isDealer = false))

        val dealerSwapRequest = DealerSwapRequest(
            currentDealerId = currentDealer.id,
            futureDealerId = futureDealer.id
        )

        mockMvc.perform(post("/api/player/dealer-swap")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dealerSwapRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to swap dealers for non-existent players`() {
        val gameState = gameStateRepository.save(GameState())
        val realPlayer = playerRepository.save(Player(gameState = gameState, isDealer = false))

        var dealerSwapRequest = DealerSwapRequest(
            currentDealerId = realPlayer.id,
            futureDealerId = UUID.randomUUID()
        )

        mockMvc.perform(post("/api/player/dealer-swap")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dealerSwapRequest)))
            .andExpect(status().isBadRequest)

        dealerSwapRequest = DealerSwapRequest(
            currentDealerId = UUID.randomUUID(),
            futureDealerId = realPlayer.id
        )

        mockMvc.perform(post("/api/player/dealer-swap")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dealerSwapRequest)))
            .andExpect(status().isBadRequest)
    }

    private fun `get number of players created for a game`(gameStateId: UUID): Double {
        val count: Double = try {
            meterRegistry
                .get("rdfpoker.player.created")
                .tag("game", gameStateId.toString())
                .counter()
                .count()
        } catch (ex: MeterNotFoundException) {
            0.0
        }
        return count
    }
}