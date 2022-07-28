import Reveal from 'reveal.js/dist/reveal.esm';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm';

import KaTeX from './katex';
import GeneratingDiagramPlugin from './generating';
import './index.scss';


Reveal.initialize({
  controls: false,
  progress: true,
  hash: true,
  generatingDiagram: {
    parentElm: document.getElementById('generating-diagram'),
  },
  plugins: [RevealMarkdown, KaTeX, GeneratingDiagramPlugin]
});


window.Reveal = Reveal;
