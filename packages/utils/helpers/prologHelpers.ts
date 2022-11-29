import { EntryType, ModelProperty } from "../types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function generateFindAll(propertyName, predicate) {
  const name = capitalizeFirstLetter(propertyName);
  return `findall((${name}, ${name}Timestamp, ${name}Author), link(Source, "${predicate}", ${name}, ${name}Timestamp, ${name}Author), ${name})`;
}

export function generatePrologQuery({
  id,
  type,
  source,
  properties,
}: {
  id?: string;
  source?: string;
  type: EntryType;
  properties: {
    [x: string]: ModelProperty;
  };
}) {
  const idParam = id ? `"${id}"` : `Id`;
  const sourceParam = source ? `"${source}"` : `Source`;

  const propertyNames = Object.keys(properties).reduce((acc, name) => {
    const concatVal = acc === "" ? "" : ", ";
    return acc.concat(concatVal, capitalizeFirstLetter(name));
  }, "");

  const findProperties = Object.keys(properties).reduce((acc, name) => {
    const property = properties[name];
    const concatVal = acc === "" ? "" : ", ";
    return acc.concat(concatVal, generateFindAll(name, property.predicate));
  }, "");

  const entryQuery = `
    entry_query(Source, Type, Id, Timestamp, Author, ${propertyNames}):-
      link(Source, Type, Id, Timestamp, Author),
      ${findProperties}
  `;

  const entry = `
    entry(Source, Id, Timestamp, Author, ${propertyNames}):- 
      entry_query(Source, "${type}", Id, Timestamp, Author, ${propertyNames})
  `;

  return {
    assertQuery: `assertz((${entryQuery})).`,
    assertEntry: `assertz((${entry})).`,
    query: `entry(${sourceParam}, ${idParam}, Timestamp, Author, ${propertyNames}).`,
    retractQuery: `retract((${entryQuery})).`,
    retractEntry: `retract((${entry})).`,
  };
}

export async function queryProlog({
  perspectiveUuid,
  id,
  type,
  source,
  properties,
}: {
  perspectiveUuid: string;
  id?: string;
  source?: string;
  type: EntryType;
  properties: {
    [x: string]: ModelProperty;
  };
}) {
  const client = await getAd4mClient();

  const { query, assertQuery, assertEntry, retractQuery, retractEntry } =
    generatePrologQuery({
      id,
      type,
      source,
      properties,
    });

  await client.perspective.queryProlog(perspectiveUuid, assertQuery);
  await client.perspective.queryProlog(perspectiveUuid, assertEntry);

  const links = await client.perspective.queryProlog(perspectiveUuid, query);

  await client.perspective.queryProlog(perspectiveUuid, retractQuery);
  await client.perspective.queryProlog(perspectiveUuid, retractEntry);

  return extractPrologResults(
    links,
    Object.keys(properties).map((name) => capitalizeFirstLetter(name))
  );
}

export function extractPrologResults(
  prologResults: any,
  values: string[]
): any[] {
  if (prologResults === null || prologResults === false) {
    return [];
  }
  if (!Array.isArray(prologResults)) {
    prologResults = [prologResults];
  }

  const results = [] as any[];

  for (const prologResult of prologResults) {
    const result = {};
    for (const value of values) {
      const prologResultValue = prologResult[value];
      if (!prologResultValue.head) {
        if (prologResultValue !== "[]" && !prologResultValue.variable) {
          result[value] = prologResultValue;
        } else {
          result[value] = [];
        }
      } else {
        const temp = [] as any[];
        const prologResultValueHead = prologResultValue.head;
        let prologResultValueTail = prologResultValue.tail;
        temp.push({
          content: prologResultValueHead.args[0],
          timestamp: new Date(prologResultValueHead.args[1].args[0]),
          author: prologResultValueHead.args[1].args[1],
        });
        while (typeof prologResultValueTail !== "string") {
          temp.push({
            content: prologResultValueTail.head.args[0],
            timestamp: new Date(prologResultValueTail.head.args[1].args[0]),
            author: prologResultValueTail.head.args[1].args[1],
          });
          prologResultValueTail = prologResultValueTail.tail;
        }
        result[value] = temp;
      }
    }
    results.push(result);
  }
  return results;
}
