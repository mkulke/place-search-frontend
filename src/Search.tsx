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

async function parseAddress(q: string): Promise<Address | null> {
  if (q.length < 3) {
    return null;
  }
  const parseParams = new URLSearchParams({ q });
  const response = await fetch(`${ADDRESS_PARSER_URL}/parse?${parseParams}`);
  const address = response.json();
  return address;
}

type Value = `${Key} = ${string}`;

function buildFilters(address: Address): Value[] {
  const filter: Value[] = [`number = ${address.houseNumber}`];
  if (address.zipCode !== undefined) {
    filter.push(`zip = ${address.zipCode}`);
  }
  return filter;
}

export default function Search() {
  const [hits, setHits] = useState<Hits>([]);

  const client = new MeiliSearch({
    host: MS_URL,
  });
  const index = client.index("places");

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    const address = await parseAddress(q);
    const filter =
      address !== null
        ? [
            ["type = poi", "type = stop", "type = address"],
            ...buildFilters(address),
          ]
        : [["type = poi", "type = stop"]];
    const search = await index.search(q, {
      sort: [`_geoPoint(${SEARCH_LOC.lat},${SEARCH_LOC.lon}):asc`],
      filter,
      matches: true,
      attributesToHighlight: [...KEYS],
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
