import _ from "lodash";
import { usaStates } from "typed-usa-states";

import { MetroArea } from "./types";

export function stateAbbreviationToName(abbreviation: string) {
  return usaStates.find(state => state.abbreviation === abbreviation)?.name;
}

export function stateNameToAbbreviation(name: string) {
  return usaStates.find(state => state.name === name)?.abbreviation;
}

function stringMatchesMetroAreaCity(string: string, metroArea: MetroArea) {
  return _.some(metroArea.cities, city => string.includes(city));
}

function stringMatchesMetroAreaState(string: string, metroArea: MetroArea) {
  return _.some(metroArea.states, state => string.includes(state));
}

function stringMatchesMetroAreaStateAbbreviation(string: string, metroArea: MetroArea) {
  const abbreviations = metroArea.states.map(stateNameToAbbreviation);
  return _.some(abbreviations, state => !!state && string.includes(state));
}

/**
 * Matches a string to a metro area if the string contains one of the metro area's city names and
 * the string contains the metro area state name.
 */
export function stringMatchesMetroArea(string: string, metroArea: MetroArea) {
  return stringMatchesMetroAreaCity(string, metroArea)
    && (
      stringMatchesMetroAreaState(string, metroArea)
        || stringMatchesMetroAreaStateAbbreviation(string, metroArea)
    );
}

export function metroAreaCitiesToTitle(cities: string[]) {
  return cities.join(" / ");
}

export function metroAreaTitle(metroArea: MetroArea) {
  return metroAreaCitiesToTitle(metroArea.cities);
}
