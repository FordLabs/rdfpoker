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

package com.ford.rdfpoker.sse

import com.fasterxml.jackson.databind.ObjectMapper
import com.ford.rdfpoker.TestSseListener
import com.ford.rdfpoker.card.Card
import com.ford.rdfpoker.card.CardRepository
import com.ford.rdfpoker.card.requests.CardPlayRequest
import com.ford.rdfpoker.gamestate.GameState
import com.ford.rdfpoker.gamestate.GameStateRepository
import com.ford.rdfpoker.gamestate.requests.GameStateAdvanceRequest
import com.ford.rdfpoker.gamestate.responses.TurnResponse
import com.ford.rdfpoker.getTestSseClient
import com.ford.rdfpoker.phase.Phase
import com.ford.rdfpoker.phase.notifications.CurrentPhaseNotification
import com.ford.rdfpoker.player.Player
import com.ford.rdfpoker.player.PlayerRepository
import com.ford.rdfpoker.rules.Rules
import com.ford.rdfpoker.rules.RulesRepository
import com.ford.rdfpoker.rules.requests.RulesUpdateRequest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.web.server.LocalServerPort
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.*

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class SseServiceTest {
    @Autowired
    private lateinit var gameStateRepository: GameStateRepository

    @Autowired
    private lateinit var playerRepository: PlayerRepository

    @Autowired
    private lateinit var cardRepository: CardRepository

    @Autowired
    private lateinit var rulesRepository: RulesRepository

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @LocalServerPort
    private var serverPort = 0

    @AfterEach
    fun tearDown() {
        cardRepository.deleteAllInBatch()
        playerRepository.deleteAllInBatch()
        rulesRepository.deleteAllInBatch()
        gameStateRepository.deleteAllInBatch()
    }

    @Test
    fun `SseService notifies when phase changes`() {
        val gameState = gameStateRepository.save(GameState())

        val listener = TestSseListener()
        val absoluteServerUrl = "http://localhost:$serverPort/api/receive/${gameState.id}"
        val sse = getTestSseClient(absoluteServerUrl, listener)

        Thread.sleep(500)

        advanceGamePhase(gameState.id, Phase.POSTGAME)

        Thread.sleep(500)

        val messageName = listener.messagesReceived[0].first
        assertThat(messageName).isEqualTo(SseNotificationType.PHASE.name)

        val messageData = listener.messagesReceived[0].second
        val actualSseResponse = objectMapper.readValue(
            messageData,
            CurrentPhaseNotification::class.java
        )
        val expectedSseResponse = CurrentPhaseNotification(Phase.POSTGAME)
        assertThat(actualSseResponse).isEqualTo(expectedSseResponse)

        sse.close()
    }

    @Test
    fun `whoseTurn SseEmitter notifies once a player has played a card`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.TURN))
        val player = playerRepository.save(Player(gameState = gameState, nickName = "Joseph"))
        val card = cardRepository.save(Card(player = player))

        val listener = TestSseListener()
        val absoluteServerUrl = "http://localhost:$serverPort/api/receive/${gameState.id}"
        val sse = getTestSseClient(absoluteServerUrl, listener)

        Thread.sleep(500)

        playACard(card)

        Thread.sleep(500)

        // all cards have been played so no one's turn
        val messageName = listener.messagesReceived[0].first
        assertThat(messageName).isEqualTo(SseNotificationType.TURN.name)

        val messageData = listener.messagesReceived[0].second
        val actualSseResponse = objectMapper.readValue(
            messageData,
            TurnResponse::class.java
        )
        val expectedSseResponse = TurnResponse(null, null)
        assertThat(actualSseResponse).isEqualTo(expectedSseResponse)

        sse.close()
    }

    @Test
    fun `rules SseEmitter notifies once rules have changed`() {
        val gameState = gameStateRepository.save(GameState())
        val rules = rulesRepository.save(Rules(gameState = gameState))

        val listener = TestSseListener()
        val absoluteServerUrl = "http://localhost:$serverPort/api/receive/${gameState.id}"
        val sse = getTestSseClient(absoluteServerUrl, listener)

        Thread.sleep(500)

        updateRules(gameState.id)

        Thread.sleep(500)

        // all cards have been played so no one's turn
        val messageName = listener.messagesReceived[0].first
        assertThat(messageName).isEqualTo(SseNotificationType.RULES.name)

        val messageData = listener.messagesReceived[0].second
        val actualSseResponse = objectMapper.readValue(
            messageData,
            Rules::class.java
        )
        val expectedSseResponse = Rules(id = rules.id, prompt = "whatsitooya")
        assertThat(actualSseResponse).isEqualTo(expectedSseResponse)

        sse.close()
    }

    @Test
    fun `whoseTurn SseEmitter notifies when TURN phase begins`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.PREPARATION))
        val player = playerRepository.save(Player(gameState = gameState, nickName = "Joseph"))
        cardRepository.save(Card(player = player))

        val listener = TestSseListener()
        val absoluteServerUrl = "http://localhost:$serverPort/api/receive/${gameState.id}"
        val sse = getTestSseClient(absoluteServerUrl, listener)

        Thread.sleep(500)

        advanceGamePhase(gameState.id, Phase.TURN)

        Thread.sleep(500)

        assertThat(listener.messagesReceived.count()).isEqualTo(2)
        val messageName = listener.messagesReceived[1].first
        assertThat(messageName).isEqualTo(SseNotificationType.TURN.name)

        val messageData = listener.messagesReceived[1].second
        val actualSseResponse = objectMapper.readValue(
            messageData,
            TurnResponse::class.java
        )
        val expectedSseResponse = TurnResponse(player.id, player.nickName)
        assertThat(actualSseResponse).isEqualTo(expectedSseResponse)

        sse.close()
    }

    private fun advanceGamePhase(gameStateId: UUID, phase: Phase) {
        val gameStateAdvanceRequest = GameStateAdvanceRequest(
            id = gameStateId,
            phaseString = phase.toString()
        )
        mockMvc.perform(put("/api/state")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(gameStateAdvanceRequest)))
            .andExpect(status().isOk)
    }

    private fun playACard(card: Card) {
        val cardPlayRequest = CardPlayRequest(id = card.id)
        mockMvc.perform(post("/api/card/play")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(cardPlayRequest)))
            .andExpect(status().isOk)
    }

    private fun updateRules(gameStateId: UUID) {
        val rulesUpdateRequest = RulesUpdateRequest(
            gameStateId = gameStateId,
            prompt = "whatsitooya?"
        )

        mockMvc.perform(put("/api/rules")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(rulesUpdateRequest)))
            .andExpect(status().isOk)
    }
}