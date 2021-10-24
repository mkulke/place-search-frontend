import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { mocked } from "ts-jest/utils";
import SearchResult from "./SearchResult";
import * as data from "./data";

jest.mock("./data", () => ({
  index: {
    search: jest.fn(),
  },
  parse: jest.fn(),
}));
const mockedData = mocked(data, true);

let container: HTMLDivElement | null = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  unmountComponentAtNode(container!);
  container!.remove();
  container = null;
});

it("searches empty queries", async () => {
  mockedData.index.search.mockResolvedValue({ hits: [] } as any);

  await act(async () => {
    render(<SearchResult q="" />, container);
  });

  expect(mockedData.index.search).toHaveBeenCalled();
  expect(container!.querySelector(".result")).toBeTruthy();
  expect(container!.querySelector(".result")!.children).toHaveLength(0);
});

it("does not parse addresses for a query length <= 3", async () => {
  mockedData.index.search.mockResolvedValue({ hits: [] } as any);

  await act(async () => {
    render(<SearchResult q="abc" />, container);
  });

  expect(mockedData.index.search).toHaveBeenCalled();
  expect(mockedData.parse).not.toHaveBeenCalled();
});

it("shows results", async () => {
  const place = {
    id: "1",
    name: "a place",
    type: "poi",
    locality: "somewhere",
  };

  mockedData.parse.mockResolvedValue(null);
  mockedData.index.search.mockResolvedValue({
    hits: [
      {
        ...place,
        _formatted: place,
      },
    ],
  } as any);

  await act(async () => {
    render(<SearchResult q="abcd" />, container);
  });

  expect(mockedData.parse).toHaveBeenCalled();
  expect(mockedData.index.search).toHaveBeenCalled();
  expect(container!.querySelector(".result")!.children).toHaveLength(1);
  expect(container!.querySelector("table.hit td.value")!.textContent).toBe(
    "a place"
  );
});
