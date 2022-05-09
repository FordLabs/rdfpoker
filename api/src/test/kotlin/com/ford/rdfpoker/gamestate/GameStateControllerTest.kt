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

import com.fasterxml.jackson.databind.ObjectMapper
import com.ford.rdfpoker.card.Card
import com.ford.rdfpoker.card.CardRepository
import com.ford.rdfpoker.card.CardStatus
import com.ford.rdfpoker.card.exceptions.CardDoesNotExistException
import com.ford.rdfpoker.gamestate.requests.GameStateAdvanceRequest
import com.ford.rdfpoker.gamestate.responses.CreatedGameStateResponse
import com.ford.rdfpoker.gamestate.responses.CurrentPhaseResponse
import com.ford.rdfpoker.gamestate.responses.StateResponse
import com.ford.rdfpoker.gamestate.responses.TurnResponse
import com.ford.rdfpoker.phase.Phase
import com.ford.rdfpoker.phase.notifications.CurrentPhaseNotification
import com.ford.rdfpoker.player.Player
import com.ford.rdfpoker.player.PlayerRepository
import com.ford.rdfpoker.rules.Rules
import com.ford.rdfpoker.rules.RulesRepository
import com.ford.rdfpoker.sse.SseNotificationType
import com.ford.rdfpoker.sse.SseService
import com.nhaarman.mockitokotlin2.verify
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.search.MeterNotFoundException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.*


@SpringBootTest(properties = ["spring.jpa.properties.hibernate.enable_lazy_load_no_trans=true"])
@AutoConfigureMockMvc
class GameStateControllerTest {

    @Autowired
    private lateinit var gameStateRepository: GameStateRepository

    @Autowired
    private lateinit var rulesRepository: RulesRepository

    @Autowired
    private lateinit var cardRepository: CardRepository

    @Autowired
    private lateinit var playerRepository: PlayerRepository

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var meterRegistry: MeterRegistry

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var sseService: SseService

    @AfterEach
    fun tearDown() {
        rulesRepository.deleteAllInBatch()
        cardRepository.deleteAllInBatch()
        playerRepository.deleteAllInBatch()
        gameStateRepository.deleteAllInBatch()
    }

    @Test
    fun `can create a new game with rules`() {
        val mvcResult = mockMvc.perform(post("/api/state"))
            .andExpect(status().isOk)
            .andReturn()

        val createdGameState: CreatedGameStateResponse = objectMapper.readValue(
            mvcResult.response.contentAsString,
            CreatedGameStateResponse::class.java
        )
        val gameState = gameStateRepository.findAll().firstOrNull()
        val rules = rulesRepository.findAll().firstOrNull()
        assertThat(gameState?.id).isEqualTo(createdGameState.gameStateId)
        assertThat(gameState?.rules).isEqualTo(rules)
    }

    @Test
    fun `creating a game logs a metric`() {
        val initialMetricCount = `get number of games created`()

        mockMvc.perform(post("/api/state"))
            .andExpect(status().isOk)

        val finalMetricCount = `get number of games created`()
        assertThat(finalMetricCount).isEqualTo(initialMetricCount + 1)
    }

    @Test
    fun `can get state of a game`() {
        val gameState = gameStateRepository.save(GameState())
        val rules = rulesRepository.save(Rules(gameState = gameState))
        val player = playerRepository.save(Player(gameState = gameState))
        val cardOnTable = cardRepository.save(Card(
            content = "testCard",
            player = player,
            cardStatus = CardStatus.ONTABLE
        ))
        val cardOnDisplay = cardRepository.save(Card(
            content = "testCard2",
            player = player,
            cardStatus = CardStatus.ONDISPLAY
        ))
        cardRepository.save(Card(
            content = "testCard3",
            player = player,
            cardStatus = CardStatus.INHAND
        ))

        val mvcResult = mockMvc.perform(get("/api/state/${gameState.id}"))
            .andExpect(status().isOk)
            .andReturn()
        val actualStateResponse: StateResponse = objectMapper.readValue(
            mvcResult.response.contentAsString,
            StateResponse::class.java
        )

        val expectedStateResponse = StateResponse(
            cardsOnTable = listOf(cardOnTable),
            cardDisplayed = cardOnDisplay,
            phase = gameState.phase,
            rules = rules,
            whoseTurn = TurnResponse(playerId = player.id)
        )
        assertThat(actualStateResponse).isEqualTo(expectedStateResponse)
    }

