import * as d3 from 'd3';

import { container, proposal, accepted, rejected } from './index.module.css';

/**
 * establish some constants we will use
 */

// error message
const NO_PARENT_MESSAGE = 'MCMCDiagram: `parentElm` is not in deck';

// sample data
const REAL_PROPOSALS = require('./chain.json');
const FAKE_PROPOSALS = [
  { x: 1.1, y: 4, accept: true },
  ...Array.from({ length: 20 }).map(() => {
    const r = Math.random()
    const theta = 2 * Math.PI * Math.random()
    return { x: 1.1 + r * Math.cos(theta), y: 4 + r * Math.sin(theta), accept: false };
  })
];
const PROPOSALS = [...REAL_PROPOSALS, ...FAKE_PROPOSALS];
const SKIP_SPOT = 25;

// viewport data
const HEIGHT = 200;
const XYRATIO = 1.8;
const WIDTH = HEIGHT * XYRATIO;
const XSCALE = d3.scaleLinear()
  .domain([-4, 4])
  .range([0, WIDTH]);
const YSCALE = d3.scaleLinear()
  .domain([-4, 4])
  .range([HEIGHT, 100]);

/**
 * helper functions for interpretting chain/proposals
 */
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
      getLastSuccess(chain).amount++;
      chain.push({ x, y, amount: 0 });
    }
  });
  return chain;
}

function getMaxAmount(chain: ChainLink[]): number {
  return chain.reduce((M, chainLink) => Math.max(M, chainLink.amount || 0), -Infinity);
}

function getLastSuccess(chain: ChainLink[]): ChainLink {
  return chain.slice(0).reverse().find(p => p.amount);
}

function chainLinkColor(maxAmount: number): (chainLink: ChainLink) => string {
  // @ts-ignore
  return (chainLink) => (
    typeof chainLink.amount === 'number'
    ? (
      d3.scaleLinear()
      .domain([0, maxAmount])
      // @ts-ignore
      .range([d3.color('purple'), d3.color('yellow')])
      (chainLink.amount)
    )
    : d3.color('white')
  );
}

function chainLinkOpacity(maxAmount: number): (chainLink: ChainLink) => number {
  return (chainLink) => (
    typeof chainLink.amount === 'number'
    ? chainLink.amount / maxAmount
    : 0.5
  );
}

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
/**
 * This class will create d3 animations for the `mcmc` slide of the presentation.
 */
class MCMCDiagram {

  stage: number;
  parentElm: HTMLElement;
  svgSel: d3.Selection<SVGSVGElement, ChainLink[], null, null>;

  constructor({ parentElm, startStage }: MCMCDiagramConfig) {
    // we necessarily need a parent element for the diagram to work
    if (!parentElm) throw new Error(NO_PARENT_MESSAGE);
    this.parentElm = parentElm;

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


    if (this.stage === 1) this.showAlgorithm();
    else this.showDiagram();
  }

  showAlgorithm() {
    // grow the font size of the algorithm
    d3.select(this.parentElm)
      .transition()
      .duration(500)
      .style('font-size', '26px');

    // remove the chain
    this.svgSel
      .selectAll('circle')
      .data([])
      .exit()
      .transition()
      .duration(500)
      .attr('r', 0)
      .remove();
  }

  showDiagram() {
    // shrink the font size of the algorithm
    d3.select(this.parentElm)
      .transition()
      .duration(500)
      .style('font-size', '18px');

    // get the chain data
    const chainLength = Math.ceil(this.stage / 2);
    const preRejection = this.stage % 2 == 1;
    const chain = getChain(PROPOSALS.slice(0, chainLength), preRejection);

    // get the chain metadata
    const maxAmount = getMaxAmount(chain);
    const color = chainLinkColor(maxAmount);
    const opacity = chainLinkOpacity(maxAmount);
    const lastSuccess = getLastSuccess(chain);
    const strokeWidth = (chainLink: ChainLink) => chainLink.amount === 0 ? 0.1 : 1;
    const endX = (chainLink: ChainLink) => XSCALE(chainLink.x);
    const endY = (chainLink: ChainLink) => YSCALE(chainLink.y);
    const startX = (chainLink: ChainLink, index: number) => (
      index > 0 ? XSCALE(lastSuccess.x) : endX(chainLink)
    );
    const startY = (chainLink: ChainLink, index: number) => (
      index > 0 ? YSCALE(lastSuccess.y) : endY(chainLink)
    );

    // enter/update the dom components associated with the chain
    this.svgSel
      .selectAll('circle')
      .data(chain)
      .join(
        enter => (
          enter
          .append('circle')
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', strokeWidth)
          .attr('cx', startX)
          .attr('cy', startY)
          .attr('r', 0)
          .transition()
          .duration(500)
          .attr('cx', endX)
          .attr('cy', endY)
          .attr('r', 5)
        ),
        update => (
          update
          .transition()
          .duration(250)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', color)
          .attr('stroke-width', strokeWidth)
          .attr('cx', endX)
          .attr('cy', endY)
          .attr('r', 5)
        ),
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
          if (indexh < slideNum) return 1;
          if (indexh > slideNum) return MCMCDiagram.LAST_STAGE;
          const preSkipStage = Math.max(1, Math.min(indexf+2, MCMCDiagram.LAST_STAGE));
          if (preSkipStage < SKIP_SPOT) {
            return preSkipStage;
          } else {
            return 2 * REAL_PROPOSALS.length + (preSkipStage - SKIP_SPOT);
          }
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
