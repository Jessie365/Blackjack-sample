let game;

/* Define some options:
   cardSheetWidth cardSheetHeight - the size of one card in the cards sprite
   dealerCards - coordinates for the 3 dealer cards and scale factor
   playerCards - coordinates for the 2 player cards and scale factor
 */
let gameOptions = {
  cardSheetWidth: 334,
  cardSheetHeight: 440,
  dealerCards : { xCords: [50, 200, 350], yCord: 100, scale: 0.3 },
  playerCards : { xCords: [100, 250], yCord: 350, scale: 0.4 },
};

// boolean flag for the button - allowed to click it when the second player card is drawn
let buttonAllowed = false;

// cardBack - holding reference to the sprite for the back of the deck
// used later for removing it when the deck is finished
let cardBack;

window.onload = function() {
  // Creating an instance of a Phaser.Game object with 800px by 600px Canvas size
  // parameter Phaser.AUTO automatically tries to use WebGL
  // but if the browser or device doesn't support it - fall back to Canvas
  game = new Phaser.Game(800, 600, Phaser.AUTO, '', {preload: preload, create: create, update: update});
};

// Load the assets we need for our game
function preload() {
  game.load.image('table', './assets/images/table.jpg');
  game.load.image('card-back', './assets/images/cardBack.png', gameOptions.cardSheetWidth,
    gameOptions.cardSheetHeight);
  game.load.spritesheet('suit-S', './assets/images/suit-S.png', gameOptions.cardSheetWidth,
    gameOptions.cardSheetHeight);
  game.load.spritesheet('suit-H', './assets/images/suit-H.png', gameOptions.cardSheetWidth,
    gameOptions.cardSheetHeight);
  game.load.spritesheet('suit-D', './assets/images/suit-D.png', gameOptions.cardSheetWidth,
    gameOptions.cardSheetHeight);
  game.load.spritesheet('suit-C', './assets/images/suit-C.png', gameOptions.cardSheetWidth,
    gameOptions.cardSheetHeight);

  game.load.spritesheet('button', './assets/buttons/hit_button.png', 400, 122);
  game.load.bitmapFont('carrier_command', './assets/fonts/carrier_command.png',
    './assets/fonts/carrier_command.xml');

}

// Building the game scene
function create() {
  // Load the background image
  game.add.sprite(0, 0, 'table');
  // Load text with bitmap font
  game.add.bitmapText(70, 20, 'carrier_command', 'Blackjack', 34);
  // Load the image with the back of the deck and scale it
  cardBack = game.add.sprite(600, 50, 'card-back');
  cardBack.scale.set(0.3);
  // Load the Hit Button image
  button = game.add.button(450, 475, 'button', null, this, 1, 0, 0);
  // Add a function called actionOnClick to be called when the button is pressed
  button.onInputDown.add(actionOnClick, this);
  button.scale.set(0.4);

  // cardsAPI is a helper closure defined in cardDeck.js file
  // generate 1 deck of 52 standard cards and shuffle them
  cardsAPI.generateDecks(1);

  // Define Phaser group object to hold the dealer cards - used with the animations (tweens)
  dealerCards = game.add.group();
  dealerCards.groupName = "dealerCards";
  // define phaser group object to hold the player cards - used with the animations (tweens)
  playerCards = game.add.group();
  playerCards.groupName = "playerCards";

  // Holds the current index for the card group
  let currentCardIndex = 0;

  // Begin to draw the first dealer card
  // function drawAndMoveCard is used with parameter holding the group of cards to be draw
  // and the card currentIndex for the group
  drawAndMoveCard(dealerCards, currentCardIndex);
}

// Draw a card from the deck and move it to its position, showing the back of the card
function drawAndMoveCard(group, currentCardIndex) {
  // stop drawing cards when the deck is empty
  if (cardsAPI.isEmpty()) {
    return;
  }
  // remove the deck image when we draw the last card
  if (cardsAPI.cardsLeft() == 1)
  {
    cardBack.destroy();
  }
  // loads new sprite with image of the back and adds it to the group (dealer or player)
  let card = game.add.sprite(600, 50, 'card-back');
  card.scale.set(0.3);
  group.add(card);
  // create animation (tween) moving the card to its fixed position (x and y coordinates) - defined in the gameOptions
  // the last param (true) triggers the tween to start
  moveTween = game.add.tween(group.children[currentCardIndex])
    .to({ x : gameOptions[group.groupName].xCords[currentCardIndex], y: gameOptions[group.groupName].yCord },
      400, Phaser.Easing.Linear.None, true);
  // Call function flipCard when the tween completes
  // using anonymous function in order to call the flipCard function with parameters
  moveTween.onComplete.add(function () { flipCard(group, currentCardIndex) }, this);
}

