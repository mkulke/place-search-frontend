import { MeiliSearch } from "meilisearch";

const MS_URL = "http://127.0.0.1:7700";
const MS_INDEX = "places"
const PARSER_URL = "http://127.0.0.1:8080";

const client = new MeiliSearch({
  host: MS_URL,
});

const index = client.index(MS_INDEX);

interface Address {
  street: string;
  houseNumber: string;
  city?: string;
  zipCode?: string;
  state?: string;
}

async function parse(q: string, signal: AbortSignal): Promise<null | Address> {
  const parseParams = new URLSearchParams({ q });
  const response = await fetch(`${PARSER_URL}/parse?${parseParams}`, {
    signal,
  });
  return response.json();
}

export {
  Address,
  index,
  parse,
}
