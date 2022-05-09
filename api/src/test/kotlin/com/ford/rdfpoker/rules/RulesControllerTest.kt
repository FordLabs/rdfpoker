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

import com.fasterxml.jackson.databind.ObjectMapper
import com.ford.rdfpoker.gamestate.GameState
import com.ford.rdfpoker.gamestate.GameStateRepository
import com.ford.rdfpoker.phase.Phase
import com.ford.rdfpoker.player.Player
import com.ford.rdfpoker.player.PlayerRepository
import com.ford.rdfpoker.rules.requests.RulesUpdateRequest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.*

@SpringBootTest
@AutoConfigureMockMvc
class RulesControllerTest {

    @Autowired
    private lateinit var gameStateRepository: GameStateRepository

    @Autowired
    private lateinit var rulesRepository: RulesRepository

    @Autowired
    private lateinit var playerRepository: PlayerRepository

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var mockMvc: MockMvc

    @AfterEach
    fun tearDown() {
        playerRepository.deleteAllInBatch()
        rulesRepository.deleteAllInBatch()
        gameStateRepository.deleteAllInBatch()
    }

    @Test
    fun `can update rules`() {
        val gameState = gameStateRepository.save(GameState())
        val rules = rulesRepository.save(Rules(gameState = gameState))

        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            prompt = "whatsitooya?",
            maxCardsInHand = 6,
            chipsAllottedPerPlayer = 1,
            preparationTimerDuration = 1337,
            turnTimerDuration = 420,
            bettingTimerDuration = 666,
            minChipsForCardPostGameDiscussion = 101,
            minCardContribution = 69
        )

        val mvcResult = mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isOk)
            .andReturn()

        val updatedRules: Rules = objectMapper.readValue(
            mvcResult.response.contentAsString,
            Rules::class.java
        )
        assertThat(updatedRules.prompt).isEqualTo(rulesUpdateRequest.prompt)
        assertThat(updatedRules.maxCardsInHand).isEqualTo(rulesUpdateRequest.maxCardsInHand)
        assertThat(updatedRules.chipsAllottedPerPlayer).isEqualTo(rulesUpdateRequest.chipsAllottedPerPlayer)
        assertThat(updatedRules.preparationTimerDuration).isEqualTo(rulesUpdateRequest.preparationTimerDuration)
        assertThat(updatedRules.turnTimerDuration).isEqualTo(rulesUpdateRequest.turnTimerDuration)
        assertThat(updatedRules.bettingTimerDuration).isEqualTo(rulesUpdateRequest.bettingTimerDuration)
        assertThat(updatedRules.minChipsForCardPostGameDiscussion).isEqualTo(rulesUpdateRequest.minChipsForCardPostGameDiscussion)
        assertThat(updatedRules.minCardContribution).isEqualTo(rulesUpdateRequest.minCardContribution)

        val updatedRulesFromDb = rulesRepository.findByIdOrNull(rules.id)
        assertThat(updatedRulesFromDb?.prompt).isEqualTo(rulesUpdateRequest.prompt)
        assertThat(updatedRulesFromDb?.maxCardsInHand).isEqualTo(rulesUpdateRequest.maxCardsInHand)
        assertThat(updatedRulesFromDb?.chipsAllottedPerPlayer).isEqualTo(rulesUpdateRequest.chipsAllottedPerPlayer)
        assertThat(updatedRulesFromDb?.preparationTimerDuration).isEqualTo(rulesUpdateRequest.preparationTimerDuration)
        assertThat(updatedRulesFromDb?.turnTimerDuration).isEqualTo(rulesUpdateRequest.turnTimerDuration)
        assertThat(updatedRulesFromDb?.bettingTimerDuration).isEqualTo(rulesUpdateRequest.bettingTimerDuration)
        assertThat(updatedRulesFromDb?.minChipsForCardPostGameDiscussion).isEqualTo(rulesUpdateRequest.minChipsForCardPostGameDiscussion)
        assertThat(updatedRulesFromDb?.minCardContribution).isEqualTo(rulesUpdateRequest.minCardContribution)
    }

    @Test
    fun `updating chipsAllottedPerPlayer updates all players in game`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState, chipsAllottedPerPlayer = 1))
        val player1 = playerRepository.save(Player(gameState = gameState, numChips = 1))
        val player2 = playerRepository.save(Player(gameState = gameState, numChips = 2))

        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            chipsAllottedPerPlayer = 3,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isOk)
            .andReturn()

        val updatedPlayer1 = playerRepository.findByIdOrNull(player1.id)
        val updatedPlayer2 = playerRepository.findByIdOrNull(player2.id)
        assertThat(updatedPlayer1?.numChips).isEqualTo(3)
        assertThat(updatedPlayer2?.numChips).isEqualTo(3)
    }

    @Test
    fun `can get rules for a game`() {
        val gameState = gameStateRepository.save(GameState())
        val expectedRules = rulesRepository.save(Rules(gameState = gameState))

        val mvcResult = mockMvc.perform(get("/api/rules/${gameState.id}"))
            .andExpect(status().isOk)
            .andReturn()

        val actualRules: Rules = objectMapper.readValue(
            mvcResult.response.contentAsString,
            Rules::class.java
        )
        assertThat(actualRules).isEqualTo(expectedRules)
    }

    @Test
    fun `throw 400 if trying to update rules not during PREGAME phase`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.PREPARATION))
        rulesRepository.save(Rules(gameState = gameState))
        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            prompt = "nope"
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        gameState.phase = Phase.TURN
        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        gameState.phase = Phase.BETTING
        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        gameState.phase = Phase.POSTGAME
        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to update rules for non-existent game`() {
        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = UUID.randomUUID(),
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to update rules for game that has no rules`() {
        val gameState = gameStateRepository.save(GameState())
        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to get rules for non-existent game`() {
        mockMvc.perform(get("/api/rules/${UUID.randomUUID()}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to get rules for game that has no rules`() {
        val gameState = gameStateRepository.save(GameState())

        mockMvc.perform(get("/api/rules/${gameState.id}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to update rules with negative values`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState))

        var rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            maxCardsInHand = -1,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            chipsAllottedPerPlayer = -1,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            preparationTimerDuration = -1,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            turnTimerDuration = -1,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            bettingTimerDuration = -1,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            minChipsForCardPostGameDiscussion = -1,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)

        rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            minCardContribution = -1,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to set max cards to more than 6`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState))

        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            maxCardsInHand = 7,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to set max chips to more than 5`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState))

        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            chipsAllottedPerPlayer = 6,
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `throw 400 if trying to set prompt to empty`() {
        val gameState = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState))

        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameState.id,
            prompt = "",
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isBadRequest)
    }
}
