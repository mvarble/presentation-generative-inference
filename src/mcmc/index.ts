import * as d3 from 'd3';

import { container, proposal, accepted, rejected } from './index.module.css';

/**
 * establish some constants we will use
 */

// error message
const NO_PARENT_MESSAGE = 'MCMCDiagram: `parentElm` is not in deck';

// sample data
interface Proposal {
  x: number;
  y: number;
  accept: boolean;
}

interface ChainLink {
  x: number;
  y: number;
  amount?: number;
}

const PROPOSALS: Proposal[] = [
  { x: 0, y: 0, accept: true },
  { x: 3.0, y: 2.1, accept: true },
  { x: 3.1, y: 2.5, accept: true },
  { x: 7.1, y: 1.0, accept: false },
  { x: 2.1, y: 2.1, accept: true },
  { x: 2.08, y: 1.1, accept: true },
  { x: 2.12, y: -1.1, accept: true },
  { x: 1.8, y: -1.3, accept: true },
  { x: -0.5, y: -1.8, accept: false },
  { x: 0.7, y: -2.3, accept: true },
  { x: 4.0, y: -2.3, accept: true },
  { x: 4.0 + 3 * Math.cos(0.5), y: -2.3 + 3 * Math.sin(0.5), accept: false },
  { x: 4.0 + 3.1 * Math.cos(1.5), y: -2.3 + 3.1 * Math.sin(1.5), accept: false },
  { x: 4.0 + 3.9 * Math.cos(3.5), y: -2.3 + 3.9 * Math.sin(3.5), accept: false },
  { x: 4.0 + 3.8 * Math.cos(2.3), y: -2.3 + 3.8 * Math.sin(2.3), accept: false },
  { x: 4.0 + 3.2 * Math.cos(6.9), y: -2.3 + 3.2 * Math.sin(6.9), accept: false },
  { x: 4.0 + 3.2 * Math.cos(8.1), y: -2.3 + 3.2 * Math.sin(8.1), accept: false },
  { x: 4.0 + 3.2 * Math.cos(9.9), y: -2.3 + 3.2 * Math.sin(9.9), accept: false },
  { x: 4.0 + 3.2 * Math.cos(123.9), y: -2.3 + 3.2 * Math.sin(123.9), accept: false },
  { x: 4.0 + 3.2 * Math.cos(128.8), y: -2.3 + 3.2 * Math.sin(128.8), accept: false },
  { x: 4.0 + 3.2 * Math.cos(32.1), y: -2.3 + 3.2 * Math.sin(32.1), accept: false },
  { x: 4.0 + 3.2 * Math.cos(67.8), y: -2.3 + 3.2 * Math.sin(67.8), accept: false },
  { x: 4.0 + 3.2 * Math.cos(61.29), y: -2.3 + 3.2 * Math.sin(61.29), accept: false },
];

// viewport data
const HEIGHT = 200;
const XYRATIO = 1.8;
const WIDTH = HEIGHT * XYRATIO;
const XSCALE = d3.scaleLinear()
  .domain([-10, 10])
  .range([0, WIDTH]);
const YSCALE = d3.scaleLinear()
  .domain([-10, 10])
  .range([HEIGHT, 0]);

/**
 * Configuration of the MCMCDiagram component
 */
interface MCMCDiagramConfig {
  parentElm: HTMLElement,
  startStage: number,
}


/**
 * turn proposal data into chain data
 */
function getChain(proposals: Proposal[], preRejection: boolean): ChainLink[] {
  const chain: ChainLink[] = [];
  proposals.forEach(({ x, y, accept }, i) => {
    if (preRejection && i == proposals.length - 1) {
      chain.push({ x, y });
    } else if (i === 0) {
      chain.push({ x, y, amount: 1 });
    } else if (accept) {
      chain.push({ x, y, amount: 1 });
    } else {
      chain.slice(0).reverse().find(p => p.amount).amount++;
      chain.push({ x, y, amount: 0 });
    }
  });
  return chain;
}

enum State {
  Pending,
  Accepted,
  Rejected,
}

function chainLinkState({ amount }: ChainLink): State {
  return (
    typeof amount == 'number'
    ? (amount ? State.Accepted : State.Rejected)
    : State.Pending
  );
}

