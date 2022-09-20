import React from 'react';
import * as d3 from 'd3';

import { useDeck, SlideState, DeckState } from '@presentations';
import { Theme } from '@utils/themes';
import { colorsByTheme } from '@utils/colors';
import useTheme from '@hooks/use-theme';
import REAL_PROPOSALS from './chain.json';

/**
 * establish some constants we will use
 */

// error message
const NO_PARENT_MESSAGE = 'MCMCDiagram: `parentElm` is not in deck';

// sample data
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
      // @ts-ignore
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
  // @ts-ignore
  return chain.slice(0).reverse().find(p => p.amount);
}

function chainLinkColor(maxAmount: number, theme: Theme): (chainLink: ChainLink) => string {
  const colors = colorsByTheme(theme);

  // @ts-ignore
  return (chainLink) => (
    typeof chainLink.amount === 'number'
    ? (
      d3.scaleLinear()
      .domain([0, maxAmount])
      // @ts-ignore
      .range([d3.color(colors.purple), d3.color(colors.yellow)])
      (chainLink.amount)
    )
    : d3.color(colors.text)
  );
}

/**
 * Configuration of the MCMCDiagram component
 */
interface MCMCDiagramConfig {
  theme: Theme,
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
  stage: number | undefined;
  parentElm: HTMLElement;
  svgSel: d3.Selection<SVGSVGElement, ChainLink[], null, undefined>;
  theme: Theme | undefined;

  constructor({ parentElm, startStage, theme }: MCMCDiagramConfig) {
    // we necessarily need a parent element for the diagram to work
    if (!parentElm) throw new Error(NO_PARENT_MESSAGE);
    this.parentElm = parentElm;

    // create the container element and append it to the parent
    const containerSel = d3.create('div')
      .attr('class', 'absolute w-full h-full flex')
      .attr('style', 'top: 0; left: 0;')

    // @ts-ignore
    this.svgSel = containerSel
      .append('svg')
      .attr('class', 'w-full chart')
      .style('z-index', '-1')
      .style('position', 'absolute')
      .style('bottom', '0')
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
    this.svgSel.append('g').attr('class', 'shift').attr('transform', 'translate(-50, -10)');

    parentElm.appendChild(containerSel.node() as Node);

    // start the diagram at the specified stage
    this.setStage(startStage, theme);
  }

  setStage(stage: number, theme: Theme) {
    // perform updates only if stage changed
    if (stage === this.stage && theme === this.theme) return;
    this.stage = stage;
    this.theme = theme;


    if (this.stage === 1) this.showAlgorithm();
    else this.showDiagram();
  }

  showAlgorithm() {
    if (typeof this.stage === 'undefined') return;

    // grow the font size of the algorithm
    d3.select(this.parentElm.firstChild)
      .transition()
      .duration(500)
      .style('font-size', '30px')
      .style('height', '580px');

    // remove the chain
    this.svgSel
      .select('.shift')
      .selectAll('circle')
      .data([])
      .exit()
      .transition()
      .duration(500)
      .attr('r', 0)
      .remove();
  }

  showDiagram() {
    if (typeof this.stage === 'undefined' || typeof this.theme === 'undefined') return;

    // shrink the font size of the algorithm
    d3.select(this.parentElm.firstChild)
      .transition()
      .duration(500)
      .style('font-size', '16px')
      .style('height', '230px');

    // get the chain data
    const chainLength = Math.ceil(this.stage / 2);
    const preRejection = this.stage % 2 == 1;
    const chain = getChain(PROPOSALS.slice(0, chainLength), preRejection);

    // get the chain metadata
    const maxAmount = getMaxAmount(chain);
    const color = chainLinkColor(maxAmount, this.theme);
    const opacity = (chainLink: ChainLink) => (
      (typeof chainLink.amount === 'number' && chainLink.amount === 0)
      ? 0.0
      : 0.5
    );
    const lastSuccess = getLastSuccess(chain);
    const strokeWidth = (chainLink: ChainLink) => (
      typeof chainLink.amount === 'number'
      ? (chainLink.amount === 0 ? 0.33 : 1.0)
      : 0.5
    );
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
      .select('.shift')
      .selectAll('circle')
      .data(chain)
      .join(
        // @ts-ignore
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

/**
 * This React component will interface our diagram
 */
function MCMCDiagramManager(
  { children, ...props }: React.PropsWithChildren<object>
) {
  // slideIndex
  const slideIndex = 11;

  // get a ref for the element
  const domRef = React.useRef(null);

  // get a ref for our diagram object
  const diagramRef = React.useRef<MCMCDiagram>(null);

  // create a map of the stages
  const map = React.useMemo(() => (slideState: SlideState) => {
    if (!slideState) return 0;
    else {
      const { indexh, indexf } = slideState;
      if (indexh < slideIndex) return 1;
      if (indexh > slideIndex) return MCMCDiagram.LAST_STAGE;
      const preSkipStage = Math.max(1, Math.min(indexf + 2, MCMCDiagram.LAST_STAGE));
      if (preSkipStage < SKIP_SPOT) {
        return preSkipStage;
      } else {
        return 2 * REAL_PROPOSALS.length + (preSkipStage - SKIP_SPOT);
      }
    }
  }, [slideIndex]);

  // parse the deck state
  const slideState = useDeck((deck: DeckState) => deck.slideState);

  // interface with the theme
  const theme = useTheme();

  // effect: mount the diagramRef on domRef init
  React.useEffect(() => {
    if (domRef.current && !diagramRef.current) {
      // @ts-ignore
      diagramRef.current = new MCMCDiagram({
        parentElm: domRef.current,
        startStage: map(slideState),
      });
    }
  }, [domRef.current, map, slideState]);

  React.useEffect(() => {
    if (diagramRef.current) {
      diagramRef.current.setStage(map(slideState), theme);
    }
  }, [slideState, map, diagramRef.current, theme]);

  // render a div
  return <div { ...props } ref={ domRef }>{ children }</div>;
}

export default MCMCDiagramManager;
