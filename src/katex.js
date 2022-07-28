import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

export default function KaTeX() {
  let deck;

  const katexOptions = {
    delimiters: [
			{left: '$$', right: '$$', display: true},
			{left: '$', right: '$', display: false},
    ],
  };

  return {
    id: 'katex',
    init: reveal => {
      deck = reveal;
      const renderMath = () => {
        renderMathInElement(reveal.getSlidesElement(), katexOptions);
        deck.layout();
      };
      deck.on('ready', renderMath.bind(this));
    },
  };
}
