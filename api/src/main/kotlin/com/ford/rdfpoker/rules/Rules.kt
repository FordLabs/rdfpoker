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

import com.fasterxml.jackson.annotation.JsonBackReference
import com.ford.rdfpoker.configuration.AbstractJpaPersistable
import com.ford.rdfpoker.gamestate.GameState
import java.util.*
import javax.persistence.Entity
import javax.persistence.FetchType
import javax.persistence.OneToOne
import javax.validation.constraints.Max
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Positive

@Entity
class Rules(
    override val id: UUID = UUID.randomUUID(),

    @field:NotBlank
    var prompt: String = "Sweet, thought-provoking prompt",

    @field:Positive
    @field:Max(value = 6)
    var maxCardsInHand: Int = 5,

    @field:Positive
    @field:Max(value = 5)
    var chipsAllottedPerPlayer: Int = 3,

    @field:Positive
    var preparationTimerDuration: Int = 5,

    @field:Positive
    var turnTimerDuration: Int = 1,

    @field:Positive
    var bettingTimerDuration: Int = 1,

    @field:Positive
    var minChipsForCardPostGameDiscussion: Int = 1,

    @field:Positive
    var minCardContribution: Int = 1,

    @OneToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    val gameState: GameState? = null
): AbstractJpaPersistable()
