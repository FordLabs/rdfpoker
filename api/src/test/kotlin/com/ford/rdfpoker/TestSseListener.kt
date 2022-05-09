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

package com.ford.rdfpoker

import com.here.oksse.OkSse
import com.here.oksse.ServerSentEvent
import okhttp3.Request
import okhttp3.Response

fun getTestSseClient(url: String, listener: TestSseListener): ServerSentEvent {
    val request: Request = Request.Builder()
        .url(url)
        .build()
    val okSse = OkSse()
    return okSse.newServerSentEvent(request, listener)
}

class TestSseListener : ServerSentEvent.Listener {
    val messagesReceived: MutableList<Pair<String?, String?>> = mutableListOf()

    override fun onMessage(
        sse: ServerSentEvent?,
        id: String?,
        event: String?,
        message: String?
    ) {
        messagesReceived += Pair(event, message)
    }

    override fun onOpen(sse: ServerSentEvent?, response: Response?) { }
    override fun onComment(sse: ServerSentEvent?, comment: String?) { }
    override fun onRetryTime(sse: ServerSentEvent?, milliseconds: Long): Boolean = true
    override fun onRetryError(
        sse: ServerSentEvent?,
        throwable: Throwable?,
        response: Response?
    ): Boolean = true
    override fun onClosed(sse: ServerSentEvent?) { }
    override fun onPreRetry(sse: ServerSentEvent?, originalRequest: Request?): Request = originalRequest!!
}