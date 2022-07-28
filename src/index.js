import Reveal from 'reveal.js/dist/reveal.esm';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm';

import KaTeX from './katex';
import GeneratingDiagramPlugin from './generating';
import MCMCDiagramPlugin from './mcmc';
import './index.scss';


Reveal.initialize({
  controls: false,
  progress: true,
  hash: true,
  generatingDiagram: {
    parentElm: document.getElementById('generating-diagram'),
  },
  mcmcDiagram: {
    parentElm: document.getElementById('mcmc-diagram'),
  },
  plugins: [RevealMarkdown, KaTeX, GeneratingDiagramPlugin, MCMCDiagramPlugin]
});


window.Reveal = Reveal;
