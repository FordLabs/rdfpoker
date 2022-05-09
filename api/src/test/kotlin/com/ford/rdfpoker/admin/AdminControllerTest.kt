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

package com.ford.rdfpoker.admin

import com.fasterxml.jackson.databind.ObjectMapper
import com.ford.rdfpoker.gamestate.GameState
import com.ford.rdfpoker.gamestate.GameStateRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private lateinit var gameStateRepository: GameStateRepository

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var mockMvc: MockMvc

    @AfterEach
    fun tearDown() {
        gameStateRepository.deleteAllInBatch()
    }

    @Test
    fun `can get all games`() {
        val gameState1 = gameStateRepository.save(GameState())
        val gameState2 = gameStateRepository.save(GameState())

        val mvcResult = mockMvc.perform(get("/api/admin/states"))
            .andExpect(status().isOk)
            .andReturn()

        val gameStates: List<GameState> = objectMapper.readValue(
            mvcResult.response.contentAsString,
            objectMapper.typeFactory.constructCollectionType(List::class.java, GameState::class.java)
        )
        assertThat(gameStates).containsExactly(gameState1, gameState2)
    }
}