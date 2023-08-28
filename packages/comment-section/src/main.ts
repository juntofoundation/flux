import "preact/debug";
import { toCustomElement } from "@fluxapp/react-web";
import MyComponent from "./App";
import Editor from "@fluxapp/flux-editor";
import "@fluxapp/ui/dist/main.d.ts";

if (!customElements.get("flux-editor")) {
  customElements.define("flux-editor", Editor);
}

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;