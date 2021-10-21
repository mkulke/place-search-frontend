import React, { useState } from "react";
import { MeiliSearch, Hits, Hit } from "meilisearch";
import "./Search.scss";

const KEYS = [
  "name",
  "type",
  "altName",
  "locality",
  "borough",
  "street",
  "number",
  "zip",
];

const MS_URL = "http://127.0.0.1:7700";
const SEARCH_LOC = {
  lon: 8.424122095834845,
  lat: 49.008193861269945,
};

function getFormattedValue(hit: Hit, key: string): JSX.Element {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: hit["_formatted"]?.[key],
      }}
    />
  );
}

// TODO: flawed, this will turn "Bar 25" into an address with strict
// matches on zip or house no.

type NumberFilter = [string, string][] | undefined;
function buildNumberFilter(q: string): NumberFilter {
  const tokens = q.replace(/[^a-zA-Z0-9 ]/g, "").split(" ");

  // less than two tokens
  if (tokens.length < 2) {
    return undefined;
  }

  // tokens which look like numbers
  const noTokens = tokens.filter((token) => token.match(/^\d+/) !== null);

  // more than two numbers
  if (noTokens.length > 2) {
    return undefined;
  }

  // either houseno or zip
  if (noTokens.length === 1) {
    const number = noTokens[0];
    return [[`number = ${number}`, `zip = ${number}`]];
  }

  // houseno and zip
  if (noTokens.length === 2) {
    const [number0, number1] = noTokens;
    return [
      [`number = ${number0}`, `number = ${number1}`],
      [`zip = ${number1}`, `zip = ${number1}`],
    ];
  }

  return undefined;
}

export default function Search() {
  const [hits, setHits] = useState<Hits>([]);

  const client = new MeiliSearch({
    host: MS_URL,
  });
  const index = client.index("places");

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    const nFilter = buildNumberFilter(q);
    const filter =
      nFilter !== undefined
        ? [["type = poi", "type = stop", "type = address"], ...nFilter]
        : [["type = poi", "type = stop"]];
    const search = await index.search(q, {
      sort: [`_geoPoint(${SEARCH_LOC.lat},${SEARCH_LOC.lon}):asc`],
      filter,
      matches: true,
      attributesToHighlight: KEYS,
    });

    setHits(search.hits);
  };

  return (
    <div className="search">
      <input
        type="search"
        placeholder="Search here…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        onChange={onChange}
      />
      {hits.map((hit) => (
        <table className="hits" key={hit.id}>
          <tbody>
            {KEYS.filter((key) => hit[key] !== undefined).map((key) => (
              <tr key={`${hit.id}-${key}`}>
                <td className="key">{key}</td>
                <td className="value">{getFormattedValue(hit, key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