// Hide the back of the card by scaling it in x orientation to 0
function flipCard(group, currentCardIndex) {
  tweenCard = game.add.tween(group.children[currentCardIndex].scale).to( { x: 0 }, 200, Phaser.Easing.Linear.None, true);
  // Call function loadCard when the tween completes
  // using anonymous function in order to call the loadCard function with parameters
  tweenCard.onComplete.add(function () { loadCard(group, currentCardIndex) }, this);
}

// Draw the next card from the deck; load its texture and frame number from the sprite
// and show the card with animation (tween) - scaling it back to a scale factor, defined in the gameOptions
function loadCard(group, currentCardIndex) {
  let drawnCard = cardsAPI.drawNextCard();
  group.children[currentCardIndex].loadTexture('suit-' + drawnCard.suit);
  group.children[currentCardIndex].frame = getCardFrame(drawnCard);

  let secondTween = game.add.tween(group.children[currentCardIndex].scale)
    .to( { x: gameOptions[group.groupName].scale, y: gameOptions[group.groupName].scale },
      300, Phaser.Easing.Linear.None, true);
  // if the loaded card is from the players cads - attach a function removeCard to be called when clicked
  if (group == playerCards) {
    group.children[currentCardIndex].inputEnabled = true;
    group.children[currentCardIndex].input.useHandCursor = true;
    group.children[currentCardIndex].events.onInputDown.add(removeCard, this);
  }
  // we have finished with the current card so we increment the index
  currentCardIndex++;

  // check if we have drawn 3 cards for the dealer
  if (group == dealerCards && currentCardIndex == 3)
  {
    // if yes, switch the group to the playerCards group and set it Index to 0
    group = playerCards;
    currentCardIndex = 0;
  }

  //check if we have drawn 2 cards for the player
  if (group == playerCards && currentCardIndex == 2) {
    // allow to click the button after the tween completes
    secondTween.onComplete.add(() => { buttonAllowed = true; }, this);
    return;
  }
  // Continue to draw cards after the tween completes
  secondTween.onComplete.add(function () { drawAndMoveCard(group, currentCardIndex) }, this);
}

// Remove card with animation
function removeCard(card) {
  if (buttonAllowed || cardsAPI.isEmpty())
  {
    let tween = game.add.tween(card).to({ x : -300 }, 250, Phaser.Easing.Linear.None, true);
    tween.onComplete.add(function () { playerCards.remove(card); card.destroy(); }, this);
  }
}

// Removes the 2 player cards by moving them out of the scene with tween
// After that calls drawAndMoveCard function again
function actionOnClick ()
{
  if (buttonAllowed) {
    // If both player cards were removed by clicking on them draw new cards
    if (playerCards.total == 0) {
      drawAndMoveCard(playerCards, 0);
      buttonAllowed = false;
      return;
    }
    for (let childIndex = playerCards.total - 1; childIndex >= 0; childIndex--) {
      let card = playerCards.children[childIndex];
      let tween = game.add.tween(card).to({ x : -300 }, 250, Phaser.Easing.Linear.None, true);
      tween.onComplete.add(function () { playerCards.remove(card); card.destroy(); }, this);
    }
    // Draw a new card after 300 milliseconds (shortly after moving the cards out of the scene)
    game.time.events.add(300, () => { drawAndMoveCard(playerCards, 0); }, this);
    buttonAllowed = false;
  }
}

function update() {

}

// Helper function to get the frame number of the card
function getCardFrame(card) {
  if (card.rank == 'A') {
    return 0;
  }
  else if (card.rank == 'J') {
    return 10;
  }
  else if (card.rank == 'Q') {
    return 11;
  }
  else if (card.rank == 'K') {
    return 12;
  }
  else {
    return Number(card.rank) - 1;
  }
}