import React from "react";
import "../node_modules/flexboxgrid/dist/flexboxgrid.min.css";
import Search from "./Search";

function App() {
  return (
    <div className="App">
      <div className="row middle-xs">
        <div className="col-md-4" />
        <div className="col-md-4">
          <Search />
        </div>
        <div className="col-md-4" />
      </div>
    </div>
  );
}

export default App;
