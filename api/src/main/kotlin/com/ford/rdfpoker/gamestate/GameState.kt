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

import com.fasterxml.jackson.annotation.JsonManagedReference
import com.ford.rdfpoker.card.CardStatus
import com.ford.rdfpoker.configuration.AbstractJpaPersistable
import com.ford.rdfpoker.phase.Phase
import com.ford.rdfpoker.player.Player
import com.ford.rdfpoker.rules.Rules
import java.util.*
import javax.persistence.*

@Entity
class GameState(
    override val id: UUID = UUID.randomUUID(),

    @Enumerated(EnumType.STRING)
    var phase: Phase = Phase.PREGAME,

    @OneToMany(
        mappedBy = "gameState",
        fetch = FetchType.LAZY,
        cascade = [CascadeType.REMOVE, CascadeType.REFRESH],
        orphanRemoval = true
    )
    @JsonManagedReference
    val players: Set<Player> = mutableSetOf(),

    @OneToOne(mappedBy = "gameState", fetch = FetchType.LAZY, orphanRemoval=true)
    @JsonManagedReference
    val rules: Rules? = null
): AbstractJpaPersistable(id) {

    @Transient
    fun whichPlayersTurn(): Player? {
        val playersWithCardsInHand = players.filter { player ->
            val cardsInHand = player.cards.filter { it.cardStatus == CardStatus.INHAND }
            cardsInHand.isNotEmpty()
        }
        return playersWithCardsInHand.minByOrNull(Player::lastTurnCompletedTimestamp)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        if (!super.equals(other)) return false

        other as GameState

        if (phase != other.phase) return false
        if (players != other.players) return false
        if (rules != other.rules) return false

        return true
    }

    override fun hashCode(): Int {
        var result = super.hashCode()
        result = 31 * result + phase.hashCode()
        result = 31 * result + players.hashCode()
        result = 31 * result + (rules?.hashCode() ?: 0)
        return result
    }
}