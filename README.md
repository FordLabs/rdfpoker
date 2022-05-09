# RDFPoker
![Alt text](/Sample.png?raw=true "Please don't see me")
## Why?
During our in person D&Fs, we typically have a team gather together and do brainstorming sessions. Given some prompt, we write ideas on stickies and we do so without others being able to read our half-baked or eventually discarded ideas. In addition, we don't let the ideas of others bias us during the brainstorming session. After we've each had time to come up with our own ideas,  we share them one by one. We then dot vote things we like.

## Theme?
The poker theme is both fun, and surprisingly similar. Cards == Stickies, Chips == Dot Votes, Suits == Sub-prompt Categories (Post-MVP concept), Timer == Timer, Limiting Cards in Hand == Limiting Stickies to Share, etc.

## Required tools
RDFPoker uses Kotlin and requires JDK11 or later to run. RDFPoker uses Node/NPM for the UI, abstracted through a Gradle plugin, so no system Node or NPM installation is necessary.

Deploying the application to Cloud Foundry requires [cf-cli version 6](https://github.com/cloudfoundry/cli/wiki/V6-CLI-Installation-Guide).

## Running locally
Run the backend using the `local` Spring profile to use an H2 in-memory database.
- Example using Gradle bootRun task: `SPRING_PROFILES_ACTIVE=local ./gradlew api:bootRun`

You can run the frontend by running `./gradlew ui:npm_run_start` (or `npm run start` directly from the `/ui` folder if you would prefer to use your system `node`).

## Usage
The home page will allow you to create a game or join an existing game.
### Creating a game:
Choosing `Create New Game` from the home page will setup a game and make you the Dealer.
As the Dealer, you have the ability to set the rules and change the phase of the game from the settings page.
You can invite anyone to your game by providing them the game URL which can be accessed from the share button in the upper-right corner (it will be copied to your clipboard).
### Joining an existing game:
If you would like to join an existing game, you need to know the game id.

If you are joining this game for the first time, you can optionally provide a nickname so others can more easily identify you.
Then click `Join Game`.
Once you have entered, you can find your player id at the end of the browser's URL.

If you are attempting to rejoin a game, you'll need to enter both the game id and your previous player id.
Then click `Rejoin Game`.

### Playing
There are 5 phases of the game.
#### PREGAME
This is a pre-game lobby where players are waiting for all participants to arrive.
The dealer is able to set the rules of the game during this time.
#### PREPARATION
All rules and the discussion prompt have been set.
Players may now "draw" a card from the deck and enter in something they would like to share.
Note that no other player will be able to see the cards in your hand.
The rules limit the number of cards you can draw.
#### TURN
During this phase, players will get a chance to play their cards one at a time.
You'll know it's your turn when you see your name in the prompter (and you'll see a `+` appear on the cards in your hand).
Playing a card will move it to the table where everyone can see it.
Feel free to introduce your thought and have a discussion.
#### BETTING
Each player is provided with a certain number of chips.
During this phase, you can place a "bet" on any card that you support by clicking on it (similar to dot voting).
This will put your chip on that card for everyone to see.
Spend your chips wisely as you have a limited number and you cannot get them back.
#### POSTGAME
Everyone has made their bets.
Now it is time for all players to have a discussion about the cards with the most chips.

## Debugging Locally
Visiting `/debug` will provide you with an overview of all games and provides direct links to all player pages.

You can access any player page directly using the path `/{gamestate_id}/{player_id}`
