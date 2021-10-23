import React, { useState, useEffect } from "react";
import { MeiliSearch, Hits, Hit, Index } from "meilisearch";
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
] as const;

type Key = typeof KEYS[number];

const MS_URL = "http://127.0.0.1:7700";
const ADDRESS_PARSER_URL = "http://127.0.0.1:8080";
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

interface Address {
  street: string;
  houseNumber: string;
  city?: string;
  zipCode?: string;
  state?: string;
}

async function parseAddress(
  q: string,
  signal: AbortSignal
): Promise<Address | null> {
  if (q.length < 3) {
    return null;
  }
  const parseParams = new URLSearchParams({ q });
  const response = await fetch(`${ADDRESS_PARSER_URL}/parse?${parseParams}`, {
    signal,
  });
  const address = response.json();
  return address;
}

async function search(
  index: Index,
  q: string,
  signal: AbortSignal
): Promise<Hits> {
  const address = await parseAddress(q, signal);
  const filter =
    address !== null
      ? [
          ["type = poi", "type = stop", "type = address"],
          ...buildFilters(address),
        ]
      : [["type = poi", "type = stop"]];
  const search = await index.search(
    q,
    {
      sort: [`_geoPoint(${SEARCH_LOC.lat},${SEARCH_LOC.lon}):asc`],
      filter,
      matches: true,
      attributesToHighlight: [...KEYS],
    },
    { signal }
  );

  return search.hits;
}

type FilterExpr = `${Key} = ${string}`;
function buildFilters(address: Address): FilterExpr[] {
  const filter: FilterExpr[] = [`number = ${address.houseNumber}`];
  if (address.zipCode !== undefined) {
    filter.push(`zip = ${address.zipCode}`);
  }
  return filter;
}

export default function Search() {
  const [hits, setHits] = useState<Hits>([]);
  const [query, setQuery] = useState("");

  const client = new MeiliSearch({
    host: MS_URL,
  });
  const index = client.index("places");

  useEffect(() => {
    const abortCtrl = new AbortController();
    search(index, query, abortCtrl.signal)
      .then(setHits)
      .catch((error) => {
        if (abortCtrl.signal.aborted !== true) {
          throw error;
        }
      });
    return () => abortCtrl.abort();
  }, [query]);

  return (
    <div className="search">
      <input
        type="search"
        placeholder="Search here…"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        onChange={(event) => setQuery(event.target.value)}
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
