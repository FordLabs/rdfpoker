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

import com.fasterxml.jackson.annotation.JsonBackReference
import com.fasterxml.jackson.annotation.JsonManagedReference
import com.ford.rdfpoker.card.Card
import com.ford.rdfpoker.configuration.AbstractJpaPersistable
import com.ford.rdfpoker.gamestate.GameState
import java.time.OffsetDateTime
import java.time.ZoneOffset
import javax.persistence.*

@Entity
class Player(
    var numChips: Int = 3,

    var nickName: String? = null,

    var isDealer: Boolean = false,

    var lastTurnCompletedTimestamp: OffsetDateTime =
        OffsetDateTime.now(ZoneOffset.UTC),

    @OneToMany(
        mappedBy = "player",
        fetch = FetchType.LAZY,
        cascade = [CascadeType.REMOVE, CascadeType.REFRESH],
        orphanRemoval = true
    )
    @JsonManagedReference
    val cards: Set<Card> = mutableSetOf(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    val gameState: GameState? = null
): AbstractJpaPersistable()