    @Test
    fun `can get phase of a game`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.POSTGAME))

        val mvcResult = mockMvc.perform(get("/api/state/phase/${gameState.id}"))
            .andExpect(status().isOk)
            .andReturn()
        val actualStateResponse: CurrentPhaseResponse = objectMapper.readValue(
            mvcResult.response.contentAsString,
            CurrentPhaseResponse::class.java
        )

        val expectedPhaseResponse = CurrentPhaseResponse(phase = Phase.POSTGAME)
        assertThat(actualStateResponse).isEqualTo(expectedPhaseResponse)
    }

    @Test
    fun `cannot get state of non-existent game`() {
        mockMvc.perform(get("/api/state/${UUID.randomUUID()}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `cannot get phase of non-existent game`() {
        mockMvc.perform(get("/api/state/phase/${UUID.randomUUID()}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `cannot get state of game with non-existent player`() {
        val gameState = gameStateRepository.save(GameState())
        mockMvc.perform(get("/api/state/${gameState.id}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `only get cards for game requested`() {
        val gameState1 = gameStateRepository.save(GameState())
        rulesRepository.save(Rules(gameState = gameState1))
        val playerInGame1 = playerRepository.save(Player(gameState = gameState1))
        val cardOnTableInGame1 = cardRepository.save(Card(
            content = "testCard",
            player = playerInGame1,
            cardStatus = CardStatus.ONTABLE
        ))
        val cardOnDisplayInGame1 = cardRepository.save(Card(
            content = "testCard2",
            player = playerInGame1,
            cardStatus = CardStatus.ONDISPLAY
        ))

        val gameState2 = gameStateRepository.save(GameState())
        val playerInGame2 = playerRepository.save(Player(gameState = gameState2))
        val cardOnTableInGame2 = cardRepository.save(Card(
            content = "testCard3",
            player = playerInGame2,
            cardStatus = CardStatus.ONTABLE
        ))
        val cardOnDisplayInGame2 = cardRepository.save(Card(
            content = "testCard4",
            player = playerInGame2,
            cardStatus = CardStatus.ONDISPLAY
        ))

        val mvcResult = mockMvc.perform(get("/api/state/${gameState1.id}"))
            .andExpect(status().isOk)
            .andReturn()
        val actualStateResponse: StateResponse = objectMapper.readValue(
            mvcResult.response.contentAsString,
            StateResponse::class.java
        )

        assertThat(actualStateResponse.cardsOnTable).contains(cardOnTableInGame1)
        assertThat(actualStateResponse.cardDisplayed).isEqualTo(cardOnDisplayInGame1)

        assertThat(actualStateResponse.cardsOnTable).doesNotContain(cardOnTableInGame2)
        assertThat(actualStateResponse.cardDisplayed).isNotEqualTo(cardOnDisplayInGame2)
    }

    @Test
    fun `can advance phase of the game`() {
        val gameState = gameStateRepository.save(GameState())
        assertThat(gameState.phase).isEqualTo(Phase.PREGAME)

        val gameStateAdvanceRequest = GameStateAdvanceRequest(
            id = gameState.id,
            phaseString = Phase.PREPARATION.name
        )

        mockMvc.perform(put("/api/state")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(gameStateAdvanceRequest)))
            .andExpect(status().isOk)

        val updatedGameState = gameStateRepository.findByIdOrNull(gameState.id)
        assertThat(updatedGameState?.phase).isEqualTo(Phase.PREPARATION)

        val expectedSseResponse = CurrentPhaseNotification(Phase.PREPARATION)
        verify(sseService).sendNotificationToClients(gameState.id, expectedSseResponse, SseNotificationType.PHASE)
    }

    @Test
    fun `advancing phase to TURN will discard all player's blank cards in hand`() {
        val gameState = gameStateRepository.save(GameState())
        val player1 = playerRepository.save(Player(gameState = gameState))
        val player2 = playerRepository.save(Player(gameState = gameState))
        val cardWithContent = cardRepository.save(Card(player = player1, content = "HI"))
        val emptyCard1 = cardRepository.save(Card(player = player1))
        val emptyCard2 = cardRepository.save(Card(player = player2))

        val gameStateAdvanceRequest = GameStateAdvanceRequest(
            id = gameState.id,
            phaseString = Phase.TURN.name
        )

        mockMvc.perform(put("/api/state")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(gameStateAdvanceRequest)))
            .andExpect(status().isOk)

        val updatedPlayer1 = playerRepository.findByIdOrNull(player1.id)!!
        val updatedPlayer2 = playerRepository.findByIdOrNull(player2.id)!!
        assertThat(updatedPlayer1.cards.size).isOne
        assertThat(updatedPlayer2.cards.size).isZero

        assertThat(cardRepository.findByIdOrNull(cardWithContent.id)).isNotNull
        assertThat(cardRepository.findByIdOrNull(emptyCard1.id)).isNull()
        assertThat(cardRepository.findByIdOrNull(emptyCard2.id)).isNull()
    }

    @Test
    fun `advancing phase to BETTING will move card ONDISPLAY to ONTABLE`() {
        val gameState = gameStateRepository.save(GameState())
        val player1 = playerRepository.save(Player(gameState = gameState))
        val card = cardRepository.save(Card(player = player1, cardStatus = CardStatus.ONDISPLAY))

        val gameStateAdvanceRequest = GameStateAdvanceRequest(
            id = gameState.id,
            phaseString = Phase.BETTING.name
        )

        mockMvc.perform(put("/api/state")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(gameStateAdvanceRequest)))
            .andExpect(status().isOk)

        val updatedCard = cardRepository.findByIdOrNull(card.id) ?: throw CardDoesNotExistException()
        assertThat(updatedCard.cardStatus).isEqualTo(CardStatus.ONTABLE)
    }

    @Test
    fun `In turn phase, game auto selects turn with person who went longest ago`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.TURN))
        val otherPlayer = playerRepository.save(Player(gameState = gameState))
        val expectedPlayerToHaveNextTurn = playerRepository.save(Player(
            gameState = gameState,
            lastTurnCompletedTimestamp = OffsetDateTime.of(
                2010,
                1,
                1,
                0,
                0,
                0,
                0,
                ZoneOffset.UTC
            )
        ))

        cardRepository.save(Card(player = otherPlayer))
        cardRepository.save(Card(player = expectedPlayerToHaveNextTurn))

        val gameStateWithPlayers = gameStateRepository.findByIdOrNull(gameState.id)!!
        assertThat(gameStateWithPlayers.whichPlayersTurn())
            .isEqualTo(expectedPlayerToHaveNextTurn)
    }

    @Test
    fun `In turn phase, game skips players with no cards in hand` () {
        val gameState = gameStateRepository.save(GameState(phase = Phase.TURN))
        playerRepository.save(Player(gameState = gameState))
        val expectedPlayerToHaveNextTurn = playerRepository.save(Player(
            gameState = gameState,
            lastTurnCompletedTimestamp = OffsetDateTime.of(
                3010,
                1,
                1,
                0,
                0,
                0,
                0,
                ZoneOffset.UTC
            )
        ))
        cardRepository.save(Card(player = expectedPlayerToHaveNextTurn))

        val gameStateWithPlayers = gameStateRepository.findByIdOrNull(gameState.id)!!
        assertThat(gameStateWithPlayers.whichPlayersTurn())
            .isEqualTo(expectedPlayerToHaveNextTurn)
    }

    @Test
    fun `returns whose turn it is during TURN phase`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.TURN))
        val player = playerRepository.save(Player(gameState = gameState, nickName = "Bob"))
        cardRepository.save(Card(player = player))

        val mvcResult = mockMvc.perform(get("/api/state/turn/${gameState.id}"))
            .andExpect(status().isOk)
            .andReturn()

        val actualTurnResponse: TurnResponse = objectMapper.readValue(
            mvcResult.response.contentAsString,
            TurnResponse::class.java
        )
        assertThat(actualTurnResponse.playerId).isEqualTo(player.id)
        assertThat(actualTurnResponse.playerNickName).isEqualTo(player.nickName)
    }

    @Test
    fun `can get cards that have been played for a game`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.TURN))
        val player = playerRepository.save(Player(gameState = gameState, nickName = "Bob"))
        val cardOnTable = cardRepository.save(Card(player = player, cardStatus = CardStatus.ONTABLE))
        val cardOnDisplay = cardRepository.save(Card(player = player, cardStatus = CardStatus.ONDISPLAY))
        val cardInHand = cardRepository.save(Card(player = player, cardStatus = CardStatus.INHAND))

        val mvcResult = mockMvc.perform(get("/api/state/playedCards/${gameState.id}"))
            .andExpect(status().isOk)
            .andReturn()

        val playedCards: List<Card> = objectMapper.readValue(
            mvcResult.response.contentAsString,
            objectMapper.typeFactory.constructCollectionType(List::class.java, Card::class.java)
        )
        assertThat(playedCards).doesNotContain(cardInHand)
        assertThat(playedCards).containsExactlyInAnyOrder(cardOnDisplay, cardOnTable)
    }

    @Test
    fun `returns 400 if gameState doesn't exist when asking for a turn`() {
        mockMvc.perform(get("/api/state/turn/${UUID.randomUUID()}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `returns 400 if gameState doesn't exist when asking for played cards`() {
        mockMvc.perform(get("/api/state/playedCards/${UUID.randomUUID()}"))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `returns null if phase is not TURN when asking for turn`() {
        val gameState = gameStateRepository.save(GameState(phase = Phase.PREGAME))

        val mvcResult = mockMvc.perform(get("/api/state/turn/${gameState.id}"))
            .andExpect(status().isOk)
            .andReturn()

        val actualTurnResponse: TurnResponse = objectMapper.readValue(
            mvcResult.response.contentAsString,
            TurnResponse::class.java
        )
        assertThat(actualTurnResponse.playerId).isNull()
    }

    @Test
    fun `can not advance state of the game with unacceptable phase`() {
        val gameState = gameStateRepository.save(GameState())
        assertThat(gameState.phase).isEqualTo(Phase.PREGAME)

        val dummyGameStateAdvanceRequest = GameStateAdvanceRequest(
            id = UUID.randomUUID(),
            phaseString = "herpAderp"
        )

        mockMvc.perform(put("/api/state")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dummyGameStateAdvanceRequest)))
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `returns bad request when you try to update gamestate that does not exist`() {
        val dummyGameStateAdvanceRequest = GameStateAdvanceRequest(
            id = UUID.randomUUID(),
            phaseString = Phase.BETTING.toString()
        )

        mockMvc.perform(put("/api/state")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dummyGameStateAdvanceRequest)))
            .andExpect(status().isBadRequest)
    }

    private fun `get number of games created`(): Double {
        val count: Double = try {
            meterRegistry
                .get("rdfpoker.game.created")
                .counter()
                .count()
        } catch (ex: MeterNotFoundException) {
            0.0
        }
        return count
    }
}