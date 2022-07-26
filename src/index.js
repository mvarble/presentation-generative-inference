import Reveal from 'reveal.js/dist/reveal.esm';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

import './index.scss';

function KaTeX() {
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

Reveal.initialize({
  controls: false,
  progress: true,
  hash: true,
  plugins: [RevealMarkdown, KaTeX]
});


window.Reveal = Reveal;