function chainLinkColor(chainLink: ChainLink): string {
  switch (chainLinkState(chainLink)) {
    case State.Pending: return 'lightskyblue';
    case State.Accepted: return 'lightgreen';
    case State.Rejected: return 'pink';
  }
}

/**
 * This class will create d3 animations for the `mcmc` slide of the presentation.
 */
class MCMCDiagram {

  stage: number;
  svgSel: d3.Selection<SVGSVGElement, ChainLink[], null, null>;

  constructor({ parentElm, startStage }: MCMCDiagramConfig) {
    // we necessarily need a parent element for the diagram to work
    if (!parentElm) throw new Error(NO_PARENT_MESSAGE);

    // create the container element and append it to the parent
    const containerSel = d3.create('div').attr('class', container);
    this.svgSel = containerSel.append('svg').attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
    parentElm.appendChild(containerSel.node());

    // start the diagram at the specified stage
    this.setStage(startStage);
  }

  setStage(stage: number) {
    // perform updates only if stage changed
    if (stage === this.stage) return;
    this.stage = stage;

    // get the chain data
    const chainLength = Math.ceil(stage / 2);
    const preRejection = stage % 2 == 1;
    const chain = getChain(PROPOSALS.slice(0, chainLength), preRejection);

    // enter/update the d3 guys
    this.svgSel
      .selectAll('circle')
      .data(chain)
      .join(
        enter => (
          enter
          .append('circle')
          .attr('fill', chainLinkColor)
          .attr('fill-opacity', 0.5)
          .attr('stroke', chainLinkColor)
          .attr('stroke-width', 1)
          .attr('cx', d => XSCALE(d.x))
          .attr('cy', d => YSCALE(d.y))
          .attr('r', d => 5 * (d.amount || 1))
        ),
        update => (
          update
          .transition()
          .duration(250)
          .attr('fill', chainLinkColor)
          .attr('stroke', chainLinkColor)
          .attr('r', d => 5 * (d.amount || 1))
        )
      )

    // use d3 to animate between stages
    this.svgSel
  }

  static get LAST_STAGE() {
    return 2 * PROPOSALS.length;
  }

}

interface Reveal {
  on: (event: string, cb: (args: any[]) => void) => void,
  getCurrentSlide: () => HTMLElement,
  getConfig: () => { mcmcDiagram: Partial<MCMCDiagramConfig> },
  getState: () => { indexh: number, indexv: number, indexf: number },
  getSlides: () => HTMLElement[],
}

/**
 * This Reveal.js plugin will interface our class events with slide changes.
 */
function MCMCDiagramPlugin() {
  let deck: Reveal | undefined;
  let parentElm: HTMLElement | undefined;
  let diagram: MCMCDiagram | undefined;

  return {
    id: 'mcmcDiagram',
    init: (reveal: Reveal) => {
      // when the deck is ready, we will append the GeneratingDiagram
      deck = reveal;
      deck.on('ready', (_) => {
        // ensure that there is a parent element in the configuration
        const mcmcDiagramConfig = deck.getConfig().mcmcDiagram;
        parentElm = mcmcDiagramConfig.parentElm;
        if (!parentElm) throw new Error(NO_PARENT_MESSAGE);

        // establish the slide in which the parent resides (ASSUMES HORIZONTAL)
        const slideNum = deck.getSlides().findIndex(slide => slide.contains(parentElm));
        if (slideNum === -1) throw new Error(NO_PARENT_MESSAGE);

        // establish the current stage of the animation
        const getStage = ({ indexh, indexf }) => {
          if (indexh < slideNum) return 2;
          if (indexh > slideNum) return MCMCDiagram.LAST_STAGE;
          return Math.max(2, Math.min(indexf+3, MCMCDiagram.LAST_STAGE));
        };
        const startStage = getStage(deck.getState());

        // start the GeneratingDiagram component
        diagram = new MCMCDiagram({ 
          ...mcmcDiagramConfig, 
          parentElm,
          startStage,
        });

        // interface the Reveal.js events with the diagram
        const fragmentCallback = () => diagram.setStage(getStage(deck.getState()));
        deck.on('fragmentshown', fragmentCallback);
        deck.on('fragmenthidden', fragmentCallback);
      });
    },
  };
}


export default MCMCDiagramPlugin;
