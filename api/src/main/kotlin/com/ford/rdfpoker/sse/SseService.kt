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

import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.*

@Service
class SseService {
    private val emittersForAllGames: EmittersForAllGames = mutableMapOf()

    fun sendNotificationToClients(gameStateId: UUID, eventData: Any, eventType: SseNotificationType) {
        emittersForAllGames[gameStateId]?.let {
            val deadEmitters: MutableList<SseEmitter> = mutableListOf()
            it.forEach { emitter ->
                try {
                    val event = SseEmitter.event()
                        .data(eventData)
                        .name(eventType.name)
                    emitter.send(event)
                } catch (e: Exception) {
                    emitter.complete()
                    deadEmitters.add(emitter)
                }
            }

            it.removeAll(deadEmitters)
        }
    }

    fun registerClient(
        gameStateId: UUID
    ): SseEmitter {
        val emitter = SseEmitter()
        val emittersList: EmittersList = addToEmittersList(gameStateId, emitter)

        emitter.onCompletion { emittersList.remove(emitter) }

        emitter.onTimeout {
            emitter.complete()
            emittersList.remove(emitter)
        }

        emitter.onError { emittersList.remove(emitter) }

        return emitter
    }

    private fun addToEmittersList(gameStateId: UUID, emitter: SseEmitter): EmittersList {
        var emittersList: EmittersList? = emittersForAllGames[gameStateId]
        if (emittersList != null) {
            emittersList.add(emitter)
        } else {
            emittersList = EmittersList()
            emittersList.add(emitter)
            emittersForAllGames[gameStateId] = emittersList
        }
        return emittersList
    }
}