import React from 'react';
import shallow from 'zustand/shallow';

import { colorsByTheme } from '@utils/colors';
import useTheme from '@hooks/use-theme';
import { useDeck } from '@presentations';

export const myResearchMaxIndex = 20;

export default function MyResearch() {
  // interface with our theme to get the correct colors
  const theme = useTheme();
  const colors = colorsByTheme(theme);

  // interface with the deck to deduce the state
  const [slideState, getParentSlide] = useDeck(
    deck => [deck.slideState, deck.getParentSlide],
    shallow,
  );

  // use a ref to get the parent slide
  const ref = React.useRef(null);
  const slideIndex: number | undefined = React.useMemo(() => {
    if (ref.current) return getParentSlide(ref.current);
  }, [getParentSlide, ref.current]);

  // deduce the state of the venn-diagram
  let index: number;
  if (typeof slideState === 'undefined' || typeof slideIndex === 'undefined') {
    index = 0;
  } else {
    const { indexh, indexf } = slideState;
    if (indexh < slideIndex) index = 0;
    else if (indexh > slideIndex) index = myResearchMaxIndex;
    else index = indexf;
  }
  const visibleStyle = (visibleIndex: number) => ({  
    visibility: index < visibleIndex ? 'hidden' : 'visible'  
  });

  // render according to state and color
  return (
    <div className="w-3/5 pt-8 mx-auto" ref={ ref }>
      <svg className="w-full" viewBox="0 0 100 100">
        <g>
          <ellipse cx="50" cy="50" fill={ colors.orangeAlt } fillOpacity="0.75" rx="40" ry="50" />
          <text x="50" y="10" fontSize="5" fill={ colors.orange } textAnchor="middle">mathematics</text>
        </g>
        <g style={ visibleStyle(0) }>
          <ellipse cx="50" cy="55" fill={ colors.pinkAlt } fillOpacity="0.75" rx="35" ry="40" />
          <text x="50" y="25" fontSize="5" fill={ colors.pink } textAnchor="middle">probability</text>
        </g>
        <g 
          transform="translate(50, 65) rotate(60)"
          style={ visibleStyle(1) }>
          <ellipse cx="-15" cy="0" fill={ colors.greenAlt } fillOpacity="0.75" rx="25" ry="15" />
          <text x="-35" y="0" fontSize="5" fill={ colors.green }>monte</text>
          <text x="-30" y="5" fontSize="5" fill={ colors.green }>carlo</text>
        </g>
        <g
          transform="translate(50, 65) rotate(120)"
          style={ visibleStyle(2) }>
          <ellipse cx="-15" cy="0" fill={ colors.skyAlt } fillOpacity="0.75" rx="25" ry="15" />
          <text x="30" y="4" fontSize="5" fill={ colors.sky } textAnchor="end" transform="scale(-1, -1)">large</text>
          <text x="35" y="9" fontSize="5" fill={ colors.sky } textAnchor="end" transform="scale(-1, -1)">deviations</text>
        </g>
        <g style={ visibleStyle(3) }>
          <ellipse cx="50" cy="75" fill={ colors.yellowAlt } fillOpacity="0.75" rx="25" ry="15" />
          <text x="50" y="80" fontSize="5" fill={ colors.yellow } textAnchor="middle">"esoteric" objects</text>
        </g>
        <g style={ visibleStyle(4) }>
          <text fontSize="5" fill={ colors.text } transform="rotate(-85) translate(-70,30)">this talk</text>
          <g transform="translate(50, 65) rotate(60)">
            <path 
              stroke={ colors.text }
              strokeWidth="1"
              fill="none"
              d="M -23.8 -13.6 A 25,15 0 0,0 -9,15"
            />
          </g>
          <path 
            stroke={ colors.text }
            strokeWidth="1"
            fill="none"
            d="M 32.1 64.5 A 25,15 0 1,0 67,64.5"
          />
          <g transform="translate(50, 65) rotate(120)">
            <path 
              stroke={ colors.text }
              strokeWidth="1"
              fill="none"
              d="M -24 14 A 25,15 0 1,0 -9,-15"
            />
          </g>
        </g>
        <g style={ visibleStyle(5) }>
          <ellipse cx="50" cy="70" fill={ colors.tealAlt } fillOpacity="0.75" rx="50" ry="25" />
          <text fontSize="5" fill={ colors.teal } textAnchor="middle" transform="rotate(60) translate(70,30)">statistics</text>
          <path 
            fill={ colors.purpleAlt }
            fillOpacity="0.75"
            stroke="none"
            d="M 40 0 l 10 10 l -10 5 l 5 3 l -2 5 l 5 5 l 0 10 l -20 -4 M 10 50 l 10 0 l 0 -5 M 70 80 l 10 5 l -10 -8 l -5 -2 l -10 3 l 0 20 M 70 20 l 20 10 l 20 25 l -10 25 l -10 -5 l -10 -20 l 8 -16 M 50 50 l 20 10 l 20 30"
          />
          <text x="55" y="-92" fontSize="5" fill={ colors.purple } textAnchor="middle" transform="rotate(90)">machine learning</text>
        </g>
      </svg>
    </div>
  );
}
