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

import com.ford.rdfpoker.rules.requests.RulesUpdateRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping(value = ["/api/rules"])
class RulesController(private val rulesService: RulesService) {

    @PutMapping
    fun updateRules(@RequestBody rulesUpdateRequest: RulesUpdateRequest): ResponseEntity<Rules> {
        val updatedRules = rulesService.updateRules(rulesUpdateRequest)
        return ResponseEntity.ok(updatedRules)
    }

    @GetMapping("/{gameStateId}")
    fun getRules(@PathVariable gameStateId: UUID): ResponseEntity<Rules> {
        val rules = rulesService.getRules(gameStateId)
        return ResponseEntity.ok(rules)
    }
}