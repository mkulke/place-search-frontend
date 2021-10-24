import React, {useState} from "react";
import "./Search.scss";
import SearchResult from "./SearchResult";

export default function Search() {
  const [query, setQuery] = useState("");

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
      <SearchResult q={query}/>
    </div>
  );
}
