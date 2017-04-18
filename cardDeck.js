let cardsAPI = (function () {

  // Create an empty array of cards.
  this.cards = new Array();

  function Card(rank, suit) {
    this.rank = rank;
    this.suit = suit;
  }

  function generateDecks(n) {
    let ranks = new Array("A", "2", "3", "4", "5", "6", "7", "8", "9",
      "10", "J", "Q", "K");
    let suits = new Array("C", "D", "H", "S");
    let i, j, k;
    let m;

    m = ranks.length * suits.length;

    // Set array of cards.
    cards = new Array(n * m);

    // Fill the array with 'n' packs of cards.
    for (i = 0; i < n; i++)
      for (j = 0; j < suits.length; j++)
        for (k = 0; k < ranks.length; k++)
          cards[i * m + j * ranks.length + k] =
            new Card(ranks[k], suits[j]);
  }

  function stackShuffle(n) {
    let i, j, k;
    let temp;

    // Shuffle the stack 'n' times.
    for (i = 0; i < n; i++)
      for (j = 0; j < cards.length; j++) {
        k = Math.floor(Math.random() * cards.length);
        temp = cards[j];
        cards[j] = cards[k];
        cards[k] = temp;
      }
  }

  function stackDeal() {
    if (cards.length > 0)
      return cards.shift();
    else
      return null;
  }

  return {
    generateDecks: function (n) {
      generateDecks(n);
      stackShuffle(n);
    },
    drawNextCard: stackDeal,
    isEmpty: () => { return cards.length == 0 },
    cardsLeft: () => { return cards.length }
  }
}());