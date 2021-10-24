import React, {useState, useEffect} from "react";
import { Hits, Hit, Index } from "meilisearch";
import "./Search.scss";
import { Address, index, parse } from "./data";

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

async function search(
  index: Index,
  q: string,
  signal: AbortSignal
): Promise<Hits> {
  const address = q.length > 3 ? await parse(q, signal) : null;
  // const address = await parse(q, signal);
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

type Key = typeof KEYS[number];
type FilterExpr = `${Key} = ${string}`;

function buildFilters(address: Address): FilterExpr[] {
  const filter: FilterExpr[] = [`number = ${address.houseNumber}`];
  if (address.zipCode !== undefined) {
    filter.push(`zip = ${address.zipCode}`);
  }
  return filter;
}

function useSearch(query: string) {
  const [hits, setHits] = useState<Hits>([]);

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

  return [ hits ]
}

interface Props {
  q: string;
}

export default function SearchResult(props: Props) {
  const [hits] = useSearch(props.q);

  return (
    <div className="result">
      {hits.map((hit) => (
        <table className="hit" key={hit.id}>
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
