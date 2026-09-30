import { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { MultiSelectAutocomplete } from "./components/ui/multi-select-autocomplete";
import { Sheet, SheetContent, SheetTitle } from "./components/ui/sheet";

const options = [
  { id: 1, label: "Work", value: 1 },
  { id: 2, label: "Home", value: 2 },
];

function Repro() {
  const [areas, setAreas] = useState<(string | number)[]>([]);
  const [contexts, setContexts] = useState<(string | number)[]>([]);
  return (
    <Sheet open>
      <SheetContent>
        <SheetTitle>Edit node</SheetTitle>
        <label>Areas of focus</label>
        <MultiSelectAutocomplete options={options} value={areas} onChange={setAreas} placeholder="Search areas..." />
        <label>Contexts</label>
        <MultiSelectAutocomplete options={options} value={contexts} onChange={setContexts} placeholder="Search contexts..." />
        <button type="button">Save changes</button>
      </SheetContent>
    </Sheet>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Repro />);
